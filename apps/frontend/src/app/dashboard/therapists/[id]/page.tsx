'use client';

import { useState, useEffect, use } from 'react';
import { fetchApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BadgeCheck, Star, Clock, GraduationCap, Languages, ArrowLeft, Calendar, Video, Phone, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function TherapistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDoctor() {
      try {
        setLoading(true);
        // Note: For MVP we fetch all and find the specific one, ideally backend provides a GET /doctors/:id
        const data = await fetchApi('/appointments/doctors');
        const found = data.find((d: any) => d.id === resolvedParams.id);
        setDoctor(found);
      } catch (error) {
        console.error('Failed to load therapist details', error);
      } finally {
        setLoading(false);
      }
    }
    loadDoctor();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800">Therapist Not Found</h2>
        <Link href="/dashboard/therapists">
          <Button variant="link" className="text-teal-600 mt-4">Return to directory</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-500 pb-20">
      <Link href="/dashboard/therapists" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Directory
      </Link>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column - Profile Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-32 h-32 bg-teal-50 rounded-3xl flex items-center justify-center overflow-hidden border border-teal-100 flex-shrink-0 shadow-sm">
              {doctor.avatarUrl ? (
                <img src={doctor.avatarUrl} alt={doctor.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-teal-600">{doctor.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                {doctor.name}
                <BadgeCheck className="w-6 h-6 text-emerald-500" />
              </h1>
              <p className="text-lg font-medium text-teal-600 mt-1">{doctor.specialty}</p>
              
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-600">
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  {doctor.yearsExp} Years Exp.
                </div>
                <div className="flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-slate-400" />
                  {doctor.languages}
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded-md text-amber-700 font-medium">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  {doctor.rating} ({doctor.reviewCount} reviews)
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">About</h2>
            <p className="text-slate-600 leading-relaxed">
              {doctor.bio || `${doctor.name} is a dedicated ${doctor.specialty.toLowerCase()} with ${doctor.yearsExp} years of experience in helping individuals navigate mental wellness.`}
            </p>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">Session Types Offered</h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700">
                <Video className="w-4 h-4 text-teal-600" /> Video
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700">
                <Phone className="w-4 h-4 text-teal-600" /> Audio
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700">
                <MessageSquare className="w-4 h-4 text-teal-600" /> Chat
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">Patient Reviews</h2>
            <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100 border-dashed">
              <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Detailed reviews are currently hidden for privacy during Beta.</p>
            </div>
          </div>
        </div>

        {/* Right Column - Booking Card */}
        <div>
          <Card className="sticky top-24 rounded-3xl border-teal-100 shadow-md bg-white overflow-hidden">
            <div className="bg-teal-50/50 p-6 border-b border-teal-100">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Consultation Fee</p>
              <p className="text-3xl font-extrabold text-slate-800">₹{doctor.consultFee}</p>
              <p className="text-xs text-slate-500 mt-1">Per 50-minute session</p>
            </div>
            <CardContent className="p-6 space-y-6">
              <div>
                <p className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-teal-600" /> 
                  Next Available Slots
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-xs text-center p-2 rounded-lg border border-teal-200 bg-teal-50 text-teal-800 font-medium">Tomorrow, 10:00 AM</div>
                  <div className="text-xs text-center p-2 rounded-lg border border-teal-200 bg-teal-50 text-teal-800 font-medium">Tomorrow, 2:00 PM</div>
                  <div className="text-xs text-center p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600">Wed, 11:30 AM</div>
                  <div className="text-xs text-center p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600">Thu, 4:00 PM</div>
                </div>
              </div>
              
              <Link href={`/dashboard/appointments/new?doctor=${doctor.id}`} className="block">
                <Button className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/20 text-base">
                  <Calendar className="w-5 h-5 mr-2" />
                  Request Appointment
                </Button>
              </Link>
              <p className="text-xs text-center text-slate-400 mt-2">
                You won't be charged yet
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
