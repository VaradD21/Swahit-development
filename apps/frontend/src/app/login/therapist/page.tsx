import { AuthForm } from '@/components/auth/auth-form';
import Link from 'next/link';
import Image from 'next/image';
import logo from '@/images/logo.png';

export const metadata = {
  title: 'Therapist Sign In — Swahit',
  description: 'Sign in to your Swahit professional account.',
};

export default function TherapistLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50/30 flex flex-col">
      {/* Public Top Nav */}
      <header className="px-6 lg:px-12 h-16 flex items-center justify-between border-b border-teal-100/50 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src={logo} alt="Swahit" width={32} height={32} className="object-contain" />
          <span className="font-bold text-lg text-teal-900 tracking-tight">Swahit Providers</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/#features" className="hover:text-teal-700 transition-colors">Features</Link>
          <Link href="/support" className="hover:text-teal-700 transition-colors">Provider Support</Link>
        </nav>

        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500 hidden md:inline">Not a provider?</span>
          <Link
            href="/login"
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors text-sm"
          >
            User Login
          </Link>
        </div>
      </header>

      {/* Auth Form */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Provider Portal</h1>
          <p className="text-slate-500">Sign in to manage your sessions and patients.</p>
        </div>
        <div className="w-full max-w-md">
          <AuthForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-slate-400 border-t border-teal-50 px-6">
        <p className="mb-2">
          Swahit Professional Portal
        </p>
        <p>
          <Link href="/terms" className="hover:text-teal-600 transition-colors">Terms</Link>
          {' · '}
          <Link href="/privacy" className="hover:text-teal-600 transition-colors">Privacy</Link>
          {' · '}
          <Link href="/support" className="hover:text-teal-600 transition-colors">Contact</Link>
        </p>
      </footer>
    </div>
  );
}
