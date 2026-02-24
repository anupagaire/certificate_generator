import Link from "next/link";
import React from "react";

const accountLinks = [
  { label: "Login", href: "/" },
];
const QuickLinks = [
    { label: "Marksheet", href: "/marksheets" },

];
const Footer = () => {

  return (
    <footer className="relative bg-black overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          <div className="space-y-4">
            <h2 className="text-3xl font-bold bg-white bg-clip-text text-transparent">
DEMO APP            </h2>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white border-b-2 border-white/50 pb-2 inline-block">
              Account
            </h3>
            <ul className="space-y-3">
              {accountLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-white transition-colors duration-200 flex items-center group"
                  >
                    <span className="w-0 group-hover:w-2 h-2 bg-white rounded-full mr-0 group-hover:mr-2 transition-all duration-200"></span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
           <div className="space-y-4">
            <h3 className="text-xl font-bold text-white border-b-2 border-white/50 pb-2 inline-block">
QuickLinks            </h3>
            <ul className="space-y-3">
              {QuickLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-white transition-colors duration-200 flex items-center group"
                  >
                    <span className="w-0 group-hover:w-2 h-2 bg-white rounded-full mr-0 group-hover:mr-2 transition-all duration-200"></span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative pt-8 mt-8">
  <div className="flex justify-center items-center text-sm text-white">
    <p>© {new Date().getFullYear()} DEMO APP. All rights reserved.</p>    
  </div>
</div>

      </div>
    </footer>
  );
};

export default Footer;
