"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

const cards = [
  { title: "Form Sign", href: "/form-sign" },
  { title: "PDF Sign", href: "/pdf-sign" },
  { title: "PDF Upload & Sign", href: "/pdf-upload" },
  { title: "Form Data Verify", href: "/verifytextsignature" },
  { title: "PDF Verify", href: "/verify-page" },
  { title: "Signed PDF List", href: "/signed-pdfs" },
];

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
}

export default function SideBar({
  sidebarOpen,
  setSidebarOpen,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed md:static top-0 left-0 z-50
          h-screen w-[220px] md:w-64
          bg-stone-100 shadow-xl md:shadow-lg
          p-4 flex flex-col
          transform transition-transform duration-300 ease-in-out

          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        {/* MOBILE HEADER */}
        <div className="flex items-center justify-between md:hidden mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Menu
          </h2>

          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LINKS */}
        <nav className="flex flex-col gap-3 overflow-y-auto">
          {cards.map((card) => {
            const isActive = pathname === card.href;

            return (
              <Link
                key={card.title}
                href={card.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  block rounded-xl px-4 py-3
                  text-sm font-medium
                  transition-all

                  ${
                    isActive
                      ? "bg-amber-300 text-gray-900 shadow-md"
                      : "text-gray-800 hover:bg-stone-300"
                  }
                `}
              >
                {card.title}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}