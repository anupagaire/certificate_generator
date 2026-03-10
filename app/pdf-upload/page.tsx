"use client";

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function UploadSignPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleUploadSign = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a PDF file");
      return;
    }

    toast.loading("Signing PDF...");

    try {
      const formData = new FormData();
      formData.append("pdf", uploadedFile);

      const res = await fetch("/api/sign-upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Signing failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `SIGNED_${uploadedFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success("PDF signed successfully!");

    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Something went wrong");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white transition-colors">
      <Toaster position="top-center" />

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl w-[400px] text-center transition-colors">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
          Upload & Sign PDF
        </h1>

        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setUploadedFile(e.target.files[0]);
            }
          }}
          className="mb-6 text-gray-800 dark:text-white"
        />

        <button
          onClick={handleUploadSign}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition"
        >
          Upload & Sign
        </button>
      </div>
    </div>
  );
}
