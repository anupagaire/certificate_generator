"use client";

import React, { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import SideBar from "./Sidebar";


import { usePathname } from "next/navigation";

const MainLayout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith("/status");

  return (
  <main className="min-h-screen flex flex-col">
    {!isAdminRoute && <Navbar />}
    <div className="flex flex-1 overflow-hidden">
      {!isAdminRoute && <SideBar />}
      <main className="flex-1 p-4 md:p-6 bg-stone-50 overflow-y-auto">
        {children}
      </main>
    </div>
    {!isAdminRoute && <Footer />}
  </main>
);};

export default MainLayout;
