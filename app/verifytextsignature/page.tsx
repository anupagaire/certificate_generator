"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

type SignedForm = {
  id: string;
  studentName: string;
  formattedText: string;
  signature: string;
  createdAt: string;
  provider?: "rcvault" | "dsigner"; 
};

// ── DSigner WebSocket verifyForm 
function verifyFormWithDsigner(
  formData: string,
  signature: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket("wss://127.0.0.1:8080");
    let connected = false;

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("DSigner timed out. Is the DSigner app running?"));
    }, 30000);

    ws.onopen = () => {
      console.log("DSigner WS opened for verifyForm...");
    };

    ws.onmessage = (event) => {
      if (typeof event.data !== "string") return;

      const text = event.data.trim();
      console.log("DSigner verifyForm message:", text.substring(0, 300));

      let parsed: { status?: string; message?: string; result?: boolean } = {};
      try {
        parsed = JSON.parse(text);
      } catch {
       
      }

      // First message: connection confirmed → send verifyForm request
      if (!connected && parsed.status === "connected") {
        connected = true;
        console.log("DSigner ready, sending verifyForm...");

        const message =
          "action=verifyForm\n" +
          `input={3,"${formData}"}\n` +
          `signed_text={0,"${signature}"}`;

        ws.send(message);
        return;
      }

      if (parsed.status === "error" || parsed.status === "failed") {
        clearTimeout(timeout);
        ws.close();
        reject(new Error(`DSigner error: ${parsed.message || text}`));
        return;
      }

      if (parsed.status === "success") {
  clearTimeout(timeout);
  ws.close();

  let isValid = false;

  // DSigner returns message as an array: [{ email, signature_ok, hash_ok, cert_ok }]
  if (Array.isArray(parsed.message) && parsed.message.length > 0) {
    const result = parsed.message[0];
    isValid =
      result.signature_ok === true &&
      result.hash_ok === true &&
      result.cert_ok === true;
  } else {
    // Fallback for plain string/boolean responses
    isValid =
      parsed.result === true ||
      parsed.message === "true" ||
      parsed.message === "valid";
  }

  resolve(isValid);
  return;
}

      // Some DSigner versions return result directly
      if (parsed.result !== undefined) {
        clearTimeout(timeout);
        ws.close();
        resolve(parsed.result === true);
        return;
      }
    };

    ws.onerror = (e) => {
      clearTimeout(timeout);
      console.error("DSigner WS error:", e);
      reject(
        new Error(
          "Cannot connect to DSigner. Make sure the DSigner app is running."
        )
      );
    };

    ws.onclose = (event) => {
      console.log("DSigner WS closed:", event.code, event.reason);
    };
  });
}

// ── Parse pipe-separated key=value string ───────────────────────────────────
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
  const [verificationResults, setVerificationResults] = useState<
    Record<string, boolean>
  >({});
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});

  // Filter state
  const [filter, setFilter] = useState<"all" | "rcvault" | "dsigner">("all");

  useEffect(() => {
    fetch("/api/list-signed-forms")
      .then((res) => res.json())
      .then((data) => setForms(data.allForms))
      .catch(() => toast.error("Failed to fetch saved forms"));
  }, []);

  // ── RC Vault verification ──────────────────────────────────────────────────
  const verifyWithRcVault = async (form: SignedForm) => {
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
    return data.result?.[1] === true;
  };

  // ── DSigner verification ───────────────────────────────────────────────────
  const verifyWithDsigner = async (form: SignedForm) => {
    const textToVerify = editedTexts[form.id] ?? form.formattedText;
    // Strip outer braces if present — DSigner wants raw key=value|... string
    const rawData = textToVerify.replace(/^{|}$/g, "");
    return verifyFormWithDsigner(rawData, form.signature);
  };

  // ── Main verify handler ────────────────────────────────────────────────────
  const verifyForm = async (formId: string) => {
    setVerifyingId(formId);

    try {
      const form = forms.find((f) => f.id === formId);
      if (!form) {
        toast.error("Form not found");
        return;
      }

      let isValid: boolean;

      if (form.provider === "dsigner") {
        toast.loading("Sending to DSigner for verification...");
        isValid = await verifyWithDsigner(form);
      } else {
        toast.loading("Verifying with RC Vault...");
        isValid = await verifyWithRcVault(form);
      }

      toast.dismiss();
      setVerificationResults((prev) => ({ ...prev, [formId]: isValid }));
      toast.success(`Verification ${isValid ? "passed ✓" : "failed ✗"}`);
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Verification failed");
    } finally {
      setVerifyingId(null);
    }
  };

  // ── Filtered forms ─────────────────────────────────────────────────────────
  const filteredForms = forms.filter((f) => {
    if (filter === "all") return true;
    // Forms without a provider field are assumed RC Vault (legacy)
    const provider = f.provider ?? "rcvault";
    return provider === filter;
  });

  const rcVaultCount = forms.filter(
    (f) => (f.provider ?? "rcvault") === "rcvault"
  ).length;
  const dsignerCount = forms.filter((f) => f.provider === "dsigner").length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950 p-6">
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">
          Saved Signed Forms
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Edit text if needed, then click Verify to check signature validity.
        </p>

        <div className="flex justify-center gap-3 mb-8">
          {(
            [
              { key: "all", label: `All (${forms.length})` },
              { key: "rcvault", label: `RC Vault (${rcVaultCount})` },
              { key: "dsigner", label: `DSigner (${dsignerCount})` },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all ${
                filter === key
                  ? key === "dsigner"
                    ? "bg-green-600 text-white border-green-600"
                    : key === "rcvault"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-800 text-white border-gray-800"
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filteredForms.length === 0 && (
          <p className="text-center text-gray-400">No forms found.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form) => {
            const provider = form.provider ?? "rcvault";
            const isDsigner = provider === "dsigner";

            return (
              <div
                key={form.id}
                className="bg-white shadow-lg rounded-2xl p-6 space-y-4 border border-gray-200"
              >
                {/* Provider badge */}
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-800">
                    {form.studentName}
                  </p>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      isDsigner
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {isDsigner ? "DSigner" : "RC Vault"}
                  </span>
                </div>

                <p className="text-sm text-gray-400">
                  Signed at: {new Date(form.createdAt).toLocaleString()}
                </p>

                <details className="group border-t border-gray-200 pt-2">
                  <summary className="cursor-pointer font-semibold text-gray-800 group-open:text-indigo-600">
                    View Form Details ▼
                  </summary>
                  <div className="mt-2 space-y-3">
                    <div>
                      <p className="font-semibold mb-1">Form Data</p>
                      <table className="w-full text-sm border rounded-lg">
                        <thead>
                          <tr>
                            <th className="border px-3 py-2 text-left">
                              Field
                            </th>
                            <th className="border px-3 py-2 text-left">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {parseFormattedText(
                            editedTexts[form.id] ?? form.formattedText
                          ).map((item, i, arr) => (
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

                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-500">
                        Signature Provider:{" "}
                        <span
                          className={
                            isDsigner ? "text-green-600" : "text-blue-600"
                          }
                        >
                          {isDsigner ? "DSigner" : "RC Vault"}
                        </span>
                      </p>
                    </div>
                  </div>
                </details>

                {/* Verify button */}
                <button
                  onClick={() => verifyForm(form.id)}
                  disabled={verifyingId === form.id}
                  className={`w-full py-2 rounded-lg transition text-white font-medium disabled:opacity-50 ${
                    isDsigner
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {verifyingId === form.id
                    ? "Verifying..."
                    : `Verify with ${isDsigner ? "DSigner" : "RC Vault"}`}
                </button>

                {/* Verification result */}
                {verificationResults[form.id] !== undefined && (
                  <div
                    className={`p-2 text-center rounded font-semibold ${
                      verificationResults[form.id]
                        ? "bg-green-50 text-green-800"
                        : "bg-red-50 text-red-800"
                    }`}
                  >
                    {verificationResults[form.id] ? "✓ VALID" : "✗ INVALID"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}