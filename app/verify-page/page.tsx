"use client";

import { useState } from "react";

export default function VerifyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!file) return alert("Please upload a signed PDF");

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("pdf_data", file);

      const res = await fetch("/api/verify-upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ error: err.message || "Verification failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 bg-white min-h-screen text-black">
      <h1 className="text-2xl font-bold mb-4">Verify Signed PDF</h1>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => {
          if (e.target.files) setFile(e.target.files[0]);
        }}
      />

      <button
        onClick={handleVerify}
        className="bg-green-600 text-black px-4 py-2 ml-4 mt-2"
        disabled={loading}
      >
        {loading ? "Verifying..." : "Verify"}
      </button>

      {result && (
        <pre className="mt-6 bg-gray-100 p-4 rounded text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
