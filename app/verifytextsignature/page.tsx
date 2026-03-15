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

    try {
      const form = forms.find((f) => f.id === formId);
      if (!form) {
        toast.error("Form not found");
        return;
      }

      // Send **current textarea value** to backend for verification
      const textToVerify = editedTexts[formId] ?? form.formattedText;

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

      setVerificationResults((prev) => ({
        ...prev,
        [formId]: isValid,
      }));

      toast.success(`Verification ${isValid ? "passed " : "failed "}`);

    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setVerifyingId(null);
    }
  };

const parseFormattedText = (text: string) => {
  const cleaned = text.replace(/^{|}$/g, "");

  return cleaned.split("|").map((pair) => {
    const [key, value] = pair.split("=");

    return {
      key: key.replace(/'/g, ""),
      value: value.replace(/'/g, ""),
    };
  });
};

const buildFormattedText = (rows: { key: string; value: string }[]) => {
  const formatted =
    "{" +
    rows.map((r) => `'${r.key}'='${r.value}'`).join("|") +
    "}";

  return formatted;
};

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950 p-6">
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">Saved Signed Forms</h1>
        <p className="text-center text-gray-500 mb-8">
          Edit text if needed, then click Verify to check signature validity.
        </p>

        {forms.length === 0 && <p className="text-center">No signed forms found.</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <div key={form.id} className="bg-white shadow-lg rounded-2xl p-6 space-y-4 border border-gray-200">
              <p className="font-semibold">Student Name: {form.studentName}</p>
              <p className="text-sm text-gray-400">Signed at: {new Date(form.createdAt).toLocaleString()}</p>

              <details className="group border-t border-gray-200 pt-2">
                <summary className="cursor-pointer font-semibold text-gray-800 group-open:text-indigo-600">
                  View Form Details ▼
                </summary>
                <div className="mt-2 space-y-3">
    
                 <div>
              <p className="font-semibold flex"> Form Data</p>
                <div>
                  <table className="w-full text-sm border rounded-lg">
                   <thead>
                     <tr>
                        <th className="border px-3 py-2 text-left">Field</th>
                        <th className="border px-3 py-2 text-left">Value</th>
                      </tr>
                    </thead>

                    <tbody>
        {parseFormattedText(editedTexts[form.id] ?? form.formattedText).map(
          (item, i, arr) => (
            <tr key={i}>
              <td className="border px-3 py-2 font-medium">
                {item.key}
              </td>

                          <td className="border px-3 py-2">
                            <input
                              className="w-full border rounded px-2 py-1"
                              value={item.value}
                              onChange={(e) => {

                                const updated = [...arr];

                                updated[i] = {
                                  ...updated[i],
                                  value: e.target.value,
                                };

                                const newFormatted = buildFormattedText(updated);

                                  setEditedTexts((prev) => ({
                                    ...prev,
                                    [form.id]: newFormatted,
                                  }));
                                }}
                              />
                            </td>
                          </tr>
                        )
                      )}
                   </tbody>
                 </table>
                </div>
              </div>

                  <div>
                    <p className=" text-2xl font-bold text-center">
                      Signature Signed
                    </p>
                    
                  </div>
                </div>
              </details>

              <div className="mt-2">
                <button
                  onClick={() => verifyForm(form.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                  disabled={verifyingId === form.id}
                >
                  {verifyingId === form.id ? " Verifying..." : "Verify"}
                </button>
              </div>

              {verificationResults[form.id] !== undefined && (
                <div className={`mt-2 p-2 text-center rounded font-semibold ${
                  verificationResults[form.id]
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}>
                  {verificationResults[form.id] ? "VALID " : "INVALID "}
                </div>
              )}

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}