import React, { useState, useRef, useEffect } from "react";
import { generateImageDescription } from "@/services/hfService";

const ImageCaptioner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCaption(null);
    setError(null);
    const f = e.target.files?.[0] || null;
    if (f) setFile(f);
  };

  const handleGenerate = async () => {
    setError(null);
    setCaption(null);
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    setLoading(true);
    try {
      const result = await generateImageDescription(file);
      setCaption(result);
    } catch (err: any) {
      console.error(err);
      if (err?.message) setError(err.message);
      else setError("Failed to generate caption");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setCaption(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-3">Image Caption Generator</h2>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-3"
      />

      {previewUrl && (
        <div className="mb-3">
          <img src={previewUrl} alt="preview" className="w-full rounded-md object-cover" />
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <button
          onClick={handleGenerate}
          disabled={loading || !file}
          className="btn-primary"
        >
          {loading ? "Generating..." : "Generate description"}
        </button>
        <button onClick={reset} className="btn-secondary">Reset</button>
      </div>

      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}

      {caption && (
        <div className="card-elevated p-3">
          <h3 className="font-medium mb-2">Generated description</h3>
          <p className="text-sm text-muted-foreground">{caption}</p>
        </div>
      )}
    </div>
  );
};

export default ImageCaptioner;
