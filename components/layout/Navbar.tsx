"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { User, LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";

interface NavbarProps {
  setSidebarOpen: (value: boolean) => void;
}

const Navbar = ({ setSidebarOpen }: NavbarProps) => {
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const token = localStorage.getItem("user-token");
    const name = localStorage.getItem("user-name");

    setIsLoggedIn(!!token);
    setUserName(name ? name.split(" ")[0] : "User");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user-token");
    localStorage.removeItem("user-name");

    setIsLoggedIn(false);
    setUserName("User");

    router.push("/");
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:flex items-center justify-between bg-black px-8 py-4 sticky top-0 z-50">
        <Link
          href="/dashboard"
          className="text-white text-lg font-bold"
        >
          DEMO
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/form-sign"
            className="text-white text-lg font-bold"
          >
            Form Data Sign
          </Link>

          <Link
            href="/signed-pdfs"
            className="text-white text-lg font-bold"
          >
            Signed PDF List
          </Link>

          <Link
            href="/verify-page"
            className="text-white text-lg font-bold"
          >
            Pdf Verify
          </Link>

          <Link
            href="/verifytextsignature"
            className="text-white text-lg font-bold"
          >
            Sign Verify
          </Link>

          <Link
            href="/pdf-sign"
            className="text-white text-lg font-bold"
          >
            PDF Sign
          </Link>

          <Link
            href="/pdf-upload"
            className="text-white text-lg font-bold"
          >
            PDF Upload & Sign
          </Link>

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="hover:text-red-400 text-white"
            >
              <LogOut size={20} />
            </button>
          ) : (
            <Link href="/" className="text-white">
              <User size={22} />
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className="md:hidden flex items-center justify-between bg-black px-4 py-4 sticky top-0 z-50">
        <Link href="/" className="text-white text-lg font-bold">
          DEMO
        </Link>

        <button
          onClick={() => setSidebarOpen(true)}
          className="text-white"
        >
          <Menu size={28} />
        </button>
      </nav>
    </>
  );
};

export default Navbar;