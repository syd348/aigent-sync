import { Sidebar } from "@/app/components/Sidebar";
import { Header } from "@/app/components/Header";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-full flex text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 min-h-screen">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
