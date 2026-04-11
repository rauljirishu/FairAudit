import { GoogleGenAI } from "@google/genai";
import { BiasMetrics } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface GeminiFairnessResponse {
  summary: string;
  grade: "A" | "B" | "C" | "D" | "F";
}

export async function explainFairnessMetrics(
  metrics: BiasMetrics,
  protectedCol: string,
  totalRows: number
): Promise<GeminiFairnessResponse> {
  const payload = {
    protectedAttribute: protectedCol,
    totalRows: totalRows,
    groups: Object.keys(metrics.selectionRates),
    selectionRates: metrics.selectionRates,
    demographicParity: metrics.demographicParityDiff,
    disparateImpact: metrics.disparateImpactRatio,
    severity: metrics.demographicParityDiff > 0.3 ? "CRITICAL" : metrics.demographicParityDiff > 0.2 ? "HIGH" : metrics.demographicParityDiff > 0.1 ? "MEDIUM" : "LOW"
  };

  const systemPrompt = "You are a fairness expert explaining AI bias to non-technical HR managers. Use simple everyday language. No technical jargon. Max 4 sentences.";
  const userPrompt = `Explain what this bias data means for real people. What is happening? Who is being affected? Why is this a problem? Keep it simple and human. Data: ${JSON.stringify(payload)}`;

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API timeout")), 10000)
    );

    const generatePromise = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const summary = response.text || "";
    
    // Determine grade based on severity
    let grade: "A" | "B" | "C" | "D" | "F" = "C";
    const diff = metrics.demographicParityDiff;
    if (diff < 0.1) grade = "A";
    else if (diff < 0.2) grade = "C";
    else if (diff < 0.3) grade = "D";
    else grade = "F";

    return { summary, grade };
  } catch (error) {
    console.error("Gemini API Error:", error);
    let grade: "A" | "B" | "C" | "D" | "F" = "C";
    const diff = metrics.demographicParityDiff;
    if (diff < 0.1) grade = "A";
    else if (diff < 0.2) grade = "C";
    else if (diff < 0.3) grade = "D";
    else grade = "F";

    return {
      summary: `Our AI found significant bias in your dataset. The ${protectedCol} group shows unequal treatment in outcomes. This needs immediate attention.`,
      grade
    };
  }
}
