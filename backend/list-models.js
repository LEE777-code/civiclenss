import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.log("No API Key found in env");
    process.exit(1);
}

// REST call to list models
async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        if (data.models) {
            // Filter for models with 'flash' in the name
            const flashModels = data.models.filter(m => m.name.includes("1.5-flash"));
            console.log(JSON.stringify(flashModels, null, 2));
        } else {
            console.log("No models property in response:", data);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
