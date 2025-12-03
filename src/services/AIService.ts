import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export const generateDescription = async (imageBase64: string): Promise<string | null> => {
    if (!API_KEY) {
        console.warn("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in .env");
        return null;
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = imageBase64.split(",")[1];

        const prompt = "Analyze this image of a civic issue (e.g., pothole, garbage, broken light). Describe the issue clearly and concisely in 2-3 sentences for a formal report. Focus on what is wrong and where it might be relative to the frame.";

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: "image/jpeg", // Assuming JPEG for simplicity, or extract from string
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        return text.trim();
    } catch (error) {
        console.error("Error generating description:", error);
        return null;
    }
};
