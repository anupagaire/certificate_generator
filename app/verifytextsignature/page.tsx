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

const parseFormattedText = (text: string) => {
  const cleaned = text.replace(/^{|}$/g, "");
  return cleaned.split("|").map((pair) => {
    const eqIndex = pair.indexOf("=");
    if (eqIndex === -1) return { key: pair, value: "" };
    return {
      key: pair.slice(0, eqIndex).replace(/'/g, ""),
      value: pair.slice(eqIndex + 1).replace(/'/g, ""),
    };
  });
};

const buildFormattedText = (rows: { key: string; value: string }[]) => {
  return "{" + rows.map((r) => `'${r.key}'='${r.value}'`).join("|") + "}";
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
    const toastId = toast.loading("Verifying with RC Vault...");

    try {
      const form = forms.find((f) => f.id === formId);
      if (!form) {
        toast.error("Form not found", { id: toastId });
        return;
      }

      const textToVerify = editedTexts[form.id] ?? form.formattedText;

      const res = await fetch("/api/verify-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToVerify,
          signed_text: form.signature,
        }),
      });

      const data = await res.json();
      const isValid = data.result?.[1] === true;

      setVerificationResults((prev) => ({ ...prev, [formId]: isValid }));
      toast.success(`Verification ${isValid ? "passed ✓" : "failed ✗"}`, { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Verification failed", { id: toastId });
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950 p-6">
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Saved Signed Forms</h1>
          <p className="text-gray-500 text-sm">
            Edit any field if needed, then click <span className="font-semibold text-blue-600">Verify</span> to check signature validity via RC Vault.
          </p>
        </div>

        {/* Count badge */}
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold px-4 py-2 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h5l2 2h3a2 2 0 012 2v12a2 2 0 01-2 2z" />
            </svg>
            {forms.length} {forms.length === 1 ? "Form" : "Forms"} 
          </span>
        </div>

        {forms.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No signed forms found.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col"
            >
              {/* Card header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-base leading-tight">{form.studentName}</p>
                  <p className="text-blue-100 text-xs mt-0.5">
                    {new Date(form.createdAt).toLocaleString()}
                  </p>
                </div>
              
              </div>

              {/* Card body */}
              <div className="p-5 flex flex-col gap-4 flex-1">
                <details className="group">
                  <summary className="cursor-pointer select-none flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors">
                    <span>Form Details</span>
                    <svg
                      className="w-4 h-4 transition-transform group-open:rotate-180"
                      fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>

                  <div className="mt-3 rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                          <th className="px-3 py-2 text-left font-medium w-2/5">Field</th>
                          <th className="px-3 py-2 text-left font-medium">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseFormattedText(editedTexts[form.id] ?? form.formattedText).map((item, i, arr) => (
                          <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium text-gray-600 align-middle">{item.key}</td>
                            <td className="px-3 py-2">
                              <input
                                className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                value={item.value}
                                onChange={(e) => {
                                  const updated = [...arr];
                                  updated[i] = { ...updated[i], value: e.target.value };
                                  setEditedTexts((prev) => ({
                                    ...prev,
                                    [form.id]: buildFormattedText(updated),
                                  }));
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Verify button */}
                <button
                  onClick={() => verifyForm(form.id)}
                  disabled={verifyingId === form.id}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2"
                >
                  {verifyingId === form.id ? (
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Verify Form Data
                    </>
                  )}
                </button>

                {/* Result */}
                {verificationResults[form.id] !== undefined && (
                  <div
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold ${
                      verificationResults[form.id]
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {verificationResults[form.id] ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Signature Valid
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Signature Invalid
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}