'use client';

import { useState, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

type Subject = {
  subjectName: string;
  theoryFull: number;
  theoryPass: number;
  theoryObtained: number;
  practicalFull: number;
  practicalPass: number;
  practicalObtained: number;
};

// DSigner WebSocket helper
function signPdfWithDsigner(base64Pdf: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket("wss://127.0.0.1:8080");
    ws.binaryType = "arraybuffer";
    let connected = false;

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("DSigner timed out. Is the DSigner app running?"));
    }, 30000);

    ws.onopen = () => {
      console.log("DSigner WS opened, waiting for connection confirmation...");
    };

    ws.onmessage = (event) => {
      if (typeof event.data === "string") {
        const text = event.data.trim();
        console.log("DSigner message:", text.substring(0, 300));

        // Parse JSON response
        let parsed: { status?: string; message?: string } = {};
        try {
          parsed = JSON.parse(text);
        } catch {
        }

        // First message: connection confirmation — send our request
        if (!connected && parsed.status === "connected") {
          connected = true;
          console.log("DSigner ready, sending signPdf request...");

          const outputPath = `/Users/anupagaire/Downloads/signed_output.pdf`;
          const message =
            "action=signPdf\n" +
            `input={0,"${base64Pdf}"}\n` +
            "signPage=all\n" +
            "coordinates=400,100,600,200\n" +
            "location=Kathmandu\n" +
            "textStamp=0\n" +
            `output={"${outputPath}"}`;

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

        // Success response — base64 PDF is in parsed.message
        if (parsed.status === "success" && parsed.message) {
          try {
            const binary = atob(parsed.message);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            clearTimeout(timeout);
            ws.close();
            resolve(bytes);
          } catch (e) {
            clearTimeout(timeout);
            ws.close();
            reject(new Error("Failed to decode signed PDF from DSigner: " + String(e)));
          }
          return;
        }

      } else if (event.data instanceof ArrayBuffer) {
        clearTimeout(timeout);
        ws.close();
        resolve(new Uint8Array(event.data));
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

export default function Dashboard() {
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

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [signProvider, setSignProvider] = useState<"rcvault" | "dsigner" | null>(null);

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

  const handleSubjectChange = (
    index: number,
    field: keyof Subject,
    value: string
  ) => {
    setSubjects((prev) =>
      prev.map((sub, i) =>
        i === index
          ? {
              ...sub,
              [field]: field === "subjectName" ? value : Number(value) || 0,
            }
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

  // ── RC Vault flow 
  const handleRcVaultSubmit = async () => {
    if (!student.name.trim()) {
      toast.error("Please enter student name");
      return;
    }
    if (subjects.some((s) => !s.subjectName.trim())) {
      toast.error("All subjects must have a name");
      return;
    }

    toast.loading("Generating & digitally signing PDF via RC Vault...");

    try {
      const res = await fetch("/api/form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student, subjects }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate signed PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${student.name.replace(/\s+/g, "_")}_SIGNED.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success("Signed PDF downloaded successfully!");
      resetForm();
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Something went wrong");
      console.error(err);
    }
  };

  // ── DSigner flow 
  const handleDsignerSubmit = async () => {
    if (!student.name.trim()) {
      toast.error("Please enter student name");
      return;
    }
    if (subjects.some((s) => !s.subjectName.trim())) {
      toast.error("All subjects must have a name");
      return;
    }

    toast.loading("Generating PDF...");

    try {
      // Step 1: Generate unsigned PDF 
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student, subjects }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate PDF");
      }

      // Step 2: Convert PDF blob → base64
      const pdfBlob = await res.blob();
      const base64Pdf = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Strip "data:application/pdf;base64," prefix
          resolve(result.split(",")[1]);
        };
        reader.onerror = () => reject(new Error("Failed to read PDF"));
        reader.readAsDataURL(pdfBlob);
      });

      toast.dismiss();
      toast.loading("Sending to DSigner for digital signature...");

      // Step 3: Send to DSigner via WebSocket
      const signedBytes = await signPdfWithDsigner(base64Pdf);

const signedBlob = new Blob([new Uint8Array(signedBytes)], {
  type: "application/pdf",
});
      const url = window.URL.createObjectURL(signedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${student.name.replace(/\s+/g, "_")}_DSIGNED.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success("DSigner signed PDF downloaded successfully!");
      resetForm();
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Something went wrong");
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

  const resetForm = () => {
    setStudent({
      name: "",
      symbolNumber: "",
      registrationNumber: "",
      school: "",
      grade: "",
    });
    setSubjects([
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

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentIndex: number
  ) => {
    if (e.key === "ArrowRight") {
      inputRefs.current[currentIndex + 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      inputRefs.current[currentIndex - 1]?.focus();
      e.preventDefault();
    }
  };

  // ── Provider selection screen ─────────────────────────────────────────────
  if (!signProvider) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Choose Signing Provider
            </h2>
            <p className="text-gray-500 mt-2 mb-4">
              Select the service you want to use to sign the document.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-5">
            {/* RC Vault */}
            <button
              onClick={() => setSignProvider("rcvault")}
              className="group border rounded-xl p-6 mb-2 hover:border-blue-500 hover:shadow-md transition-all"
            >
              <p className="font-semibold text-gray-700 group-hover:text-blue-600">
                RC Vault
              </p>
              <p className="text-sm text-gray-500">Sign using RC Vault</p>
            </button>

            {/* DSigner — now enabled */}
            <button
              onClick={() => setSignProvider("dsigner")}
              className="group border rounded-xl p-6 mb-2 hover:border-green-500 hover:shadow-md transition-all"
            >
              <p className="font-semibold text-gray-700 group-hover:text-green-600">
                DSigner
              </p>
              <p className="text-sm text-gray-500">Sign using DSigner </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-center" />

      {/* Top bar */}
      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl p-4 mb-4 flex items-center justify-between">
        <Link
          href="/pdf-upload"
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-center text-white text-sm"
        >
          PDF Upload & Sign
        </Link>

        {/* Show active provider + allow switching */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Signing via:{" "}
            <span className={`font-semibold ${signProvider === "dsigner" ? "text-green-600" : "text-blue-600"}`}>
              {signProvider === "dsigner" ? "DSigner" : "RC Vault"}
            </span>
          </span>
          <button
            onClick={() => setSignProvider(null)}
            className="text-xs text-gray-400 underline hover:text-gray-600"
          >
            Switch
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
          Marksheet Generator
        </h1>

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
                onChange={(e) =>
                  setStudent({ ...student, [key]: e.target.value })
                }
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
                          ref={(el) => {
                            inputRefs.current[index * 7 + fieldIndex] = el;
                          }}
                          type={field === "subjectName" ? "text" : "number"}
                          className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-black"
                          value={
                            field === "subjectName"
                              ? sub.subjectName
                              : (sub[field as keyof Subject] as number)
                          }
                          onKeyDown={(e) =>
                            handleKeyDown(e, index * 7 + fieldIndex)
                          }
                          onChange={(e) =>
                            handleSubjectChange(
                              index,
                              field as keyof Subject,
                              e.target.value
                            )
                          }
                        />
                      </td>
                    ))}
                    <td className="border p-2 font-medium text-center text-black">
                      {totalObt}
                    </td>
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
          className={`w-full md:w-auto px-8 py-4 rounded-xl shadow-lg font-medium text-lg text-white ${
            signProvider === "dsigner"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Generate & Sign with {signProvider === "dsigner" ? "DSigner" : "RC Vault"}
        </button>
      </div>
    </div>
  );
}