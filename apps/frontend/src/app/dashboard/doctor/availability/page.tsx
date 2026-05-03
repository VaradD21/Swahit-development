'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Clock, Plus, Trash2, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AvailabilityPage() {
  const [slots, setSlots] = useState([
    { id: 1, day: 'Monday', start: '10:00', end: '14:00' },
    { id: 2, day: 'Wednesday', start: '14:00', end: '18:00' },
  ]);

  const addSlot = () => {
    setSlots([...slots, { id: Date.now(), day: 'Monday', start: '09:00', end: '17:00' }]);
  };

  const removeSlot = (id: number) => {
    setSlots(slots.filter(s => s.id !== id));
  };

  const handleSave = () => {
    toast.success('Availability schedule saved successfully.');
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      <Link href="/dashboard/doctor" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Portal
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Availability Management</h1>
        <p className="text-slate-500 mt-1">Set your weekly working hours and time slots.</p>
      </div>

      <Card className="border-teal-50 shadow-sm rounded-3xl bg-white overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-xl">Weekly Schedule</CardTitle>
          <CardDescription>Patients will only be able to book sessions during these hours.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          
          {slots.map((slot) => (
            <div key={slot.id} className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200">
              <select className="h-12 w-full sm:w-48 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-visible:ring-teal-500">
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </select>
              
              <div className="flex items-center gap-2 w-full">
                <Input type="time" defaultValue={slot.start} className="h-12 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-teal-500" />
                <span className="text-slate-400 font-medium">to</span>
                <Input type="time" defaultValue={slot.end} className="h-12 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-teal-500" />
              </div>

              <Button variant="ghost" onClick={() => removeSlot(slot.id)} className="h-12 w-12 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl shrink-0">
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          ))}

          <Button variant="outline" onClick={addSlot} className="w-full h-12 border-dashed border-2 border-slate-200 text-slate-600 hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50 rounded-xl mt-4">
            <Plus className="w-5 h-5 mr-2" /> Add Time Slot
          </Button>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <Button onClick={handleSave} className="w-full sm:w-auto h-12 px-8 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm text-base">
              <Save className="w-5 h-5 mr-2" /> Save Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
