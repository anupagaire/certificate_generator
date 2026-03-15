import { prisma } from "@/lib/prisma";

export default async function VerifyById({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  const { id } = await params;

  const record = await prisma.signedPdf.findUnique({
    where: { id },
  });

  if (!record) {
    return (
      <div className="p-10">
        <h1 className="text-red-600 text-2xl font-bold">
          Document Not Found
        </h1>
      </div>
    );
  }

  const student = JSON.parse(record.studentData);
  const subjects = JSON.parse(record.subjectsData);

  return (
    <div className="p-10 bg-white min-h-screen text-black">

      <h1 className="text-2xl font-bold text-green-600 mb-6">
        ✔ Record Exists in Database
      </h1>

      <p><b>Student:</b> {student.name}</p>
      <p><b>Symbol:</b> {student.symbolNumber}</p>
      <p><b>School:</b> {student.school}</p>

      <h2 className="mt-6 font-semibold">Subjects</h2>

      <ul className="list-disc ml-6">
        {subjects.map((s:any,i:number)=>(
          <li key={i}>
            {s.subjectName} — {s.theoryObtained + s.practicalObtained}
          </li>
        ))}
      </ul>

      <p className="mt-6 text-gray-500">
        Signed at: {new Date(record.createdAt).toLocaleString()}
      </p>

    </div>
  );
}