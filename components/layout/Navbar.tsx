"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { User, Menu, X, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userFirstName, setUserFirstName] = useState("User");

  useEffect(() => {
    const token = localStorage.getItem("user-token");
    const name = localStorage.getItem("user-name");
    if (token) setIsLoggedIn(true);
    if (name) setUserFirstName(name.split(" ")[0]);
  }, []);



  const handleLogout = () => {
    // Remove the same keys that were used on login
    localStorage.removeItem("user-token");
    localStorage.removeItem("user-name");
    setIsLoggedIn(false);
    router.push("/");
    setMenuOpen(false);
  };

  return (
    <>
      <nav className="md:hidden sticky top-0 z-50 h-16 bg-black flex items-center px-4">
        <button onClick={() => setMenuOpen(true)} className="text-white">
          <Menu size={28} />
        </button>

        <Link href="/" className="ml-3 flex items-center gap-2">
          <span className="text-white text-lg font-bold">SHARING TOOL</span>
        </Link>

        <div className="ml-auto flex items-center gap-4">
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-white text-sm"
            >
              <User size={18} />
              <span>{userFirstName}</span>
            </button>
          ) : (
            <Link href="/login" className="text-white">
              <User size={20} />
            </Link>
          )}
        </div>
      </nav>

    

      {/* Desktop Navbar */}
      <nav className="hidden md:flex sticky top-0 z-50 h-16 bg-black px-20 items-center">
        <Link href="/" className="ml-3 flex items-center gap-2">
          <span className="text-white text-lg font-bold">SHARING TOOL</span>
        </Link>

        <div className="ml-auto flex items-center gap-6">

          

          {isLoggedIn ? (
            <div className="flex items-center gap-3 text-white">
              <span>Hi, {userFirstName}</span>
              <button onClick={handleLogout}>
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link className="text-white" href="/login">
              <User size={22} />
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Side Menu */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 ${menuOpen ? "block" : "hidden"}`}
        onClick={() => setMenuOpen(false)}
      >
        <div
          className="w-72 h-full bg-black text-white p-4 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between mb-4">
            <span className="font-bold text-lg">Menu</span>
            <button onClick={() => setMenuOpen(false)}>
              <X size={22} />
            </button>
          </div>

          <div className="flex flex-col gap-4 text-lg">
          

            {isLoggedIn ? (
              <button onClick={handleLogout} className="flex items-center gap-2">
                <LogOut size={20} /> Logout
              </button>
            ) : (
              <Link href="/login" className="flex items-center gap-2">
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