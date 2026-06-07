import { Calendar, Users, FileText, Settings, UserCircle, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar for Therapist Portal */}
      <aside className="w-64 bg-white border-r border-teal-100 flex flex-col shadow-sm fixed h-full z-10">
        <div className="h-16 flex items-center px-6 border-b border-teal-50">
          <span className="font-bold text-xl text-teal-900">Swahit <span className="text-teal-600">Pro</span></span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/provider" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-50 text-teal-800 font-medium transition-colors">
            <Users className="w-5 h-5" />
            My Patients
          </Link>
          <Link href="/provider/availability" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium transition-colors">
            <Calendar className="w-5 h-5" />
            Schedule
          </Link>
          <Link href="/provider/notes" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium transition-colors">
            <FileText className="w-5 h-5" />
            Clinical Notes
          </Link>
          <Link href="/provider/patient" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium transition-colors">
            <UserCircle className="w-5 h-5" />
            Patient Records
          </Link>
        </nav>

        <div className="p-4 border-t border-teal-50">
          <div className="mb-4 px-4">
            <p className="text-sm font-semibold text-slate-800">Dr. {user?.name}</p>
            <p className="text-xs text-slate-500">Licensed Therapist</p>
          </div>
          <button onClick={logout} className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 font-medium transition-colors">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
