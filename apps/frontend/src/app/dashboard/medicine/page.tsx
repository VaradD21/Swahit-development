"use client";

import { FeatureGate } from '@/components/feature-gate';
import { Card } from '@/components/ui/card';
import { Pill, FileText, Truck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MedicinePage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto w-full p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pharmacy & Prescriptions</h1>
        <p className="text-slate-500">Manage your prescriptions and order medicine securely to your door.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        {/* Left Column: Upload */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <FeatureGate featureKey="prescription_upload">
            <Card className="p-6 flex flex-col items-center justify-center text-center bg-teal-50/50 border-teal-100 shadow-sm border-dashed border-2">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-slate-800">Upload Prescription</h3>
              <p className="text-xs text-slate-500 mt-2 mb-6">
                Upload your doctor's prescription securely for verification.
              </p>
              <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20">
                Select File
              </Button>
            </Card>
          </FeatureGate>

          <Card className="p-6 bg-slate-50 border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-slate-700">Verified by Swahit</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              All prescriptions are manually verified by our onboarded medical professionals before any orders can be placed. Your data is encrypted and secure.
            </p>
          </Card>
        </div>

        {/* Right Column: Orders & Delivery */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <FeatureGate featureKey="medicine_delivery">
            <Card className="p-6 h-full border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-teal-600" />
                  My Orders
                </h2>
                <Button variant="outline" size="sm" className="text-teal-700 hover:bg-teal-50">
                  <Truck className="w-4 h-4 mr-2" /> Track Delivery
                </Button>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <p className="text-sm">You have no active medicine orders.</p>
                <p className="text-xs mt-2">Upload a prescription to get started.</p>
              </div>
            </Card>
          </FeatureGate>
        </div>
      </div>
    </div>
  );
}
