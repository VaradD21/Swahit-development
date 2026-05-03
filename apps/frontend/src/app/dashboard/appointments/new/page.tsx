'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, ArrowLeft, CheckCircle2, Clock, MapPin, UserRound, Stethoscope, Video, Phone, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';

import { Suspense } from 'react';

function NewAppointmentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const doctorId = searchParams.get('doctor');
  
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    forSomeoneElse: false,
    dependentName: '',
    relationship: '',
    location: 'Online', 
    time: '',
    sessionType: 'VIDEO',
    notes: ''
  });

  useEffect(() => {
    if (doctorId) {
      async function fetchDoc() {
        try {
          const docs = await fetchApi('/appointments/doctors');
          const doc = docs.find((d: any) => d.id === doctorId);
          if (doc) setDoctorInfo(doc);
        } catch (e) {
          console.error(e);
        }
      }
      fetchDoc();
    }
  }, [doctorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetchApi('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patientName: formData.forSomeoneElse ? `${formData.dependentName} (${formData.relationship})` : 'Self',
          location: formData.location,
          preferredTime: formData.time,
          sessionType: formData.sessionType,
          notes: formData.notes,
          ...(doctorId ? { doctorId } : {})
        }),
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to book appointment', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      <div className="mb-8">
        <button onClick={() => router.back()} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </button>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-teal-100 rounded-2xl">
            <Calendar className="w-8 h-8 text-teal-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Book Appointment</h1>
            <p className="text-slate-500 mt-1">Schedule a session with our certified professionals.</p>
          </div>
        </div>
      </div>

      <Card className="border-teal-50 shadow-sm rounded-3xl bg-white overflow-hidden">
        {submitted ? (
          <div className="p-12 text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Appointment Requested ✅</h2>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">
              We have received your booking request. You can check the status in your appointments tab.
            </p>

            <div className="flex gap-4 justify-center">
              <Link href="/dashboard/appointments">
                <Button className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white">View Appointments</Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardHeader className="pb-4 bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-xl">Appointment Details</CardTitle>
              {doctorInfo && (
                <div className="flex items-center gap-3 mt-3 p-3 bg-white rounded-xl border border-slate-200">
                  <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center overflow-hidden">
                    {doctorInfo.avatarUrl ? <img src={doctorInfo.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <Stethoscope className="text-teal-600" />}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Booking with</p>
                    <p className="font-bold text-slate-800">{doctorInfo.name}</p>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="forSomeoneElse" 
                  checked={formData.forSomeoneElse}
                  onChange={(e) => setFormData({...formData, forSomeoneElse: e.target.checked})}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <Label htmlFor="forSomeoneElse" className="text-slate-700 font-medium cursor-pointer">Booking for someone else?</Label>
              </div>

              {formData.forSomeoneElse && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2 relative">
                    <Label htmlFor="dependentName" className="text-slate-700 font-medium">Dependent Name</Label>
                    <div className="relative">
                      <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input 
                        id="dependentName" 
                        placeholder="Jane Doe" 
                        required={formData.forSomeoneElse} 
                        value={formData.dependentName}
                        onChange={(e) => setFormData({...formData, dependentName: e.target.value})}
                        className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="relationship" className="text-slate-700 font-medium">Relationship</Label>
                    <Input 
                      id="relationship" 
                      placeholder="e.g. Child, Spouse" 
                      required={formData.forSomeoneElse} 
                      value={formData.relationship}
                      onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                      className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-teal-500"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-slate-700 font-medium">Date & Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input 
                      id="time" 
                      type="datetime-local" 
                      required 
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionType" className="text-slate-700 font-medium">Session Type</Label>
                  <select 
                    id="sessionType"
                    value={formData.sessionType}
                    onChange={(e) => setFormData({...formData, sessionType: e.target.value})}
                    className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="VIDEO">Video Call</option>
                    <option value="AUDIO">Audio Call</option>
                    <option value="CHAT">Live Chat</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-slate-700 font-medium">Notes for Therapist (Optional)</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Any specific topics or symptoms you'd like to discuss..." 
                  value={formData.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, notes: e.target.value})}
                  className="rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-teal-500 min-h-[100px]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-lg"
                >
                  {loading ? 'Confirming...' : 'Confirm Booking'}
                </Button>
              </div>

            </CardContent>
          </form>
        )}
      </Card>
    </div>
  );
}

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>}>
      <NewAppointmentContent />
    </Suspense>
  );
}
