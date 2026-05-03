'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft, Clock, MapPin, Video, Phone, MessageSquare, Plus, XCircle } from 'lucide-react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/appointments');
      setAppointments(data);
    } catch (error) {
      console.error('Failed to load appointments', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await fetchApi(`/appointments/${id}`, { method: 'DELETE' });
      toast.success('Appointment cancelled successfully');
      loadAppointments();
    } catch (error) {
      toast.error('Failed to cancel appointment');
    }
  };

  const upcoming = appointments.filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED');
  const past = appointments.filter(a => a.status === 'COMPLETED' || a.status === 'CANCELLED');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md uppercase tracking-wider">Confirmed</span>;
      case 'PENDING': return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-md uppercase tracking-wider">Pending</span>;
      case 'COMPLETED': return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md uppercase tracking-wider">Completed</span>;
      case 'CANCELLED': return <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-md uppercase tracking-wider">Cancelled</span>;
      default: return null;
    }
  };

  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <Video className="w-4 h-4" />;
      case 'AUDIO': return <Phone className="w-4 h-4" />;
      case 'CHAT': return <MessageSquare className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const AppointmentCard = ({ appt, isPast }: { appt: any, isPast: boolean }) => (
    <Card className={`rounded-2xl border-slate-100 shadow-sm ${isPast ? 'opacity-70 bg-slate-50' : 'bg-white hover:shadow-md transition-shadow border-teal-50'}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-3 items-center">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center overflow-hidden">
               {appt.doctor?.avatarUrl ? <img src={appt.doctor.avatarUrl} alt="doc" className="w-full h-full object-cover" /> : <Calendar className="w-6 h-6 text-teal-600" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{appt.doctor?.name || 'General Booking'}</h3>
              <p className="text-sm text-teal-600 font-medium">{appt.doctor?.specialty || 'Therapy Session'}</p>
            </div>
          </div>
          {getStatusBadge(appt.status)}
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 mb-5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            {new Date(appt.preferredTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            {appt.location}
          </div>
          <div className="flex items-center gap-2">
            {getSessionIcon(appt.sessionType)}
            <span className="capitalize">{appt.sessionType?.toLowerCase() || 'Video'} Call</span>
          </div>
        </div>

        {!isPast && (
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" className="flex-1 rounded-xl text-slate-600 hover:text-teal-700 hover:bg-teal-50 border-slate-200">
              Reschedule
            </Button>
            <Button variant="outline" onClick={() => handleCancel(appt.id)} className="flex-1 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200">
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-100 rounded-2xl">
              <Calendar className="w-8 h-8 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">My Appointments</h1>
              <p className="text-slate-500 mt-1">Manage your upcoming and past therapy sessions.</p>
            </div>
          </div>
        </div>
        <Link href="/dashboard/therapists">
          <Button className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white hidden sm:flex">
            <Plus className="w-4 h-4 mr-2" /> Book New
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg mb-4">You have no appointments yet.</p>
          <Link href="/dashboard/therapists">
            <Button className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white">Find a Therapist</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Upcoming Sessions</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {upcoming.map(appt => <AppointmentCard key={appt.id} appt={appt} isPast={false} />)}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Past Sessions</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {past.map(appt => <AppointmentCard key={appt.id} appt={appt} isPast={true} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
