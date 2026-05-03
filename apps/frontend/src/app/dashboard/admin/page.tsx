'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, ShieldCheck, Users, Calendar, Activity, GraduationCap, UserPlus, CreditCard, Pill, FileCheck, Search } from 'lucide-react';
import { toast } from 'sonner';
import { fetchApi } from '@/lib/api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [users, setUsers] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [doctorForm, setDoctorForm] = useState({
    fullName: '',
    email: '',
    password: '',
    specialty: '',
    experienceYears: '',
    fee: '',
    languages: 'English',
    bio: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, d, a, an, p, o] = await Promise.all([
        fetchApi('/admin/users'),
        fetchApi('/admin/therapists'),
        fetchApi('/admin/appointments'),
        fetchApi('/admin/analytics'),
        fetchApi('/admin/medicine/prescriptions'),
        fetchApi('/admin/medicine/orders')
      ]);
      setUsers(u);
      setDoctors(d);
      setAppointments(a);
      setAnalytics(an);
      setPrescriptions(p);
      setOrders(o);
    } catch (error) {
      console.error('Failed to load admin data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddTherapist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/admin/therapists', {
        method: 'POST',
        body: JSON.stringify(doctorForm)
      });
      toast.success('Therapist added successfully');
      setDoctorForm({ fullName: '', email: '', password: '', specialty: '', experienceYears: '', fee: '', languages: 'English', bio: '' });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add therapist');
    }
  };

  const handleVerifyPrescription = async (id: string, verified: boolean) => {
    try {
      await fetchApi(`/admin/medicine/prescriptions/${id}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ verified })
      });
      toast.success(`Prescription ${verified ? 'verified' : 'unverified'} successfully.`);
      loadData();
    } catch (error) {
      toast.error('Failed to update prescription');
    }
  };

  const handleToggleDoctorStatus = async (id: string, currentStatus: boolean) => {
    try {
      await fetchApi(`/admin/therapists/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable: !currentStatus })
      });
      toast.success('Doctor availability updated');
      loadData();
    } catch (error) {
      toast.error('Failed to update doctor status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 animate-in fade-in duration-500 pb-20">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Admin Control Center</h1>
            <p className="text-slate-500 mt-1">Global platform oversight and management.</p>
          </div>
        </div>
        <Button onClick={loadData} variant="outline" className="rounded-xl border-slate-200">
          Refresh Data
        </Button>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Users', value: analytics.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Active Subs', value: analytics.activeSubscriptions, icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Verified Doctors', value: analytics.totalDoctors, icon: GraduationCap, color: 'text-teal-600', bg: 'bg-teal-50' },
            { label: 'Crisis Alerts', value: analytics.crisisAlerts, icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Est. Revenue', value: `₹${analytics.estimatedMonthlyRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((item, idx) => (
            <Card key={idx} className="border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{item.label}</p>
                <p className="text-xl font-bold text-slate-800 mt-1">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8 bg-slate-100 p-1 rounded-xl w-full flex overflow-x-auto h-auto">
          <TabsTrigger value="analytics" className="flex-1 rounded-lg py-2.5 data-[state=active]:bg-white">Analytics</TabsTrigger>
          <TabsTrigger value="users" className="flex-1 rounded-lg py-2.5 data-[state=active]:bg-white">User Management</TabsTrigger>
          <TabsTrigger value="doctors" className="flex-1 rounded-lg py-2.5 data-[state=active]:bg-white">Doctor Control</TabsTrigger>
          <TabsTrigger value="appointments" className="flex-1 rounded-lg py-2.5 data-[state=active]:bg-white">Appointments</TabsTrigger>
          <TabsTrigger value="medicine" className="flex-1 rounded-lg py-2.5 data-[state=active]:bg-white">Medicine System</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
           <div className="grid md:grid-cols-2 gap-6">
              <Card className="rounded-2xl border-slate-100">
                <CardHeader><CardTitle className="text-lg">Recent User Growth</CardTitle></CardHeader>
                <CardContent className="h-64 flex items-center justify-center text-slate-400">
                  Analytics Chart Placeholder
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-slate-100">
                <CardHeader><CardTitle className="text-lg">Subscription Distribution</CardTitle></CardHeader>
                <CardContent className="h-64 flex items-center justify-center text-slate-400">
                  Analytics Chart Placeholder
                </CardContent>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="users">
          <Card className="border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">User Database</h3>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search email or name..." className="pl-9 rounded-xl h-9 text-sm" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Plan</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{u.name || 'N/A'}</p>
                        <p className="text-sm text-slate-500">{u.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${u.role === 'ADMIN' ? 'bg-rose-100 text-rose-700' : u.role === 'DOCTOR' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-700">{u.userSubscriptions?.[0]?.plan?.name || 'FREE'}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="ghost" size="sm" className="rounded-lg text-teal-600 hover:text-teal-700 hover:bg-teal-50">View Details</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="doctors" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Verified Professionals</h2>
            <Button onClick={() => setActiveTab('add_doctor')} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl">
              <UserPlus className="w-4 h-4 mr-2" /> Onboard New
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {doctors.map(doc => (
              <Card key={doc.id} className="border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden group">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${doc.isAvailable ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                      {doc.isAvailable ? 'AVAILABLE' : 'OFFLINE'}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">{doc.name}</h3>
                  <p className="text-sm text-teal-600 font-medium mb-4">{doc.specialty}</p>
                  <div className="space-y-2 text-sm text-slate-500 mb-6">
                    <div className="flex justify-between"><span>Experience:</span> <span className="font-medium text-slate-800">{doc.yearsExp} Years</span></div>
                    <div className="flex justify-between"><span>Fee:</span> <span className="font-medium text-slate-800">₹{doc.consultFee}</span></div>
                    <div className="flex justify-between"><span>Rating:</span> <span className="font-medium text-slate-800">★ {doc.rating}</span></div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 rounded-xl h-10 border-slate-200">Edit</Button>
                    <Button 
                      variant={doc.isAvailable ? "outline" : "default"}
                      onClick={() => handleToggleDoctorStatus(doc.id, doc.isAvailable)}
                      className={`flex-1 rounded-xl h-10 ${!doc.isAvailable ? 'bg-teal-600 hover:bg-teal-700' : 'text-rose-600 border-rose-100 hover:bg-rose-50'}`}
                    >
                      {doc.isAvailable ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="appointments">
           <Card className="border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                     <th className="px-6 py-4">Patient</th>
                     <th className="px-6 py-4">Doctor</th>
                     <th className="px-6 py-4">Type</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4">Time</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {appointments.map(appt => (
                     <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                       <td className="px-6 py-4">
                         <p className="font-bold text-slate-800">{appt.patientName}</p>
                         <p className="text-xs text-slate-500">{appt.user?.email}</p>
                       </td>
                       <td className="px-6 py-4">
                         <p className="font-medium text-slate-800">{appt.doctor?.name || 'Assigned AI'}</p>
                         <p className="text-xs text-slate-500">{appt.doctor?.specialty}</p>
                       </td>
                       <td className="px-6 py-4 text-sm text-slate-700">{appt.sessionType}</td>
                       <td className="px-6 py-4">
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${appt.status === 'CONFIRMED' ? 'bg-teal-100 text-teal-700' : appt.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                           {appt.status}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-sm text-slate-500">
                         {new Date(appt.preferredTime).toLocaleString()}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </Card>
        </TabsContent>

        <TabsContent value="medicine" className="space-y-6">
           <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-4">
               <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileCheck className="w-5 h-5 text-teal-600" /> Pending Verifications</h3>
               {prescriptions.map(p => (
                 <Card key={p.id} className="border-slate-100 shadow-sm rounded-2xl bg-white p-5">
                   <div className="flex justify-between items-start mb-4">
                     <div>
                       <p className="font-bold text-slate-800">{p.user?.name}</p>
                       <p className="text-xs text-slate-500">Prescribed by {p.doctor?.name || 'External'}</p>
                     </div>
                     {p.verified ? (
                       <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full">VERIFIED</span>
                     ) : (
                       <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">PENDING</span>
                     )}
                   </div>
                   <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4 h-32 flex items-center justify-center text-slate-400">
                     [Prescription Image Link: {p.fileUrl.substring(0, 20)}...]
                   </div>
                   {!p.verified && (
                     <Button onClick={() => handleVerifyPrescription(p.id, true)} className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl">Verify & Approve</Button>
                   )}
                 </Card>
               ))}
             </div>
             <div className="space-y-4">
               <h3 className="font-bold text-slate-800 flex items-center gap-2"><Pill className="w-5 h-5 text-teal-600" /> Recent Orders</h3>
               {orders.map(o => (
                 <Card key={o.id} className="border-slate-100 shadow-sm rounded-2xl bg-white p-5">
                   <div className="flex justify-between items-center mb-3">
                     <p className="font-bold text-slate-800">{o.user?.name}</p>
                     <p className="text-sm font-bold text-teal-600">₹{o.totalAmount}</p>
                   </div>
                   <div className="text-xs text-slate-500 space-y-1 mb-4">
                     {o.items?.map((item: any, i: number) => (
                       <div key={i} className="flex justify-between"><span>{item.medicineName} x {item.quantity}</span><span>₹{item.price}</span></div>
                     ))}
                   </div>
                   <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                     <span className="text-[10px] font-bold uppercase text-slate-400">{o.status}</span>
                     <p className="text-[10px] text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                   </div>
                 </Card>
               ))}
             </div>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
