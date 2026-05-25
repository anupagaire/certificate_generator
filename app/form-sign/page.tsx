"use client";

import { useState, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";

type Subject = {
  subjectName: string;
  theoryFull: number;
  theoryPass: number;
  theoryObtained: number;
  practicalFull: number;
  practicalPass: number;
  practicalObtained: number;
};

// ── DSigner WebSocket helper for signForm ────────────────────────────────────
function signFormWithDsigner(formData: string): Promise<{ signature: string; signedText: string }> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket("wss://127.0.0.1:8080");
    let connected = false;

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("DSigner timed out. Is the DSigner app running?"));
    }, 30000);

    ws.onopen = () => {
      console.log("DSigner WS opened, waiting for connection confirmation...");
    };

    ws.onmessage = (event) => {
      if (typeof event.data !== "string") return;

      const text = event.data.trim();
      console.log("DSigner message:", text.substring(0, 300));

      let parsed: { status?: string; message?: string; signature?: string } = {};
      try {
        parsed = JSON.parse(text);
      } catch {
        // not JSON, ignore
      }

      // First message: connection confirmation — send signForm request
      if (!connected && parsed.status === "connected") {
        connected = true;
        console.log("DSigner ready, sending signForm request...");

        // Format: action=signForm\ninput={3,"key=value|key2=value2"}
        // The "3" is the credential/slot index — adjust if needed
        const message =
          "action=signForm\n" +
          `input={3,"${formData}"}`;

        ws.send(message);
        return;
      }

      // Error response
      if (parsed.status === "error" || parsed.status === "failed") {
        clearTimeout(timeout);
        ws.close();
        reject(new Error(`DSigner error: ${parsed.message || text}`));
        return;
      }

      // Success response — signature is in parsed.message or parsed.signature
      if (parsed.status === "success") {
        clearTimeout(timeout);
        ws.close();
        resolve({
          signature: parsed.message || parsed.signature || "",
          signedText: formData,
        });
        return;
      }
    };

    ws.onerror = (e) => {
      clearTimeout(timeout);
      console.error("DSigner WS error:", e);
      reject(new Error("Cannot connect to DSigner. Make sure the DSigner app is running."));
    };

    ws.onclose = (event) => {
      console.log("DSigner WS closed:", event.code, event.reason);
    };
  });
}

// ── Format student + subjects into pipe-separated key=value string ────────────
function formatFormDataForDsigner(
  student: {
    name: string;
    symbolNumber: string;
    registrationNumber: string;
    school: string;
    grade: string;
  },
  subjects: Subject[]
): string {
  const parts: string[] = [
    `name=${student.name}`,
    `symbolNumber=${student.symbolNumber}`,
    `registrationNumber=${student.registrationNumber}`,
    `school=${student.school}`,
    `grade=${student.grade}`,
  ];

  subjects.forEach((sub, i) => {
    const n = i + 1;
    parts.push(`subject${n}=${sub.subjectName}`);
    parts.push(`subject${n}_theoryFull=${sub.theoryFull}`);
    parts.push(`subject${n}_theoryPass=${sub.theoryPass}`);
    parts.push(`subject${n}_theoryObtained=${sub.theoryObtained}`);
    parts.push(`subject${n}_practicalFull=${sub.practicalFull}`);
    parts.push(`subject${n}_practicalPass=${sub.practicalPass}`);
    parts.push(`subject${n}_practicalObtained=${sub.practicalObtained}`);
  });

  return parts.join("|");
}

export default function FormSignPage() {
  const [student, setStudent] = useState({
    name: "",
    symbolNumber: "",
    registrationNumber: "",
    school: "",
    grade: "",
  });

  const [subjects, setSubjects] = useState<Subject[]>([
    {
      subjectName: "",
      theoryFull: 0,
      theoryPass: 0,
      theoryObtained: 0,
      practicalFull: 0,
      practicalPass: 0,
      practicalObtained: 0,
    },
  ]);

  const [signatureResult, setSignatureResult] = useState<any>(null);
  const [signProvider, setSignProvider] = useState<"rcvault" | "dsigner" | null>(null);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const addSubject = () => {
    setSubjects([
      ...subjects,
      {
        subjectName: "",
        theoryFull: 0,
        theoryPass: 0,
        theoryObtained: 0,
        practicalFull: 0,
        practicalPass: 0,
        practicalObtained: 0,
      },
    ]);
  };

  const handleSubjectChange = (index: number, field: keyof Subject, value: string) => {
    setSubjects((prev) =>
      prev.map((sub, i) =>
        i === index
          ? { ...sub, [field]: field === "subjectName" ? value : Number(value) || 0 }
          : sub
      )
    );
  };

  const calculateTotals = () => {
    let totalFull = 0;
    let totalObtained = 0;
    subjects.forEach((sub) => {
      totalFull += sub.theoryFull + sub.practicalFull;
      totalObtained += sub.theoryObtained + sub.practicalObtained;
    });
    return { totalFull, totalObtained };
  };

  const totals = calculateTotals();

  // ── RC Vault sign flow ─────────────────────────────────────────────────────
  const handleRcVaultSubmit = async () => {
    if (!student.name.trim()) { toast.error("Please enter student name"); return; }

    toast.loading("Signing form data via RC Vault...");
    try {
      const res = await fetch("/api/sign-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student, subjects }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signing failed");

      toast.dismiss();
      toast.success("Form signed successfully via RC Vault!");
      setSignatureResult(data);

      await fetch("/api/list-signed-forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student,
          subjects,
          formattedText: data.formattedText,
          signature: data.signature,
        }),
      });
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message);
    }
  };

  // ── DSigner signForm flow ──────────────────────────────────────────────────
  const handleDsignerSubmit = async () => {
    if (!student.name.trim()) { toast.error("Please enter student name"); return; }
    if (subjects.some((s) => !s.subjectName.trim())) {
      toast.error("All subjects must have a name");
      return;
    }

    toast.loading("Sending form to DSigner for signing...");
    try {
      // Build the pipe-separated form string DSigner expects
      const formDataString = formatFormDataForDsigner(student, subjects);
      console.log("Sending to DSigner signForm:", formDataString);

      const result = await signFormWithDsigner(formDataString);

      toast.dismiss();
      toast.success("Form signed successfully via DSigner!");

      // Store result in same shape as RC Vault so the UI below reuses it
      setSignatureResult({
        formattedText: result.signedText,
        signature: result.signature,
      });

      // Optionally persist to your backend
      await fetch("/api/list-signed-forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student,
          subjects,
          formattedText: result.signedText,
          signature: result.signature,
          provider: "dsigner",
        }),
      });
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "DSigner signing failed");
      console.error(err);
    }
  };

  const handleSubmit = () => {
    if (signProvider === "dsigner") {
      handleDsignerSubmit();
    } else {
      handleRcVaultSubmit();
    }
  };

  // ── Verify (RC Vault only for now) ─────────────────────────────────────────
  const verifySignature = async () => {
    if (!signatureResult) return;
    if (signProvider === "dsigner") {
      toast("DSigner signature verification is handled by DSigner app directly.", { icon: "ℹ️" });
      return;
    }

    toast.loading("Verifying signature...");
    try {
      const res = await fetch("/api/verify-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: signatureResult.formattedText,
          signed_text: signatureResult.signature,
        }),
      });
      const data = await res.json();
      toast.dismiss();
      if (data.result?.[1] === true) {
        toast.success("Signature verified ✓");
      } else {
        toast.error("Signature invalid ✗");
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success("Copied to clipboard!"))
      .catch(() => toast.error("Failed to copy"));
  };

  // ── Provider selection screen ──────────────────────────────────────────────
  if (!signProvider) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg bg-white rounded-2xl shadow-xl p-10 text-center space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Choose Signing Provider</h2>
            <p className="text-gray-500 mt-2 mb-4">
              Select the service you want to use to sign the form.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <button
              onClick={() => setSignProvider("rcvault")}
              className="group border rounded-xl p-2 md:p-6 hover:border-blue-500 hover:shadow-md transition-all"
            >
              <p className="font-semibold text-gray-700 group-hover:text-blue-600">RC Vault</p>
              <p className="text-sm text-gray-500">Sign using RC Vault</p>
            </button>

            <button
              onClick={() => setSignProvider("dsigner")}
              className="group border rounded-xl p-2 md:p-6 hover:border-green-500 hover:shadow-md transition-all"
            >
              <p className="font-semibold text-gray-700 group-hover:text-green-600">DSigner</p>
              <p className="text-sm text-gray-500">Sign using DSigner</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-center" />

      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl p-8">

        {/* Header with active provider + switch */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Form Signing</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              Signing via:{" "}
              <span className={`font-semibold ${signProvider === "dsigner" ? "text-green-600" : "text-blue-600"}`}>
                {signProvider === "dsigner" ? "DSigner" : "RC Vault"}
              </span>
            </span>
            <button
              onClick={() => { setSignProvider(null); setSignatureResult(null); }}
              className="text-xs text-gray-400 underline hover:text-gray-600"
            >
              Switch
            </button>
          </div>
        </div>

        {/* Student info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {Object.keys(student).map((key) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {key.replace(/([A-Z])/g, " $1")}
              </label>
              <input
                placeholder={`Enter ${key}`}
                className="w-full border border-gray-300 p-3 text-black rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                value={(student as any)[key]}
                onChange={(e) => setStudent({ ...student, [key]: e.target.value })}
              />
            </div>
          ))}
        </div>

        {/* Subjects table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full border-collapse text-sm text-gray-700">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-3 text-left">Subject</th>
                <th className="border p-3">Theory Full</th>
                <th className="border p-3">Theory Pass</th>
                <th className="border p-3">Theory Obt.</th>
                <th className="border p-3">Practical Full</th>
                <th className="border p-3">Practical Pass</th>
                <th className="border p-3">Practical Obt.</th>
                <th className="border p-3">Total Obt.</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub, index) => {
                const totalObt = sub.theoryObtained + sub.practicalObtained;
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    {Object.keys(sub).map((field, fieldIndex) => (
                      <td key={field} className="border p-2">
                        <input
                          ref={(el) => { inputRefs.current[index * 7 + fieldIndex] = el; }}
                          type={field === "subjectName" ? "text" : "number"}
                          className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-black"
                          value={field === "subjectName" ? sub.subjectName : (sub[field as keyof Subject] as number)}
                          onChange={(e) => handleSubjectChange(index, field as keyof Subject, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="border p-2 font-medium text-center text-black">{totalObt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          onClick={addSubject}
          className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow"
        >
          + Add Subject
        </button>

        <div className="mb-8 text-lg font-semibold text-gray-800">
          Total Full Marks: {totals.totalFull} <br />
          Total Obtained Marks: {totals.totalObtained}
        </div>

        <button
          onClick={handleSubmit}
          className={`mb-6 px-8 py-3 rounded-xl shadow-lg font-medium text-white ${
            signProvider === "dsigner"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Sign Form with {signProvider === "dsigner" ? "DSigner" : "RC Vault"}
        </button>

        {/* Signature result */}
        {signatureResult && (
          <div className="mt-8 bg-gray-100 p-5 rounded-lg space-y-4">
            <div>
              <p className="font-semibold text-black flex justify-between">
                Form Data (Signed Input)
                <button
                  className="ml-2 bg-blue-600 text-white px-3 py-1 text-sm rounded"
                  onClick={() => copyToClipboard(signatureResult.formattedText)}
                >
                  Copy
                </button>
              </p>
              <p className="break-all text-black text-sm mt-1">
                {signatureResult.formattedText.slice(0, 150)}...
              </p>
            </div>

            <div>
              <p className="font-semibold text-black flex justify-between">
                Signature
                <button
                  className="ml-2 bg-green-600 text-white px-3 py-1 text-sm rounded"
                  onClick={() => copyToClipboard(signatureResult.signature)}
                >
                  Copy
                </button>
              </p>
              <p className="break-all text-blue-700 text-sm mt-1">
                {signatureResult.signature.slice(0, 150)}...
              </p>
            </div>

            {/* Only show verify button for RC Vault */}
            {signProvider === "rcvault" && (
              <button
                onClick={verifySignature}
                className="bg-purple-600 text-white px-5 py-2 rounded-lg"
              >
                Verify Signature
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}