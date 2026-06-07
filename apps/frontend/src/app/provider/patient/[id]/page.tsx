'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchApi } from '@/lib/api';
import { User, Activity, FileText, Pill, ArrowLeft, Plus, Clock, Smile, Frown, Meh, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function PatientDetails() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      const data = await fetchApi(`/doctor/patient/${patientId}`);
      setPatient(data);
    } catch (error) {
      console.error('Failed to load patient data', error);
      toast.error('Could not load patient clinical data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) loadPatientData();
  }, [patientId]);

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      setSaving(true);
      await fetchApi('/doctor/clinical-notes', {
        method: 'POST',
        body: JSON.stringify({ userId: patientId, content: note, type: 'SOAP_NOTE' })
      });
      toast.success('Clinical note added');
      setNote('');
      loadPatientData();
    } catch (error) {
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-400">Loading Clinical Profile...</div>;
  if (!patient) return <div className="p-10 text-center text-rose-500">Patient not found or Access Denied.</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 animate-in fade-in duration-500 pb-20">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 rounded-xl text-slate-500">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="space-y-6">
          <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
             <div className="h-24 bg-gradient-to-br from-teal-500 to-emerald-600"></div>
             <CardContent className="p-6 -mt-12 text-center">
               <div className="w-24 h-24 bg-white rounded-3xl shadow-lg mx-auto flex items-center justify-center border-4 border-white mb-4">
                 <User className="w-12 h-12 text-teal-600" />
               </div>
               <h1 className="text-2xl font-bold text-slate-800">{patient.profile?.name}</h1>
               <p className="text-slate-500 text-sm mb-4">{patient.profile?.email}</p>
               <div className="flex justify-center gap-2 mb-6">
                 <span className="text-[10px] font-bold px-2 py-1 bg-teal-50 text-teal-700 rounded-md uppercase tracking-wider">Patient ID: {patientId.substring(0, 8)}</span>
               </div>
               
               <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Gender</p>
                    <p className="text-sm font-semibold text-slate-700">{patient.profile?.gender || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Age</p>
                    <p className="text-sm font-semibold text-slate-700">{patient.profile?.age || 'N/A'}</p>
                  </div>
               </div>
             </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm rounded-3xl bg-white p-6">
             <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
               <Activity className="w-5 h-5 text-teal-600" />
               Clinical Overview
             </h3>
             <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-rose-50 rounded-2xl border border-rose-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span className="text-sm font-medium text-rose-800">Crisis Triggers</span>
                  </div>
                  <span className="text-xs font-bold text-rose-700">LOW RISK</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">Session Adherence</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">92%</span>
                </div>
             </div>
          </Card>
        </div>

        {/* Clinical Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="mood" className="w-full">
            <TabsList className="mb-8 bg-slate-100 p-1 rounded-2xl w-full">
              <TabsTrigger value="mood" className="flex-1 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">Wellness Data</TabsTrigger>
              <TabsTrigger value="notes" className="flex-1 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">Clinical Notes</TabsTrigger>
              <TabsTrigger value="prescriptions" className="flex-1 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">Medicine</TabsTrigger>
            </TabsList>

            <TabsContent value="mood" className="space-y-6">
               <div className="grid md:grid-cols-2 gap-6">
                 {/* Mood History */}
                 <div className="space-y-4">
                   <h3 className="font-bold text-slate-800">Mood Trends</h3>
                   <div className="space-y-3">
                     {patient.moodHistory?.map((m: any) => (
                       <div key={m.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           {m.mood === 'HAPPY' ? <Smile className="text-emerald-500" /> : m.mood === 'SAD' ? <Frown className="text-rose-500" /> : <Meh className="text-amber-500" />}
                           <div>
                             <p className="font-bold text-slate-800">{m.mood}</p>
                             <p className="text-xs text-slate-400">{new Date(m.createdAt).toLocaleDateString()}</p>
                           </div>
                         </div>
                         <p className="text-xs italic text-slate-500 max-w-[120px] truncate">{m.note}</p>
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* Journals */}
                 <div className="space-y-4">
                   <h3 className="font-bold text-slate-800">Recent Journals</h3>
                   <div className="space-y-3">
                     {patient.journals?.map((j: any) => (
                       <div key={j.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                         <div className="flex justify-between items-start mb-2">
                            <p className="font-bold text-slate-800 text-sm">{j.title || 'Untitled Entry'}</p>
                            <span className="text-[10px] text-slate-400">{new Date(j.createdAt).toLocaleDateString()}</span>
                         </div>
                         <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{j.content}</p>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-6">
               <Card className="border-teal-100 shadow-sm rounded-3xl bg-teal-50/10 overflow-hidden">
                 <CardHeader className="bg-white border-b border-slate-100">
                    <CardTitle className="text-lg">Add Progress Note</CardTitle>
                 </CardHeader>
                 <CardContent className="p-6">
                   <Textarea 
                     placeholder="Document session progress, observations, and plan..." 
                     className="rounded-2xl min-h-[150px] mb-4 border-slate-200 focus:ring-teal-500"
                     value={note}
                     onChange={(e: any) => setNote(e.target.value)}
                   />
                   <div className="flex justify-end">
                     <Button onClick={handleAddNote} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-11 px-8 font-semibold">
                       {saving ? 'Saving...' : 'Save SOAP Note'}
                     </Button>
                   </div>
                 </CardContent>
               </Card>

               <div className="space-y-4">
                  <h3 className="font-bold text-slate-800">Timeline</h3>
                  {patient.clinicalNotes?.map((cn: any) => (
                    <div key={cn.id} className="relative pl-6 border-l-2 border-slate-100 pb-6 last:pb-0">
                       <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-teal-500 shadow-sm"></div>
                       <Card className="border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
                          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{cn.type.replace('_', ' ')}</p>
                            <p className="text-[10px] text-slate-400">{new Date(cn.createdAt).toLocaleString()}</p>
                          </div>
                          <CardContent className="p-5">
                             <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{cn.content}</p>
                          </CardContent>
                       </Card>
                    </div>
                  ))}
               </div>
            </TabsContent>

            <TabsContent value="prescriptions" className="space-y-6">
               <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Current Medications</h3>
                  <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs h-9">
                    <Plus className="w-4 h-4 mr-2" /> New Prescription
                  </Button>
               </div>
               <div className="grid md:grid-cols-2 gap-4">
                  {patient.prescriptions?.map((p: any) => (
                    <Card key={p.id} className="border-slate-100 shadow-sm rounded-2xl bg-white p-5 group hover:border-teal-200 transition-colors">
                       <div className="flex justify-between items-start mb-4">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                             <Pill className="w-5 h-5" />
                          </div>
                          {p.verified ? (
                             <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full">VERIFIED</span>
                          ) : (
                             <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">PENDING</span>
                          )}
                       </div>
                       <p className="text-xs text-slate-400 mb-1">Prescribed Date: {new Date(p.createdAt).toLocaleDateString()}</p>
                       <p className="text-sm font-medium text-slate-800 mb-4">View Document</p>
                       <Button variant="outline" className="w-full text-xs h-9 rounded-lg border-slate-200">View Attachment</Button>
                    </Card>
                  ))}
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
