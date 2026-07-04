// src/types/tesseract.d.ts
declare module 'tesseract.js' {
  // minimal typing so TS stops complaining. You can refine later.
  export function createWorker(opts?: any): any;
  const Tesseract: any;
  export default Tesseract;
}
