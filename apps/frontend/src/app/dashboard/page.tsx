'use client';

import { useAuth } from '@/context/auth-context';
import { fetchApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MessageSquare, BookHeart, UserRound, ArrowRight, Clock, Sparkles, Smile, PhoneCall } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

export default function DashboardHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodTrend, setMoodTrend] = useState<{day: string, val: number, color: string}[]>([
    { day: 'Mon', val: 0, color: 'bg-slate-200' },
    { day: 'Tue', val: 0, color: 'bg-slate-200' },
    { day: 'Wed', val: 0, color: 'bg-slate-200' },
    { day: 'Thu', val: 0, color: 'bg-slate-200' },
    { day: 'Fri', val: 0, color: 'bg-slate-200' },
    { day: 'Sat', val: 0, color: 'bg-slate-200' },
    { day: 'Sun', val: 0, color: 'bg-slate-200' },
  ]);

  useEffect(() => {
    if (user?.role === 'DOCTOR') {
      router.push('/provider');
    } else if (user?.role === 'ADMIN') {
      router.push('/dashboard/admin');
    } else if (user) {
      // Fetch actual mood trend
      fetchApi('/mood').then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // Map latest 7 moods to the chart
          const recent = data.slice(0, 7).reverse();
          const colors: Record<string, string> = {
            'Happy': 'bg-blue-400',
            'Calm': 'bg-teal-400',
            'Sad': 'bg-indigo-400',
            'Angry': 'bg-rose-400',
          };
          const mapped = recent.map((m: any) => {
            const date = new Date(m.createdAt);
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return {
              day: days[date.getDay()],
              val: m.intensity ? m.intensity * 10 : 60, // Fallback if no intensity
              color: colors[m.mood] || 'bg-teal-400',
            };
          });
          
          // Pad to 7 if less than 7
          const result = [...moodTrend];
          for (let i = 0; i < mapped.length; i++) {
            result[7 - mapped.length + i] = mapped[i];
          }
          setMoodTrend(result);
        }
      }).catch(() => {});
    }
  }, [user, router]);

  if (user?.role === 'DOCTOR' || user?.role === 'ADMIN') {
    return null; // Prevent flicker before redirect
  }

  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood);
    toast.success(`You are feeling ${mood}. Your mood has been logged!`);
    
    try {
      await fetchApi('/mood', {
        method: 'POST',
        body: JSON.stringify({ mood }),
      });
    } catch (error) {
      console.error('Failed to save mood to database', error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-12">
      {/* Welcome & Mood Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-8 bg-white p-8 rounded-3xl shadow-sm border border-teal-50">
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 uppercase text-sm mb-2 text-teal-600">
              WELCOME TO SWAHIT 🎉
            </h1>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">
              Good to see you, <span className="text-teal-600">{user?.name || 'Friend'}</span>.
            </h2>
          </div>
          
          <div className="space-y-3">
            <p className="text-slate-600 font-medium">How are you feeling today?</p>
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Happy', emoji: '😊', color: 'hover:bg-blue-50 hover:border-blue-200' },
                { label: 'Calm', emoji: '😌', color: 'hover:bg-teal-50 hover:border-teal-200' },
                { label: 'Sad', emoji: '😔', color: 'hover:bg-indigo-50 hover:border-indigo-200' },
                { label: 'Angry', emoji: '😡', color: 'hover:bg-rose-50 hover:border-rose-200' },
              ].map((mood, i) => (
                <button 
                  key={i}
                  onClick={() => handleMoodSelect(mood.label)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl border ${selectedMood === mood.label ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white'} shadow-sm transition-all hover:-translate-y-1 ${mood.color}`}
                >
                  <span className="text-xl">{mood.emoji}</span>
                  <span className="font-semibold text-slate-700">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Helpline Mini-card */}
        <div className="bg-teal-900 rounded-2xl p-6 text-white shrink-0 w-full md:w-auto shadow-md shadow-teal-900/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-teal-800 rounded-xl">
              <PhoneCall className="w-5 h-5 text-teal-300" />
            </div>
            <p className="font-semibold tracking-wide">Swahit Helpline</p>
          </div>
          <p className="text-2xl font-bold mt-1">+123-456-7890</p>
          <p className="text-teal-200 text-sm mt-2 font-medium">Available 24/7 for you.</p>
        </div>
      </div>

      {/* Mood Trend & Activity */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Mood Graph */}
        <Card className="col-span-4 border-teal-50 shadow-sm rounded-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
              Your Mood Trend 📊
            </CardTitle>
            <CardDescription className="text-slate-500">A visual look at how you've been doing this week.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Simple CSS Bar Chart representing mood values */}
            <div className="h-48 flex items-end justify-between gap-2 pt-4 border-b border-slate-100 pb-2">
              {moodTrend.map((day, i) => (
                <div key={i} className="flex flex-col items-center w-full gap-2 group cursor-pointer">
                  <div className={`w-full rounded-t-lg ${day.color} opacity-80 group-hover:opacity-100 transition-opacity`} style={{ height: `${Math.max(day.val, 10)}%` }}></div>
                  <span className="text-xs font-medium text-slate-400">{day.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions (Dashboard Action Buttons) */}
        <Card className="col-span-3 border-teal-50 shadow-sm rounded-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">Quick Actions</CardTitle>
            <CardDescription className="text-slate-500">Explore the Swahit platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Talk to Swahit', sub: '💬 24/7 AI Companion', href: '/dashboard/chatbot', color: 'text-teal-600' },
              { label: 'Questionnaire', sub: '📝 Mental Wellness Check', href: '/dashboard/questionnaire', color: 'text-amber-600' },
              { label: 'Find a Therapist', sub: '🩺 Browse verified professionals', href: '/dashboard/therapists', color: 'text-indigo-500' },
              { label: 'Book Appointment', sub: '📅 Schedule a session', href: '/dashboard/appointments', color: 'text-blue-600' },
              { label: 'Premium', sub: '💎 Upgrade your plan', href: '/dashboard/premium', color: 'text-indigo-600' },
            ].map((action, i) => (
              <Link key={i} href={action.href} className="block">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50 transition-colors group">
                  <div>
                    <p className={`font-semibold text-slate-800 group-hover:${action.color}`}>{action.label}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{action.sub}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
