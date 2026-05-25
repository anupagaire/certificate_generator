"use client";

import React, { ReactNode, useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import SideBar from "./Sidebar";
import { usePathname } from "next/navigation";

const MainLayout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();

  const hideLayout =
    pathname === "/" || pathname.startsWith("/login");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">

      {/* NAVBAR */}
      {!hideLayout && (
        <Navbar setSidebarOpen={setSidebarOpen} />
      )}

      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR */}
        {!hideLayout && (
          <SideBar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        )}

        <main className="flex-1 p-4 md:p-6 bg-stone-50 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* FOOTER */}
      {!hideLayout && <Footer />}
    </div>
  );
};

export default MainLayout;