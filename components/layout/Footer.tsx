import Link from "next/link";
import React from "react";

const accountLinks = [
  { label: "Login", href: "/" },
];

const quickLinks = [
  { label: "Marksheet Upload", href: "/pdf-upload" },
  { label: "PDF Sign", href: "/pdf-sign" },
  { label: "Form Sign", href: "/form-sign" },
];

const verifyLinks = [
  { label: "PDF Verify", href: "/verify-page" },
  { label: "Sign Verify", href: "/verifytextsignature" },
];

const otherLinks = [
  { label: "Signed PDFs", href: "/signed-pdfs" },
  { label: "Dashboard", href: "/dashboard" },
];

const Footer = () => {
  return (
    <footer className="relative bg-black overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

          {/* BRAND */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold bg-white bg-clip-text text-transparent">
              DEMO APP
            </h2>
            <p className="text-white text-sm opacity-70">
              Digital PDF signing & verification system
            </p>
          </div>

          {/* ACCOUNT */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white border-b-2 border-white/50 pb-2 inline-block">
              Account
            </h3>
            <ul className="space-y-3">
              {accountLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-white flex items-center group"
                  >
                    <span className="w-0 group-hover:w-2 h-2 bg-white rounded-full mr-0 group-hover:mr-2 transition-all"></span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* QUICK LINKS */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white border-b-2 border-white/50 pb-2 inline-block">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-white flex items-center group">
                    <span className="w-0 group-hover:w-2 h-2 bg-white rounded-full mr-0 group-hover:mr-2 transition-all"></span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* VERIFY + OTHER */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white border-b-2 border-white/50 pb-2 inline-block">
              Verify
            </h3>
            <ul className="space-y-3 mb-6">
              {verifyLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-white flex items-center group">
                    <span className="w-0 group-hover:w-2 h-2 bg-white rounded-full mr-0 group-hover:mr-2 transition-all"></span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="text-xl font-bold text-white border-b-2 border-white/50 pb-2 inline-block">
              Other
            </h3>
            <ul className="space-y-3">
              {otherLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-white flex items-center group">
                    <span className="w-0 group-hover:w-2 h-2 bg-white rounded-full mr-0 group-hover:mr-2 transition-all"></span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* BOTTOM */}
        <div className="pt-6 border-t border-white/20 text-center text-sm text-white/70">
          <p>© {new Date().getFullYear()} DEMO APP. All rights reserved.</p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;