"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

type SignedForm = {
  id: string;
  studentName: string;
  formattedText: string;
  signature: string;
  createdAt: string;
};

export default function SignedFormsPage() {
  const [forms, setForms] = useState<SignedForm[]>([]);

  useEffect(() => {
    fetch("/api/list-signed-forms")
      .then((res) => res.json())
      .then((data) => setForms(data.allForms))
      .catch(() => toast.error("Failed to fetch saved forms"));
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied!")).catch(() => toast.error("Failed to copy"));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black p-6">
      <Toaster position="top-center" />
      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 text-center">Saved Signed Forms</h1>

        {forms.length === 0 && <p>No signed forms found.</p>}

        {forms.map((form) => (
          <div key={form.id} className="bg-gray-100 p-5 rounded-lg shadow">
            <p className="font-semibold text-black flex items-center justify-between">
              Student: {form.studentName}
            </p>
            <p className="text-sm text-gray-500 mb-2">Signed at: {new Date(form.createdAt).toLocaleString()}</p>

            <div className="mb-2">
              <p className="font-semibold flex items-center justify-between text-black">
                Formatted Text
                <button className="ml-2 bg-green-500 text-white px-3 py-1 rounded" onClick={() => copyToClipboard(form.formattedText)}>Copy</button>
              </p>
              <p className="break-all text-black">{form.formattedText}</p>
            </div>

            <div>
              <p className="font-semibold flex items-center justify-between text-black">
                Signature
                <button className="ml-2 bg-purple-500 text-white px-3 py-1 rounded" onClick={() => copyToClipboard(form.signature)}>Copy</button>
              </p>
              <p className="break-all text-blue-700">{form.signature}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}