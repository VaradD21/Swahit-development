'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import logo from '@/images/logo.png';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function TopNav() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Do not show TopNav on login pages to keep them clean
  if (pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
    return null;
  }

  const renderLinks = () => {
    if (!user) {
      return (
        <>
          <Link href="/" className="hover:text-teal-700 transition-colors">Home</Link>
          <Link href="/#features" className="hover:text-teal-700 transition-colors">About</Link>
          <Link href="/dashboard/therapists" className="hover:text-teal-700 transition-colors">Therapists</Link>
          <Link href="/pricing" className="hover:text-teal-700 transition-colors">Pricing</Link>
          <Link href="/support" className="hover:text-teal-700 transition-colors">Contact</Link>
        </>
      );
    }

    if (user.role === 'ADMIN') {
      return (
        <>
          <Link href="/" className="hover:text-teal-700 transition-colors">Home</Link>
          <Link href="/dashboard/admin" className="hover:text-teal-700 transition-colors">Admin</Link>
          <Link href="/dashboard/therapists" className="hover:text-teal-700 transition-colors">Therapists</Link>
        </>
      );
    }

    if (user.role === 'DOCTOR') {
      return (
        <>
          <Link href="/" className="hover:text-teal-700 transition-colors">Home</Link>
          <Link href="/dashboard/doctor" className="hover:text-teal-700 transition-colors">Doctor Dashboard</Link>
          <Link href="/dashboard/doctor" className="hover:text-teal-700 transition-colors">Sessions</Link>
          <Link href="/dashboard/doctor/availability" className="hover:text-teal-700 transition-colors">Availability</Link>
        </>
      );
    }

    // Default USER
    return (
      <>
        <Link href="/" className="hover:text-teal-700 transition-colors">Home</Link>
        <Link href="/dashboard" className="hover:text-teal-700 transition-colors">Dashboard</Link>
        <Link href="/dashboard/therapists" className="hover:text-teal-700 transition-colors">Therapists</Link>
        <Link href="/dashboard/appointments" className="hover:text-teal-700 transition-colors">Appointments</Link>
        <Link href="/dashboard/mood" className="hover:text-teal-700 transition-colors">Mood</Link>
      </>
    );
  };

  const renderAuthButtons = () => {
    if (!user) {
      return (
        <div className="flex items-center gap-3">
          <Link href="/login/therapist" className="text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors">
            For Therapists
          </Link>
          <Link href="/login" className="text-sm font-medium text-teal-600 hover:text-teal-700 px-3 py-2 rounded-xl hover:bg-teal-50 transition-colors">
            Log In
          </Link>
          <Link href="/login" className="px-4 py-2 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors text-sm">
            Sign Up
          </Link>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-slate-600">Hi, {user.name || 'User'}</span>
        <button onClick={logout} className="text-sm font-medium text-rose-500 hover:text-rose-600 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors">
          Logout
        </button>
      </div>
    );
  };

  return (
    <header className="px-6 lg:px-12 h-16 flex items-center justify-between border-b border-teal-100/50 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2.5">
        <Image src={logo} alt="Swahit" width={32} height={32} className="object-contain" />
        <span className="font-bold text-lg text-teal-900 tracking-tight">Swahit</span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
        {renderLinks()}
      </nav>

      <div className="hidden md:flex items-center">
        {renderAuthButtons()}
      </div>

      {/* Mobile Hamburger */}
      <button 
        className="md:hidden p-2 text-slate-600 hover:text-teal-600"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-teal-100 p-4 flex flex-col gap-4 shadow-lg md:hidden">
          <nav className="flex flex-col gap-4 text-sm font-medium text-slate-600">
            {renderLinks()}
          </nav>
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
            {renderAuthButtons()}
          </div>
        </div>
      )}
    </header>
  );
}
