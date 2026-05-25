"use client";

import { useState, useRef } from "react";

export default function VerifyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (f && f.type === "application/pdf") {
      setFile(f);
      setResult(null);
    }
  };

  const handleVerify = async () => {
    if (!file) return;
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

  const isValid = result && !result.error && result?.data?.message?.[1] === true;
  const isFailed = result && !result.error && result?.data?.message?.[1] === false;
  const isError = result?.error;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 mb-4">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verify Signed PDF</h1>
          <p className="text-gray-500 text-sm mt-1">Upload a signed PDF to verify its signature via RC Vault</p>
        </div>

        {/* Upload card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">

          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-3 py-10 px-6
              ${dragOver
                ? "border-blue-400 bg-blue-50"
                : file
                ? "border-green-400 bg-green-50"
                : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
              }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />

            {file ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-800 text-sm">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                  className="text-xs text-red-500 hover:text-red-700 underline"
                >
                  Remove
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">Drop your PDF here</p>
                  <p className="text-xs text-gray-400 mt-0.5">or click to browse</p>
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">PDF only</span>
              </>
            )}
          </div>

          {/* Verify button */}
          <button
            onClick={handleVerify}
            disabled={!file || loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Verifying...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                Verify Signature
              </>
            )}
          </button>

          {/* Result */}
          {result && (
            <div className={`rounded-xl border p-4 ${
              isValid
                ? "bg-green-50 border-green-200"
                : isError
                ? "bg-red-50 border-red-200"
                : "bg-red-50 border-red-200"
            }`}>
              <div className="flex items-center gap-3 mb-3">
                {isValid ? (
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                <div>
                  <p className={`font-semibold text-sm ${isValid ? "text-green-800" : "text-red-800"}`}>
                    {isValid ? "Signature Valid" : isError ? "Verification Error" : "Signature Invalid"}
                  </p>
                  <p className={`text-xs mt-0.5 ${isValid ? "text-green-600" : "text-red-600"}`}>
                    {isValid ? "This document has not been tampered with." : isError ? result.error : "The signature could not be verified."}
                  </p>
                </div>
              </div>

              {/* Raw JSON toggle */}
              <details className="mt-1">
                <summary className={`text-xs cursor-pointer select-none font-medium ${isValid ? "text-green-700" : "text-red-700"}`}>
                  View raw response
                </summary>
                <pre className={`mt-2 text-xs rounded-lg p-3 overflow-x-auto ${isValid ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}`}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}