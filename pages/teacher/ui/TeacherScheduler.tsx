
  import { GoogleGenerativeAI } from "@google/generative-ai";
  import jsPDF from "jspdf";
  import { Document, Packer, Paragraph, TextRun } from "docx";
  import { saveAs } from "file-saver";


  import React from 'react';
  import TimetableView from '../../../widgets/timetable';
  import { ScheduleItem, Conflict } from '../../../entities/schedule';
  import DashboardCard from '../../../shared/ui/card';

  import * as pdfjsLib from "pdfjs-dist";
  import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.js?url";
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  import mammoth from "mammoth";
  import * as XLSX from "xlsx";



  // Icons for KPIs
  const ClassesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" /></svg>;
  const AssignmentsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
  const ExamIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494m-9-8.994v4.992m18-4.992v4.992M5.571 6.345a9 9 0 0112.858 0M5.571 17.655a9 9 0 0112.858 0" /></svg>;


  interface TeacherSchedulerProps {
    teacherName: string;
    schedule: ScheduleItem[];
    conflicts: Conflict[];
  }

  const TeacherScheduler: React.FC<TeacherSchedulerProps> = ({ teacherName, schedule, conflicts }) => {
    const teacherSchedule = schedule.filter(item => item.teacher === teacherName);
    
    const handleItemClick = (item: ScheduleItem) => {
      alert(`Editing class: ${item.subject}`);
    }

    const kpis = [
        { label: "Classes This Week", value: teacherSchedule.length, icon: <ClassesIcon /> },
        { label: "Assignments Due", value: 5, icon: <AssignmentsIcon /> }, // Mock data
        { label: "Upcoming Exams", value: 2, icon: <ExamIcon /> }, // Mock data
    ];

    const [uploadedText, setUploadedText] = React.useState("");
    const [uploadStatus, setUploadStatus] = React.useState("");
    const [userPrompt, setUserPrompt] = React.useState("");
    const [aiOutput, setAiOutput] = React.useState("");


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const fileType = file.name.split('.').pop()?.toLowerCase();

  setUploadStatus(`📄 ${file.name} uploaded. Extracting...`);

  try {
    let extracted = "";

    if (fileType === "pdf") extracted = await extractPDF(file);
    else if (fileType === "docx") extracted = await extractDOCX(file);
    else if (fileType === "xlsx") extracted = await extractXLSX(file);
    else {
      setUploadStatus("❌ Unsupported file type.");
      return;
    }

    // ❗ DO NOT SHOW SYLLABUS NOW — ONLY STORE INTERNALLY
    setUploadedText(extracted);

    setUploadStatus("✅ Syllabus extracted successfully!");
  } catch (err) {
    console.error(err);
    setUploadStatus("❌ Failed to extract file.");
  }
};



    const extractPDF = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(" ") + "\n";
    }

    return text;
  };


    const extractDOCX = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };


  const extractXLSX = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    let text = "";

    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const sheetText = XLSX.utils.sheet_to_csv(sheet);
      text += sheetText + "\n";
    });

    return text;
  };
  // ⭐ Gemini Model Instance
  const genAI = new GoogleGenerativeAI("AIzaSyBdQozrEHmomhhf6So3SCCrWH23jgdxTYc");

  // ⭐ Weekly Schedule Generator
  const generateWeeklySchedule = async () => {
  console.log("Executing schedule generator...");

  if (!uploadedText) {
    setUploadedText("❌ Please upload a syllabus first.");
    return;
  }

  

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
You are an academic planner AI.

Use the syllabus below to generate the required schedule.
ALWAYS FOLLOW THE TEACHER'S INSTRUCTION EXACTLY.

-------------------------------------
SYLLABUS:
${uploadedText}
-------------------------------------

-------------------------------------
TEACHER'S INSTRUCTION:
${userPrompt}
-------------------------------------

🎯 VERY IMPORTANT FORMATTING RULES (DO NOT BREAK THEM):

1. ALWAYS start with:
📘 Weekly Schedule

2. For each day, the heading MUST be:
📅 Monday:
📅 Tuesday:
📅 Wednesday:
(and so on)

3. Under every day, use ONLY these bullet points:
• Topic — short explanation (time in mins)

4. A blank line MUST appear between each day's section.

5. Do NOT generate Monday–Saturday unless teacher requests.
   If teacher says “only Wednesday class”, output only that.

6. Do NOT merge lines. Each bullet must be a SEPARATE line.

7. No paragraphs, no long blocks, no extra symbols.

8. The entire output must follow this TEMPLATE EXACTLY:

📘 Weekly Schedule

📅 <Day>:
• <Topic> — <short explanation> (<time> mins)
• <Topic> — <short explanation> (<time> mins)

(blank line)

📅 <Next Day>:
• <Topic> — <short explanation> (<time> mins)

(blank line)

(continue based on teacher instruction)
`;


  const response = await model.generateContent(prompt);
  const result = await response.response.text();

  console.log("AI result:", result);

  setAiOutput(result);
  setUploadStatus("✅ Weekly Plan Generated Successfully!");
};

const downloadAsPDF = () => {
  const doc = new jsPDF();
  const lines = aiOutput.split("\n");

  let y = 10;

  lines.forEach((line) => {
    if (y > 280) {
      doc.addPage();
      y = 10;
    }
    doc.text(line, 10, y);
    y += 8;
  });

  doc.save("weekly_schedule.pdf");
};


const downloadAsDOCX = async () => {
  const doc = new Document({
    sections: [
      {
        children: aiOutput.split("\n").map((line) =>
          new Paragraph({
            children: [new TextRun(line)],
          })
        ),
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "weekly_schedule.docx");
};



    return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold text-white">Hi, {teacherName}</h1>
        <p className="text-gray-400 mt-1">Here’s your teaching dashboard.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map(kpi => (
          <DashboardCard key={kpi.label} title={kpi.label} icon={kpi.icon} variant="light">
            <div className="mt-2 text-3xl font-semibold text-emerald-100">{kpi.value}</div>
          </DashboardCard>
        ))}
      </div>

      {/* ⭐ AI COMMAND CENTRE STARTS HERE ⭐ */}
      <div className="w-full bg-[#0F1115] border border-[#1F2125] rounded-2xl p-6 shadow-lg">

        {/* Title */}
        <h2 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
          <span>🤖</span> AI Command Center
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Use natural language, upload syllabus, and generate weekly study plans.
        </p>
        {uploadStatus && (
    <p className="text-sm text-green-400 mb-2">
      📄 {uploadStatus}
    </p>
  )}

        {/* Input Row */}
        <div className="flex items-center gap-3 w-full">

          {/* Chat Input */}
          <input
            type="text"
            placeholder="e.g., Generate weekly plan for CSE Unit 1 & 2..."
            className="flex-1 bg-[#1A1D21] border border-[#2A2D31] text-white rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-green-600"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
          />

          {/* Mic Button */}
          <button className="bg-[#1A1D21] hover:bg-[#222529] p-3 rounded-full border border-[#2A2D31] text-gray-300">
            🎤
          </button>

          {/* Hidden File Input */}
          <input 
            type="file"
            id="syllabusUpload"
            accept=".pdf,.docx,.xlsx"
            className="hidden"
            onChange={(e) => handleFileUpload(e)}
          />

          {/* Upload (+) Button */}
          <button
            onClick={() => document.getElementById("syllabusUpload")?.click()}
            className="bg-[#1A1D21] hover:bg-[#222529] p-3 rounded-full border border-[#2A2D31] text-gray-300"
          >
            +
          </button>

          {/* Execute Button */}
          <button 
          onClick={generateWeeklySchedule}
          className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-full text-white font-medium"
          >
            Execute
            </button>

        </div>

        {/* AI Output Box */}
        <div 
        className="mt-5 bg-[#131518] border border-[#1F2125] rounded-xl p-4 min-h-[150px] text-gray-300 text-sm whitespace-pre-line">
        {aiOutput ? aiOutput : "AI responses will appear here…"}
        </div>
        {/* Download Buttons */}
{aiOutput && (
  <div className="flex items-center gap-3 mt-4">
    <button
      onClick={downloadAsPDF}
      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"
      type="button"
    >
      Download PDF
    </button>

    <button
      onClick={downloadAsDOCX}
      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-sm"
      type="button"
    >
      Download DOCX
    </button>
  </div>
)}



      </div>
      {/* ⭐ AI COMMAND CENTRE ENDS HERE ⭐ */}

      {/* Weekly Schedule */}
      <DashboardCard title="My Weekly Schedule">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 -mt-4">
          <p className="text-sm text-gray-400">Click a class to view details or request changes.</p>
          <button className="px-5 py-3 bg-emerald-600 text-white rounded-3xl hover:bg-emerald-700 transition shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-emerald-500 w-full sm:w-auto">
            Request Substitute
          </button>
        </div>
        
        <TimetableView 
          schedule={teacherSchedule} 
          conflicts={conflicts} 
          onItemClick={handleItemClick}
        />
      </DashboardCard>

    </div>
  );
  };

  export default TeacherScheduler;