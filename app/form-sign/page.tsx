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

  const handleSubmit = async () => {
    if (!student.name.trim()) {
      toast.error("Please enter student name");
      return;
    }
    toast.loading("Signing form data...");
    try {
      const res = await fetch("/api/sign-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ student, subjects }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Signing failed");
      }
      toast.dismiss();
      toast.success("Form signed successfully!");

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
  const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
    .then(() => {
      toast.success("Copied to clipboard!");
    })
    .catch(() => {
      toast.error("Failed to copy");
    });
};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-center" />
      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl p-8">

        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
          Form Signing
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">

          {Object.keys(student).map((key) => (
            <div key={key}>

              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {key.replace(/([A-Z])/g, " $1")}
              </label>

              <input
                placeholder={`Enter ${key}`}
                className="w-full border border-gray-300 p-3 text-black rounded-lg"
                value={(student as any)[key]}
                onChange={(e) =>
                  setStudent({ ...student, [key]: e.target.value })
                }
              />

            </div>
          ))}

        </div>

        {/* \\ SUBJECT TABLE  */}

        <div className="overflow-x-auto mb-8">

          <table className="w-full border-collapse text-sm text-gray-700">

            <thead className="bg-gray-100">
              <tr>
                <th className="border p-3">Subject</th>
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
                <tr key={index}>
                  {Object.keys(sub).map((field, fieldIndex) => (
                    <td key={field} className="border p-2">

                      <input
                        ref={(el) => {
                          inputRefs.current[index * 7 + fieldIndex] = el;
                        }}
                        type={field === "subjectName" ? "text" : "number"}
                        className="w-full p-2 border rounded text-black"
                        value={
                          field === "subjectName"
                            ? sub.subjectName
                            : (sub[field as keyof Subject] as number)
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
             <td className="border p-2 font-medium text-center">{totalObt}</td>

                </tr>
                );

  }  )}

            </tbody>



          </table>

        </div>

        <button
          onClick={addSubject}
          className="mb-6 bg-blue-600 text-white px-5 py-2 rounded-lg"
        >
          + Add Subject
        </button>
         <div className="mb-8 text-lg font-semibold text-gray-800">
          Total Full Marks: {totals.totalFull} <br />
          Total Obtained Marks: {totals.totalObtained}
        </div>
        <br/>

        <button
          onClick={handleSubmit}
        className="mb-6 bg-green-600 text-white px-5 py-2 rounded-lg"
        >
          Sign Form Data
        </button>

        {/* RESULT */}

        {signatureResult && (

          <div className="mt-8 bg-gray-100 p-5 rounded-lg space-y-4">

  <div>
    <p className="font-semibold text-black flex items-center justify-between">
      Formatted Text
      <button
        className="ml-2 bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-600"
        onClick={() => copyToClipboard(signatureResult.formattedText)}
      >
        Copy
      </button>
    </p>
    <p className="break-all text-black">{signatureResult.formattedText}</p>
  </div>

  <div>
    <p className="font-semibold text-black flex items-center justify-between">
      Signature
      <button
        className="ml-2 bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600"
        onClick={() => copyToClipboard(signatureResult.signature)}
      >
        Copy
      </button>
    </p>
    <p className="break-all text-blue-700">{signatureResult.signature}</p>
  </div>

</div>

        )}

      </div>
    </div>
  );
}