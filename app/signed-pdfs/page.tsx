"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PdfRecord = {
  id: string;
  fileName: string;
  studentName: string;
  studentData: string;
  subjectsData: string;
  createdAt: string;
};

export default function SignedPdfsPage() {
  const [pdfs, setPdfs] = useState<PdfRecord[]>([]);

  useEffect(() => {
    fetch("/api/list-signed-pdfs")
      .then((res) => res.json())
      .then((data) => setPdfs(data.pdfs));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Signed Marksheet Records</h1>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Student</th>
            <th className="border p-2">File</th>
            <th className="border p-2">Created</th>
          <th className="border p-2">Details</th>
            <th className="border p-2">Verify</th>
          </tr>
        </thead>

        <tbody>
          {pdfs.map((pdf) => {
            const student = JSON.parse(pdf.studentData);
            const subjects = JSON.parse(pdf.subjectsData);
            return (
              <tr key={pdf.id}>
                <td className="border p-2">{pdf.studentName}</td>
                <td className="border p-2">{pdf.fileName}</td>
                <td className="border p-2">
                  {new Date(pdf.createdAt).toLocaleString()}
                </td>

                <td className="border p-2">
                  <details>
                    <summary className="cursor-pointer text-blue-600">
                      View Data
                    </summary>

                    <div className="mt-2 bg-gray-50 p-3 rounded">
                      <p><strong>Name:</strong> {student.name}</p>
                      <p><strong>Symbol:</strong> {student.symbolNumber}</p>
                      <p><strong>Registration:</strong> {student.registrationNumber}</p>
                      <p><strong>School:</strong> {student.school}</p>
                      <p><strong>Grade:</strong> {student.grade}</p>
                    </div>

                    {/* Subjects Table */}
                    <table className="w-full mt-3 border text-xs">
                      <thead className="bg-gray-200">
                        <tr>
                          <th className="border p-1">Subject</th>
                          <th className="border p-1">TH</th>
                          <th className="border p-1">PR</th>
                          <th className="border p-1">Total</th>
                        </tr>
                      </thead>

                      <tbody>
                        {subjects.map((s: any, i: number) => (
                          <tr key={i}>
                            <td className="border p-1">{s.subjectName}</td>
                            <td className="border p-1">{s.theoryObtained}</td>
                            <td className="border p-1">{s.practicalObtained}</td>
                            <td className="border p-1">
                              {s.theoryObtained + s.practicalObtained}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                </td>

                <td className="border p-2 text-center">
                  <Link
                    href={`/verify-page/${pdf.id}`}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Verify
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}