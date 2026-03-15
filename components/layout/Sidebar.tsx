"use client";

import Link from "next/link";
import { usePathname } from "next/navigation"; // optional for active link highlight

const cards = [
  { title: "Form Sign", href: "/form-sign" },
  { title: "PDF Sign", href: "/pdf-sign" },
  { title: "PDF Upload & Sign", href: "/pdf-upload" },
  { title: "Form Data Verify", href: "/verifytextsignature" },
  { title: "PDF Verify", href: "/verify-page" },
  { title: "Signed PDF List", href: "/signed-pdfs" },
];

export default function SideBar() {
  const pathname = usePathname(); // get current path

  return (
    <aside className="w-64 h-screen bg-stone-100 shadow-lg p-6 flex flex-col">
      

      <nav className="flex flex-col space-y-3 mt-4">
        {cards.map((card) => {
          const isActive = pathname === card.href;
          return (
            <Link
              key={card.title}
              href={card.href}
              className={`
                block px-4 py-3 rounded-lg text-lg font-medium transition-all duration-200
                ${isActive ? "bg-amber-300 shadow-md text-gray-900" : "text-gray-800 hover:bg-stone-300 hover:shadow"}
              `}
            >
              {card.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}