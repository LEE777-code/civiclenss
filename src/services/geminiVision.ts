import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("VITE_GEMINI_API_KEY is not set. Please adding it to your .env file.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Using gemini-3-flash-preview as explicitly requested by user
const MODEL_NAME = 'gemini-3-flash-preview';

export type Department =
    | "Electricity (TNEB)"
    | "Water Board"
    | "Municipality / Corporation"
    | "Roads & Highways"
    | "Sanitation"
    | "Public Works Department (PWD)"
    | "General Civic";

export type Severity = "Emergency" | "High" | "Medium" | "Low";

export interface GrievanceAnalysis {
    title: string;
    department: Department;
    category: string;
    severity: Severity;
    confidence: number;
    description: string;
}


const SYSTEM_INSTRUCTION = `
You are an AI assistant embedded in a Citizen Grievance Reporting System used by the Government.
Your role is to analyze civic issue images and optional voice/text input submitted by citizens and return structured, reliable, and governance-ready outputs.

🎯 TASK OBJECTIVE
Analyze the provided image and optional text/voice input to identify civic issues (road damage, garbage, power line, water leak, etc.).

🏛️ ALLOWED DEPARTMENTS / CATEGORIES (STRICT - CHOOSE ONE)
1. Roads & Maintenance (Potholes, Damaged Roads, Footpath issues)
2. Streetlights & Electricity (Non-functioning lights, Dangling wires, TNEB issues)
3. Water Supply (Leakage, No Supply, Quality issues)
4. Drainage & Storm Water (Blocked drains, Sewage overflow, Stagnant water)
5. Garbage & Sanitation (Overflowing bins, Illegal dumping, Sweeping needed)
6. Public Health & Hygiene (Dead animals, Mosquito breeding, Public urination)
7. Parks & Playgrounds (Broken equipment, Maintenance, Overgrown bushes)
8. Public Transport (Bus stops, Shelters, Accessibility)
9. Traffic & Road Safety (Broken signals, Signboards, Illegal parking)
10. Encroachment (Illegal structures on public land, Footpath blocking)
11. Stray Animals (Aggressive dogs, Cattle nuisance)
12. Revenue & Tax (Property tax issues, Assessment)
13. Building Plan Violations (Illegal construction, Deviation)
14. Trees & Environment (Fallen trees, Pruning needed, Pollution)
15. Disaster Management (Flooding, Fire hazards, Landslides)

⚠️ SEVERITY RULES (STRICT)
- Emergency: Fallen electric wires, Major power outage, Flooding, Open manholes.
- High: Water leakage, Road collapse, Sewage overflow.
- Medium: Garbage pile, Broken streetlight.
- Low: Cleanliness issues, Minor cracks.

Never exaggerate severity.

🧾 OUTPUT FORMAT (STRICT JSON)
You must respond in valid JSON only with exactly these fields:
{
  "title": "Short issue title",
  "department": "One of the allowed categories from the list above",
  "category": "Exact Category Name from the list above",
  "severity": "Emergency/High/Medium/Low",
  "confidence": 0.0 to 1.0,
  "description": "Clear, simple explanation suitable for government records"
}

🛡️ FAIL-SAFE BEHAVIOR
If the image is unclear, not a civic issue, or confidence is < 0.6, return:
{
  "title": "Civic Issue Reported",
  "department": "Other",
  "category": "Other",
  "severity": "Medium",
  "confidence": 0.4,
  "description": "The reported image could not be clearly classified. Manual review required."
}

🌐 LANGUAGE HANDLING
If user input is in Tamil, respond in English. Keep descriptions simple and formal. 

🚫 HARD CONSTRAINTS
- Do NOT invent locations.
- Do NOT mention AI, Gemini, or models.
- Do NOT include legal advice or blame citizens.
- respond ONLY with the JSON object.
`;


/**
 * Helper to process image input (File or base64 string) into format for Gemini
 */
async function processImageInput(imageData: string | File): Promise<{ base64: string; mimeType: string }> {
    let base64Content: string;
    let mimeType: string = "image/jpeg";

    if (imageData instanceof File) {
        const buffer = await imageData.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i += 1024) {
            binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, Math.min(i + 1024, len))));
        }
        base64Content = btoa(binary);
        mimeType = imageData.type;
    } else {
        const split = imageData.split(',');
        if (split.length > 1) {
            base64Content = split[1];
            const mimeMatch = split[0].match(/:(.*?);/);
            if (mimeMatch) mimeType = mimeMatch[1];
        } else {
            base64Content = imageData;
        }
    }

    if (!mimeType || mimeType === 'application/octet-stream') {
        mimeType = 'image/jpeg';
    }

    return { base64: base64Content, mimeType };
}

export const analyzeGrievance = async (
    imageData: string | File,
    description?: string
): Promise<GrievanceAnalysis> => {
    try {
        const { base64, mimeType } = await processImageInput(imageData);

        const prompt = description
            ? `Analyze this civic issue. Image provided. Optional citizen context: "${description}"`
            : "Analyze this civic issue. Image provided.";

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64,
                        },
                    },
                    { text: prompt }
                ]
            },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                temperature: 0.1,
            },
        });

        const respAny = response as any;
        const text = typeof respAny.text === 'function' ? respAny.text() : respAny.text;

        if (!text) {
            throw new Error("No response from analysis engine.");
        }

        const cleanText = text.replace(/```json|```/gi, "").trim();
        return JSON.parse(cleanText) as GrievanceAnalysis;

    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        return {
            title: "Analysis Failure",
            department: "General Civic",
            category: "System Error",
            severity: "Medium",
            confidence: 0,
            description: "Critical system error during analysis. Manual verification required immediately."
        };
    }
};

// Re-export wrappers for legacy compatibility
export async function generateImageDescription(imageData: string | File): Promise<string> {
    const result = await analyzeGrievance(imageData);
    return result.description;
}

export async function generateImageTitle(imageData: string | File): Promise<string> {
    const result = await analyzeGrievance(imageData);
    return result.title;
}

export async function suggestCategory(imageData: string | File): Promise<string> {
    const result = await analyzeGrievance(imageData);
    return result.category;
}
