import Link from 'next/link';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Simple Navigation Bar */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Response Recorder
            </Link>
            <div className="flex gap-6">
              <Link href="/dashboard" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                Dashboard
              </Link>
              <Link href="/dashboard/questions" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                Questions
              </Link>
              <Link href="/dashboard/cases" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                Cases
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-400">Response Recorder</span>
          </div>
        </div>
      </nav>
      <main className="max-w-[1400px] mx-auto">{children}</main>
    </div>
  );
}
