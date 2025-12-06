const HF_MODEL_URL = "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large";
const PROMPT = `Describe the image in a simple, clear, factual way. Explain what objects or people are present, what actions are happening, visible signs, buildings, or public infrastructure, and any civic issues visible (such as garbage, traffic, road damage, etc.). Avoid assumptions.`;

function getApiKey(): string {
  // Vite exposes env vars prefixed with VITE_
  const key = (import.meta as any).env?.VITE_HF_API || "";
  return key;
}

export class HFError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "HFError";
    this.status = status;
  }
}

/**
 * Generate a caption for an image using Hugging Face Inference API (BLIP image captioning).
 * Returns only the caption string.
 */
export async function generateImageDescription(imageFile: File): Promise<string> {
  if (!imageFile || !(imageFile instanceof File)) throw new HFError("Invalid image file provided");
  if (!imageFile.type.startsWith("image/")) throw new HFError("File is not an image");

  const apiKey = getApiKey();
  if (!apiKey) throw new HFError("Missing Hugging Face API key. Set VITE_HF_API in your .env");

  // Limit size to something reasonable to avoid timeouts (optional): 20MB
  const MAX_BYTES = 20 * 1024 * 1024;
  if (imageFile.size > MAX_BYTES) throw new HFError("Image too large (max 20MB)");

  // Prepare multipart form data with the image and the instruction prompt
  const form = new FormData();
  form.append("file", imageFile, imageFile.name);
  // Some HF models accept an "inputs" field alongside the file
  form.append("inputs", PROMPT);

  // Use AbortController to implement a reasonable timeout (30s)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(HF_MODEL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        // Note: Do not set Content-Type when using FormData; browser sets the boundary automatically
      },
      body: form,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.status === 429) {
      throw new HFError("Rate limit exceeded (429). Please try again later.", 429);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new HFError(`Hugging Face API error: ${res.status} ${res.statusText} ${text}`, res.status);
    }

    const data = await res.json().catch(() => null);

    // The HF inference response shape can vary. Try several common patterns for a caption:
    // - An array where first element has 'generated_text' or 'caption' or 'text'
    // - An object with a 'generated_text' or 'caption' property
    // - A plain array of strings

    let caption: string | null = null;

    if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      if (typeof first === "string") caption = first;
      else if (first && typeof first === "object") {
        caption = (first.generated_text || first.caption || first.text || first[0]) as string | null;
      }
    } else if (data && typeof data === "object") {
      caption = (data.generated_text || data.caption || data.text) as string | null;
    } else if (typeof data === "string") {
      caption = data;
    }

    if (!caption || typeof caption !== "string" || caption.trim().length === 0) {
      throw new HFError("No caption returned from the model");
    }

    return caption.trim();
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new HFError("Request timed out while contacting Hugging Face API");
    }

    // Fetch failing with TypeError frequently indicates network/CORS issues when called from browser
    if (err instanceof TypeError || (err?.message && err.message.includes('Failed to fetch'))) {
      throw new HFError(
        "Network error contacting Hugging Face API. This can be caused by CORS blocking or network connectivity. For production, use a server-side proxy to keep the API key secret and avoid CORS issues.",
      );
    }

    if (err instanceof HFError) throw err;
    throw new HFError(err?.message || String(err));
  } finally {
    clearTimeout(timeout);
  }
}

export default generateImageDescription;
