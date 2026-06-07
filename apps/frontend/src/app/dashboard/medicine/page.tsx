"use client";

import { useState, useEffect } from 'react';
import { FeatureGate } from '@/components/feature-gate';
import { Card } from '@/components/ui/card';
import { Pill, FileText, Truck, ShieldCheck, Plus, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';

export default function MedicinePage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    try {
      const [presData, ordersData] = await Promise.all([
        fetchApi('/medicine/prescriptions').catch(() => []),
        fetchApi('/medicine/orders').catch(() => [])
      ]);
      setPrescriptions(presData || []);
      setOrders(ordersData || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load pharmacy data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUploadMock = async () => {
    try {
      setUploading(true);
      // Mock upload URL to bypass S3 for now but test end-to-end DB flow
      const mockUrl = 'https://swahit-prescriptions.s3.amazonaws.com/test-prescription-' + Date.now() + '.pdf';
      await fetchApi('/medicine/prescriptions', {
        method: 'POST',
        body: JSON.stringify({ fileUrl: mockUrl })
      });
      toast.success('Prescription uploaded successfully. Awaiting verification.');
      loadData();
    } catch (err) {
      toast.error('Failed to upload prescription');
    } finally {
      setUploading(false);
    }
  };

  const handleOrder = async (prescriptionId: string) => {
    try {
      await fetchApi('/medicine/orders', {
        method: 'POST',
        body: JSON.stringify({
          prescriptionId,
          items: [{ medicineName: 'Consultation Bundle', quantity: 1, price: 50.00 }]
        })
      });
      toast.success('Order placed successfully!');
      loadData();
    } catch (err) {
      toast.error('Failed to place order. Prescription may not be verified yet.');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto w-full p-4 lg:p-6 overflow-y-auto">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pharmacy & Prescriptions</h1>
        <p className="text-slate-500">Manage your prescriptions and order medicine securely to your door.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <Button 
                onClick={handleUploadMock} 
                disabled={uploading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20"
              >
                {uploading ? 'Uploading...' : 'Select File (Mock)'}
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
          
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800">Your Prescriptions</h3>
            {loading ? <p className="text-xs text-slate-400">Loading...</p> : 
             prescriptions.length === 0 ? <p className="text-xs text-slate-400">No prescriptions found.</p> :
             prescriptions.map(p => (
               <Card key={p.id} className="p-4 flex items-center justify-between border-slate-100">
                 <div className="flex items-center gap-3">
                   <FileText className="text-teal-600 w-5 h-5" />
                   <div>
                     <p className="text-sm font-medium text-slate-700">Rx_{p.id.substring(0,6)}</p>
                     <p className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                   </div>
                 </div>
                 {p.verified ? (
                   <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md font-bold">VERIFIED</span>
                 ) : (
                   <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-bold">PENDING</span>
                 )}
               </Card>
             ))
            }
          </div>
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
                <div className="flex gap-2">
                   <Button variant="outline" size="sm" onClick={loadData} className="text-slate-500">
                     Refresh
                   </Button>
                </div>
              </div>

              <div className="flex-1">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-slate-400">Loading orders...</div>
                ) : orders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Truck className="w-12 h-12 text-slate-200 mb-4" />
                    <p className="text-sm">You have no active medicine orders.</p>
                    <p className="text-xs mt-2">Upload a verified prescription to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <Card key={order.id} className="p-5 border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                          <p className="font-bold text-slate-700">Order #{order.id.substring(0,8)}</p>
                          <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                          <p className="text-sm font-medium text-teal-700 mt-2">${order.totalAmount.toFixed(2)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">
                            {order.status}
                          </span>
                          <Button variant="outline" size="sm" className="text-xs h-8">
                            Track
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {prescriptions.some(p => p.verified) && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-4">Start New Order</h3>
                  <div className="flex gap-2 flex-wrap">
                    {prescriptions.filter(p => p.verified).map(p => (
                      <Button key={p.id} onClick={() => handleOrder(p.id)} className="bg-teal-600 hover:bg-teal-700 text-white shadow-md">
                        <Plus className="w-4 h-4 mr-2" /> Order from Rx_{p.id.substring(0,6)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </FeatureGate>
        </div>
      </div>
    </div>
  );
}
