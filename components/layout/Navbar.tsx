"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { User, LogOut, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("User");

  // Check login state on mount
  useEffect(() => {
    const token = localStorage.getItem("user-token"); // ✅ check localStorage
    const name = localStorage.getItem("user-name");
    setIsLoggedIn(!!token);
    setUserName(name ? name.split(" ")[0] : "User");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user-token"); // ✅ remove token
    localStorage.removeItem("user-name");  // ✅ remove name
    setIsLoggedIn(false);
    setUserName("User");
    setMenuOpen(false);
    router.push("/");
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:flex items-center justify-between bg-black px-8 py-4 sticky top-0 z-50">
        <Link href="/" className="text-white text-lg font-bold">
          DEMO
        </Link>

        <div className="flex items-center gap-6">
          

          {isLoggedIn ? (
            <div className="flex items-center gap-3 text-white">
              <span>Hi, {userName}</span>
              <button
                onClick={handleLogout}
                className="hover:text-red-400 flex items-center gap-1"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link href="/" className="text-white">
              <User size={22} />
            </Link>
          )}
        </div>
      </nav>

      <nav className="md:hidden flex items-center justify-between bg-black px-4 py-4 sticky top-0 z-50">
        <Link href="/" className="text-white text-lg font-bold">
          DEMO
        </Link>
        <button
          onClick={() => setMenuOpen(true)}
          className="text-white"
          aria-label="Open menu"
        >
          <Menu size={28} />
        </button>
      </nav>

      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${
          menuOpen ? "opacity-100 block" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
      >
        <div
          className={`w-64 h-full bg-black text-white p-4 transform transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between mb-4">
            <span className="font-bold text-lg">Menu</span>
            <button onClick={() => setMenuOpen(false)}>
              <X size={22} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
           

            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
              >
                <LogOut size={20} /> Logout
              </button>
            ) : (
              <Link
                href="/"
                className="bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-700 flex items-center gap-2"
                onClick={() => setMenuOpen(false)}
              >
                <User size={20} /> Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
