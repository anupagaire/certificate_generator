"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const cards = [
  { title: "Form Sign", href: "/form-sign" },
  { title: "PDF Sign", href: "/pdf-sign" },
  { title: "PDF Upload & Sign", href: "/pdf-upload" },
  { title: "Form Data Verify", href: "/verifytextsignature" },
  { title: "PDF Verify", href: "/verify-page" },
  { title: "Signed PDF List", href: "/signed-pdfs" },
];

export default function SideBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-stone-100 border-b shadow-sm sticky top-0 z-50">
        <h2 className="text-lg font-bold text-gray-800">
          Dashboard
        </h2>

        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg hover:bg-stone-200"
        >
          {open ? (
            <X className="w-6 h-6 text-gray-800" />
          ) : (
            <Menu className="w-6 h-6 text-gray-800" />
          )}
        </button>
      </div>

      {/* OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
  className={`
    fixed md:static top-0 left-0 z-50
    h-screen w-[220px] md:w-64
    bg-stone-100 shadow-xl md:shadow-lg
    p-4 flex flex-col
    transform transition-transform duration-300

    ${
      open
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
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg hover:bg-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex flex-col gap-3 overflow-y-auto">
          {cards.map((card) => {
            const isActive = pathname === card.href;

            return (
              <Link
                key={card.title}
                href={card.href}
                onClick={() => setOpen(false)}
                className={`
                  block rounded-xl px-4 py-3
                  text-sm sm:text-base font-medium
                  transition-all duration-200

                  ${
                    isActive
                      ? "bg-amber-300 text-gray-900 shadow-md"
                      : "text-gray-800 hover:bg-stone-300 hover:shadow"
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