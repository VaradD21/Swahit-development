'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api';
import { Calendar, Clock, Video, CheckCircle2, XCircle, FileText, UserSquare, DollarSign, Activity, Users, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ todayCount: 0, pendingCount: 0, earnings: 45000 });

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/doctor/appointments');
      setAppointments(data);
      
      const pending = data.filter((a: any) => a.status === 'PENDING').length;
      const todayCount = data.filter((a: any) => {
        if (a.status !== 'CONFIRMED') return false;
        const d = new Date(a.preferredTime);
        const now = new Date();
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
      }).length;

      setStats(prev => ({ ...prev, todayCount, pendingCount: pending }));
    } catch (error) {
      console.error('Failed to load appointments', error);
      toast.error('Could not load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetchApi(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      toast.success(`Appointment marked as ${status.toLowerCase()}`);
      loadAppointments();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const pending = appointments.filter(a => a.status === 'PENDING');
  const upcoming = appointments.filter(a => a.status === 'CONFIRMED');

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 animate-in fade-in duration-500 pb-20">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Doctor Portal</h1>
          <p className="text-slate-500 mt-1">Review your schedule and provide expert care.</p>
        </div>
        <div className="flex gap-3">
           <Link href="/dashboard/doctor/availability">
             <Button variant="outline" className="rounded-xl border-slate-200">
               Manage Availability
             </Button>
           </Link>
           <Button onClick={loadAppointments} variant="ghost" className="rounded-xl text-slate-500">
             Refresh
           </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Today's Sessions", value: stats.todayCount, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: "Pending Requests", value: stats.pendingCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: "Active Patients", value: stats.todayCount + 5, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: "Est. Earnings", value: `₹${stats.earnings.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((item, idx) => (
          <Card key={idx} className="border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <p className="text-2xl font-bold text-slate-800">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Pending Requests */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Pending Requests
          </h2>
          {loading ? (
             <div className="space-y-3">
               {[1, 2].map(i => <div key={i} className="animate-pulse h-32 bg-slate-100 rounded-2xl"></div>)}
             </div>
          ) : pending.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 border border-slate-100 rounded-2xl">
              <p className="text-slate-500">No pending appointment requests.</p>
            </div>
          ) : (
            pending.map(appt => (
              <Card key={appt.id} className="border-amber-100 shadow-sm rounded-2xl bg-amber-50/20">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-slate-800">{appt.patientName}</p>
                      <p className="text-xs text-slate-500">{appt.sessionType} • {appt.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-4 bg-white p-2 rounded-lg border border-slate-50">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {new Date(appt.preferredTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 text-xs">
                      Accept
                    </Button>
                    <Button variant="outline" onClick={() => handleUpdateStatus(appt.id, 'CANCELLED')} className="flex-1 text-rose-600 border-rose-100 hover:bg-rose-50 rounded-xl h-10 text-xs">
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            Confirmed Schedule
          </h2>
          {loading ? (
             <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="animate-pulse h-24 bg-slate-100 rounded-2xl"></div>)}
             </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 border border-slate-100 rounded-2xl">
              <p className="text-slate-500">No confirmed sessions in your schedule.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {upcoming.map(appt => (
                <Card key={appt.id} className="border-slate-100 shadow-sm rounded-2xl bg-white hover:shadow-md transition-shadow overflow-hidden group">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                        <UserSquare className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{appt.patientName}</p>
                        <p className="text-xs text-teal-600 font-semibold uppercase tracking-wider">
                          {new Date(appt.preferredTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg">
                      <Calendar className="w-3 h-3" />
                      {new Date(appt.preferredTime).toLocaleDateString('en-US', { dateStyle: 'long' })}
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-10 text-xs">
                        <Video className="w-4 h-4 mr-2" /> Join
                      </Button>
                      <Link href={`/dashboard/doctor/patient/${appt.userId}`} className="flex-1">
                        <Button variant="outline" className="w-full text-slate-600 border-slate-200 hover:bg-slate-50 rounded-xl h-10 text-xs">
                          <FileText className="w-4 h-4 mr-2" /> View Patient
                        </Button>
                      </Link>
                    </div>
                    <div className="mt-3 flex gap-2">
                       <Button variant="ghost" onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')} className="w-full h-8 text-[10px] uppercase font-bold text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg">
                         Mark as Completed
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
