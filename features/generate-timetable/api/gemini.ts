

import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ScheduleItem, DayOfWeek } from '../../../entities/schedule';
import { Resource } from '../../../entities/resource';
import { MOCK_SUBJECTS, DAYS_OF_WEEK } from '../../../shared/config';


// Ensure you have the API key in your environment variables
// Prefer GEMINI_API_KEY but also accept API_KEY for flexibility
const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you might want to handle this more gracefully.
  // For this context, we will proceed, but API calls will fail.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

// Helper to normalize response.text regardless of SDK variant
async function getResponseText(response: any): Promise<string> {
  try {
    if (!response) return "";
    if (typeof response.text === "function") {
      const txt = await response.text();
      return typeof txt === "string" ? txt : JSON.stringify(txt);
    }
    if (typeof response.text === "string") {
      return response.text;
    }
    // Some SDK versions return candidates[0].content.parts[0].text
    if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
      return response.candidates[0].content.parts[0].text as string;
    }
    // Fallback: try stringify
    return JSON.stringify(response);
  } catch {
    return "";
  }
}

const generateColor = () => {
    const colors = ['bg-blue-200', 'bg-indigo-200', 'bg-purple-200', 'bg-green-200', 'bg-yellow-200', 'bg-pink-200', 'bg-teal-200'];
    return colors[Math.floor(Math.random() * colors.length)];
}


export const processAdminCommand = async (command: string): Promise<any[]> => {
  if (!API_KEY) throw new Error("Gemini API key is not configured.");
  
  const systemInstruction = `You are a powerful AI orchestrator for school administration. Your task is to interpret a user's natural language command and convert it into a structured JSON array of discrete actions. You must break down complex requests into multiple individual actions.

  Supported actions are:
  - 'create_department': { "action": "create_department", "name": "Department Name" }. You MUST provide the 'name'.
  - 'add_teaching_staff': { "action": "add_teaching_staff", "departmentName": "Department Name", "staffName": "Staff Name" }. You MUST provide both 'departmentName' and 'staffName'.
  - 'create_room': { "action": "create_room", "name": "Room Name", "capacity": 30 }. You MUST provide the 'name'. 'capacity' is an optional integer.
  - 'create_student_group': { "action": "create_student_group", "name": "Group Name" }. You MUST provide the 'name'.
  - 'set_constraint': { "action": "set_constraint", "detail": "A specific rule for the timetable, e.g., 'class duration is 50 minutes' or 'teacher Prinkya takes 5 classes'" }. You MUST provide the 'detail'.

  Return an empty array if the command is unclear. For a command like "Create a science lab with capacity for 25 students and add Mr. Fitz to the Science department", you must return two actions: one to create the room with capacity, and one to add the teacher to the department.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: command,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              action: { type: Type.STRING },
              name: { type: Type.STRING },
              departmentName: { type: Type.STRING },
              staffName: { type: Type.STRING },
              detail: { type: Type.STRING },
              capacity: { type: Type.INTEGER },
            },
            required: ["action"],
          }
        },
      },
    });
    const text = (await getResponseText(response)).trim();
    if (!text) throw new Error("Empty response from Gemini.");
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error processing admin command with Gemini:", error);
    const message = error?.message || String(error);
    if (message?.toLowerCase().includes("api key") || message?.toLowerCase().includes("unauthorized")) {
      throw new Error("Gemini API key is not configured or invalid.");
    }
    throw new Error("AI assistant failed to process the command.");
  }
};


export const generateTimetable = async (constraints: string, resources: Resource[], teachers: string[]): Promise<ScheduleItem[]> => {
  if (!API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }
  
  const roomIds = resources.filter(r => r.type === 'Room').map(r => r.id);
  const studentGroups = resources.filter(r => r.type === 'StudentGroup').map(r => r.name);

  if (studentGroups.length === 0) {
      throw new Error("Cannot generate schedule: No student groups have been created. Use the AI Command Center to add student groups first (e.g., 'create student group Grade 9').");
  }

  const systemInstruction = `
    You are an expert school timetable scheduler. Your task is to generate a conflict-free weekly class schedule based on a list of teachers, subjects, student groups, rooms, and user-defined constraints.
    
    You MUST adhere to the following rules:
    1.  The output MUST be a valid JSON array of schedule item objects.
    2.  Each object must conform to the provided JSON schema.
    3.  A teacher, student group, or room cannot be booked in two places at once.
    4.  Accurately interpret and apply all user-provided constraints. This is critical. Constraints may include specific class durations (e.g., 50 minutes), specific lunch break times (which should have no classes scheduled), and specific class loads for teachers (e.g., 'teacher X takes 5 classes'). You must calculate the endTime based on the startTime and the specified duration. If no duration is specified, assume 1 hour.
    5.  Ensure all IDs are unique strings.
    6.  The day must be one of: ${DAYS_OF_WEEK.join(', ')}.
    7.  The studentGroup must be one of: ${studentGroups.join(', ')}.
    8.  The teacher must be one of: ${teachers.join(', ')}.
    9.  The subject must be one of: ${MOCK_SUBJECTS.join(', ')}.
    10. The roomId must be one of: ${roomIds.join(', ')}.
  `;

  const prompt = `
    Generate a schedule based on the following constraints:
    ---
    ${constraints}
    ---
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "A unique identifier for the schedule item." },
              subject: { type: Type.STRING, description: "The subject of the class." },
              teacher: { type: Type.STRING, description: "The name of the teacher." },
              studentGroup: { type: Type.STRING, description: "The student group attending." },
              roomId: { type: Type.STRING, description: "The ID of the room." },
              day: { type: Type.STRING, description: "The day of the week." },
              startTime: { type: Type.STRING, description: "The start time in HH:MM format." },
              endTime: { type: Type.STRING, description: "The end time in HH:MM format." },
            },
            required: ["id", "subject", "teacher", "studentGroup", "roomId", "day", "startTime", "endTime"]
          },
        },
      },
    });

    const jsonText = (await getResponseText(response)).trim();
    const generatedSchedule: Omit<ScheduleItem, 'color'>[] = JSON.parse(jsonText);

    // Add a random color to each item for better visualization
    return generatedSchedule.map(item => ({
        ...item,
        day: item.day as DayOfWeek, // Cast to DayOfWeek type
        color: generateColor(),
    }));

  } catch (error: any) {
    console.error("Error generating timetable with Gemini:", error);
    const message = error?.message || String(error);
    if (message?.toLowerCase().includes("api key") || message?.toLowerCase().includes("unauthorized")) {
      throw new Error("Gemini API key is not configured or invalid.");
    }
    throw new Error("Failed to generate timetable. Please check the console for details.");
  }
};
