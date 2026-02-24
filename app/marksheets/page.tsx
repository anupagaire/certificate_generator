import { prisma } from "@/lib/prisma"; 
import { format } from "date-fns";
import Link from "next/link";

async function getSavedMarksheets() {
  try {
    return await prisma.formData.findMany({
      orderBy: {
        createdAt: "desc", 
      },
      select: {
        id: true,
        createdAt: true,
        studentJson: true,
      },
    });
  } catch (error) {
    console.error("Error fetching marksheets:", error);
    return [];
  }
}

export default async function MarksheetsPage() {
  const marksheets = await getSavedMarksheets();

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Saved Marksheets</h1>
            <p className="mt-2 text-gray-600">
              All previously generated marksheets are stored here.
            </p>
          </div>

          <Link
            href="/dashboard" 
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
          >
            Generate New Marksheet
          </Link>
        </div>

        {/* Content */}
        {marksheets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No marksheets yet
            </h3>
            <p className="text-gray-600 mb-6">
              Generate your first marksheet to see it appear here.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
            >
              Go to Generator
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {marksheets.map((item) => {
              const student = item.studentJson as any;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
                >
                  <div className="p-6 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                      {student?.name || "Unnamed Student"}
                    </h3>

                    <div className="text-sm text-gray-600 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Grade:</span>
                        <span>{student?.grade || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Symbol No:</span>
                        <span>{student?.symbolNumber || "—"}</span>
                      </div>
                      {student?.school && (
                        <div className="text-xs text-gray-500 mt-2">
                          {student.school}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 text-xs text-gray-500">
                      {format(new Date(item.createdAt), "MMM dd, yyyy • hh:mm a")}
                    </div>
                  </div>

                  <div className="px-6 pb-6">
                    <a
                      href={`/api/download/${item.id}`}
                      download
                      className="block w-full text-center py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Download PDF
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}