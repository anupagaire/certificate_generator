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
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationResults, setVerificationResults] = useState<Record<string, boolean>>({});
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});



  useEffect(() => {
    fetch("/api/list-signed-forms")
      .then((res) => res.json())
      .then((data) => setForms(data.allForms))
      .catch(() => toast.error("Failed to fetch saved forms"));
  }, []);

 const verifyForm = async (formId: string) => {
  setVerifyingId(formId);

  const textToVerify = editedTexts[formId] ?? forms.find(f => f.id === formId)?.formattedText;

  try {
    const res = await fetch("/api/verify-text-signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formId, textToVerify })    });

    const data = await res.json();

    if (res.ok) {
      setVerificationResults((prev) => ({ ...prev, [formId]: data.is_valid }));
      toast.success(`Verification ${data.is_valid ? "passed ✅" : "failed ❌"}`);
    } else {
      toast.error(data.error || "Verification failed");
    }
  } catch (err: any) {
    toast.error(err.message || "Verification failed");
  } finally {
    setVerifyingId(null);
  }
};

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success("Copied!"))
      .catch(() => toast.error("Failed to copy"));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950 p-6">
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-2">
          Saved Signed Forms
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Click "Verify" to check the validity of each form's signature.
        </p>

        {forms.length === 0 && (
          <p className="text-center text-gray-600">No signed forms found.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-white shadow-lg hover:shadow-xl transition-shadow rounded-2xl p-6 space-y-4 border border-gray-200"
            >
              <p className="font-semibold flex justify-between items-center">
                Student: {form.studentName}
                
              </p>

              <p className="text-sm text-gray-400">
                Signed at: {new Date(form.createdAt).toLocaleString()}
              </p>

              {/* Collapsible Details */}
              <details className="group border-t border-gray-200 pt-2">
                <summary className="cursor-pointer font-semibold text-gray-800 group-open:text-indigo-600">
                  View Form Details ▼
                </summary>
                <div className="mt-2 space-y-3">

                  <div>
                    <p className="font-semibold flex justify-between items-center">
                      Formatted Text
                      <button
                        className="ml-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition flex items-center gap-1"
                        onClick={() => copyToClipboard(form.formattedText)}
                      >
                         Copy
                      </button>
                    </p>
                    <textarea
                    //   readOnly
                      readOnly={false} // now editable

                      className="w-full p-3 border rounded-lg text-black break-all bg-gray-50"
                      rows={4}
                       value={editedTexts[form.id] ?? form.formattedText}
                       onChange={(e) =>
                          setEditedTexts((prev) => ({ ...prev, [form.id]: e.target.value }))
                        }
                    />
                  </div>

                  <div>
                    <p className="font-semibold flex justify-between items-center">
                      Signature
                      <button
                        className="ml-2 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-lg transition flex items-center gap-1"
                        onClick={() => copyToClipboard(form.signature)}
                      >
                         Copy
                      </button>
                    </p>
                    <textarea
                      readOnly
                      className="w-full p-3 border rounded-lg text-blue-800 break-all bg-gray-50"
                      rows={2}
                      value={form.signature}
                    />
                  </div>
                </div>
              </details>

              {/* Verify Button */}
              <button
                onClick={() => verifyForm(form.id)}
                className="mt-2 w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition"
                disabled={verifyingId === form.id}
              >
                {verifyingId === form.id ? "🔄 Verifying..." : " Verify Signature"}
              </button>

              {/* Verification Result */}
              {verificationResults[form.id] !== undefined && (
                <div
                  className={`mt-2 p-2 text-center rounded font-semibold ${
                    verificationResults[form.id]
                      ? "bg-green-50 text-green-800"
                      : "bg-red-50 text-red-800"
                  }`}
                >
                  {verificationResults[form.id] ? " Signature VALID" : "Signature INVALID"}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}