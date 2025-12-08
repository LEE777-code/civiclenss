import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const VISION_MODEL = import.meta.env.VITE_VISION_MODEL || "gemini-2.0-flash-exp";

if (!API_KEY) {
    console.error("VITE_GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Converts a base64 data URL to the format required by Gemini API
 */
function base64ToGenerativePart(base64Data: string) {
    // Extract the base64 data and mime type from data URL
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
        throw new Error("Invalid base64 data URL");
    }

    return {
        inlineData: {
            mimeType: matches[1],
            data: matches[2],
        },
    };
}

/**
 * Generate a description for a civic issue from an image using Gemini Vision API
 * @param imageData - Base64 encoded image data URL
 * @returns Generated description of the civic issue
 */
export async function generateImageDescription(imageData: string): Promise<string> {
    try {
        if (!API_KEY) {
            throw new Error("Gemini API key is not configured");
        }

        const model = genAI.getGenerativeModel({ model: VISION_MODEL });

        const prompt = `Analyze this image of a civic issue and provide a detailed, objective description. 
Focus on:
1. The type of issue (e.g., pothole, garbage accumulation, broken streetlight, damaged infrastructure)
2. The severity and condition
3. Any safety concerns
4. Notable environmental factors
5. Approximate size or extent of the issue

Provide a clear, concise description in 2-3 sentences that would be useful for municipal authorities to understand and prioritize the issue.`;

        const imagePart = base64ToGenerativePart(imageData);

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        if (!text || text.trim().length === 0) {
            throw new Error("No description generated");
        }

        return text.trim();
    } catch (error) {
        console.error("Error generating image description:", error);
        throw error;
    }
}

/**
 * Generate a title suggestion for a civic issue from an image
 * @param imageData - Base64 encoded image data URL
 * @returns Generated title suggestion
 */
export async function generateImageTitle(imageData: string): Promise<string> {
    try {
        if (!API_KEY) {
            throw new Error("Gemini API key is not configured");
        }

        const model = genAI.getGenerativeModel({ model: VISION_MODEL });

        const prompt = `Analyze this image of a civic issue and suggest a brief, clear title (maximum 8 words).
The title should:
- Identify the type of issue (e.g., "Pothole", "Garbage Pile", "Broken Streetlight")
- Include location context if visible (e.g., "on Main Road", "at Park Entrance")
- Be concise and actionable

Provide ONLY the title, nothing else.`;

        const imagePart = base64ToGenerativePart(imageData);

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        if (!text || text.trim().length === 0) {
            throw new Error("No title generated");
        }

        return text.trim();
    } catch (error) {
        console.error("Error generating image title:", error);
        throw error;
    }
}

/**
 * Suggest a category for the civic issue based on the image
 * @param imageData - Base64 encoded image data URL
 * @returns Suggested category
 */
export async function suggestCategory(imageData: string): Promise<string> {
    try {
        if (!API_KEY) {
            throw new Error("Gemini API key is not configured");
        }

        const model = genAI.getGenerativeModel({ model: VISION_MODEL });

        const prompt = `Analyze this image of a civic issue and categorize it into ONE of these categories:
- Road Issues
- Garbage & Cleanliness
- Water / Drainage
- Streetlight / Electricity
- Public Safety
- Public Facilities
- Parks & Environment
- Other

Respond with ONLY the category name, nothing else.`;

        const imagePart = base64ToGenerativePart(imageData);

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text().trim();

        // Validate that the response is one of our categories
        const validCategories = [
            "Road Issues",
            "Garbage & Cleanliness",
            "Water / Drainage",
            "Streetlight / Electricity",
            "Public Safety",
            "Public Facilities",
            "Parks & Environment",
            "Other"
        ];

        const matchedCategory = validCategories.find(cat =>
            text.toLowerCase().includes(cat.toLowerCase())
        );

        return matchedCategory || "Other";
    } catch (error) {
        console.error("Error suggesting category:", error);
        return "Other";
    }
}
