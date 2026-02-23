"use client";

import React, { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { usePathname } from "next/navigation";

const MainLayout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith("/status");

  return (
  <main className="min-h-screen flex flex-col">
  {!isAdminRoute && <Navbar />}
  <div className="flex-1 pt-0">{children}</div>
  {!isAdminRoute && <Footer />}
</main>
  );
};

export default MainLayout;
