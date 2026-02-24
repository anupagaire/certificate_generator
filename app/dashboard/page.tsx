"use client";

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

    if (subjects.some(s => !s.subjectName.trim())) {
      toast.error("All subjects must have a name");
      return;
    }

    toast.loading("Generating & saving marksheet...");

    try {
      const res = await fetch("/api/form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student, subjects }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Server error");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${student.name.trim()}_marksheet.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success("Marksheet saved & downloaded!");

      // Reset form
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

      inputRefs.current.forEach((input) => input && (input.value = ""));
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Failed to generate PDF");
      console.error(err);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentIndex: number
  ) => {
    if (e.key === "ArrowRight") {
      const next = inputRefs.current[currentIndex + 1];
      next?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      const prev = inputRefs.current[currentIndex - 1];
      prev?.focus();
      e.preventDefault();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-center" />
      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl p-8">
        <Link
              href="/marksheets"
              className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-700 text-center text-white"
            >
              View Saved Marksheets
            </Link>
            </div>
      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl p-8">
         
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
          Marksheet Generator
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {Object.keys(student).map((key) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {key.replace(/([A-Z])/g, " $1")}
              </label>
              <input
                placeholder={`Enter ${key}`}
                className="w-full border border-gray-300 p-3 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={(student as any)[key]}
                onChange={(e) =>
                  setStudent({ ...student, [key]: e.target.value })
                }
              />
            </div>
          ))}
        </div>

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
  className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
  value={field === "subjectName" ? sub.subjectName : (sub[field as keyof Subject] as number)}
  onKeyDown={(e) => handleKeyDown(e, index * 7 + fieldIndex)}
  onChange={(e) => handleSubjectChange(index, field as keyof Subject, e.target.value)}
/>

                      </td>
                    ))}
                    <td className="border p-2 font-medium text-center">{totalObt}</td>
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
          className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl shadow-lg font-medium text-lg"
        >
          Generate & Download PDF
        </button>
      </div>
    </div>
  );
}