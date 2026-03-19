"use client";

import Link from "next/link";
import { FiFileText, FiFile, FiUpload, FiCheckSquare, FiList } from "react-icons/fi";

export default function Dashboard() {
  const cards = [
    { title: "Form Sign", href: "/form-sign", icon: <FiFileText size={32} /> },
    { title: "PDF Sign", href: "/pdf-sign", icon: <FiFile size={32} /> },
    { title: "PDF Upload & Sign", href: "/pdf-upload", icon: <FiUpload size={32} /> },
    { title: "Form Data Verify", href: "/verifytextsignature", icon: <FiCheckSquare size={32} /> },
    { title: "PDF Verify", href: "/verify-page", icon: <FiCheckSquare size={32} /> },
    { title: "Signed PDF List", href: "/signed-pdfs", icon: <FiList size={32} /> },
  ];

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-4xl md:text-5xl text-center mb-12 font-bold text-gray-800 cinzel">Dashboard
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
       className="flex flex-col items-center justify-center gap-4 border  text-gray-800 bg-white rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 p-8 text-center">      
             <div className="text-amber-500">{card.icon}</div>
          <span className="text-xl md:text-2xl font-semibold">{card.title}</span>
   </Link>
        ))}      </div>
    </main>
  );
}