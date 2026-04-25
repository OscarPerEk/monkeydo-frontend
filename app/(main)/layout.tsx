"use client";

import Sidebar from "@/components/sidebar/Sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
