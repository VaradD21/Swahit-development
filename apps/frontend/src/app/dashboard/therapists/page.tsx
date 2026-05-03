'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Star, GraduationCap, Languages, BadgeCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  avatarUrl: string | null;
  rating: number;
  reviewCount: number;
  yearsExp: number;
  languages: string;
  consultFee: number;
};

export default function TherapistsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');

  useEffect(() => {
    async function loadDoctors() {
      try {
        setLoading(true);
        // GET /appointments/doctors
        const data = await fetchApi('/appointments/doctors');
        setDoctors(data);
      } catch (error) {
        console.error('Failed to load therapists', error);
      } finally {
        setLoading(false);
      }
    }
    loadDoctors();
  }, []);

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = specialtyFilter ? doc.specialty.toLowerCase() === specialtyFilter.toLowerCase() : true;
    return matchesSearch && matchesSpecialty;
  });

  const specialties = Array.from(new Set(doctors.map(d => d.specialty)));

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Find a Therapist</h1>
          <p className="text-slate-500 mt-2">Connect with verified professionals for your mental wellness journey.</p>
        </div>
        
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-slate-200 rounded-xl w-full sm:w-64 focus-visible:ring-teal-500"
            />
          </div>
          <select 
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="flex h-10 w-full sm:w-48 items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">All Specialties</option>
            {specialties.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="rounded-3xl border-slate-100 shadow-sm animate-pulse h-80 bg-white" />
          ))}
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
          <p className="text-slate-500 text-lg">No therapists found matching your criteria.</p>
          <Button 
            variant="link" 
            onClick={() => { setSearchTerm(''); setSpecialtyFilter(''); }}
            className="text-teal-600 mt-2"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <Card key={doctor.id} className="rounded-3xl border-teal-50 shadow-sm bg-white overflow-hidden hover:shadow-md hover:border-teal-100 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center overflow-hidden border border-teal-100">
                      {doctor.avatarUrl ? (
                        <img src={doctor.avatarUrl} alt={doctor.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-teal-600">{doctor.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 flex items-center gap-1.5">
                        {doctor.name}
                        <BadgeCheck className="w-4 h-4 text-emerald-500" />
                      </h3>
                      <p className="text-sm font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md inline-block mt-1">
                        {doctor.specialty}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    <span>{doctor.yearsExp} years experience</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Languages className="w-4 h-4 text-slate-400" />
                    <span>{doctor.languages}</span>
                  </div>
                  <div className="flex items-center justify-between mt-4 p-3 bg-slate-50 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 uppercase font-semibold">Consultation</span>
                      <span className="font-bold text-slate-800">₹{doctor.consultFee}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-4 h-4 fill-amber-500" />
                      <span className="font-bold text-sm text-slate-700">{doctor.rating}</span>
                      <span className="text-xs text-slate-400">({doctor.reviewCount})</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="px-6 pb-6 pt-0 gap-3">
                <Link href={`/dashboard/therapists/${doctor.id}`} className="w-1/2">
                  <Button variant="outline" className="w-full rounded-xl border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-teal-50">
                    View Profile
                  </Button>
                </Link>
                <Link href={`/dashboard/appointments/new?doctor=${doctor.id}`} className="w-1/2">
                  <Button className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/20">
                    Book Now
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
