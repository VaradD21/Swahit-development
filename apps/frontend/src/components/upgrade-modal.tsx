'use client';

import React, { useState } from 'react';
import { useEntitlements } from '../context/entitlement-context';
import { X, Check, Loader2, Sparkles, Zap, Crown, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';

export function UpgradeModal() {
  const { isUpgradeModalOpen, closeUpgradeModal, entitlements } = useEntitlements();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  if (!isUpgradeModalOpen) return null;

  const currentPlan = entitlements?.plan || 'FREE';

  const handleStripeCheckout = async (planId: string, priceId: string) => {
    try {
      setLoadingPlan(planId);
      const data = await fetchApi('/payments/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId, priceId }),
      });
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || 'Payment initiation failed');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleRazorpayCheckout = async (planId: string, amount: number) => {
    try {
      setLoadingPlan(planId);
      const order = await fetchApi('/payments/razorpay/order', {
        method: 'POST',
        body: JSON.stringify({ planId, amount }),
      });

      // Load Razorpay Script
      const res = await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!res) {
        toast.error('Razorpay SDK failed to load');
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || 'rzp_test_mock',
        amount: order.amount,
        currency: order.currency,
        name: 'Swahit Wellness',
        description: `Upgrade to ${planId}`,
        order_id: order.id,
        handler: function (response: any) {
          toast.success('Payment successful! Verifying...');
          window.location.href = '/dashboard/settings?success=true';
        },
        prefill: {
          name: '',
          email: '',
        },
        theme: {
          color: '#0d9488',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error('Could not initialize Razorpay');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white/95 rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 border border-white/20">
        <div className="relative p-8 md:p-12">
          <button 
            onClick={closeUpgradeModal} 
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 text-teal-600 text-xs font-bold uppercase tracking-widest mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> Empower Your Mind
            </div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">Choose Your Wellness Path</h2>
            <p className="text-slate-500 mt-2 text-lg">Unlock professional care and advanced AI insights.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* GOLD PLAN */}
            <div className="group bg-white rounded-3xl p-8 border-2 border-slate-100 hover:border-teal-500 transition-all duration-300 shadow-sm hover:shadow-xl relative">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                  <Zap className="w-7 h-7" />
                </div>
                {currentPlan === 'GOLD' && (
                  <span className="text-[10px] font-bold px-3 py-1 bg-teal-100 text-teal-700 rounded-full uppercase">Current</span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Gold Explorer</h3>
              <div className="mt-2 flex items-baseline text-slate-900">
                <span className="text-4xl font-black tracking-tight">₹499</span>
                <span className="ml-1 text-lg font-medium text-slate-400">/mo</span>
              </div>
              <ul className="mt-8 space-y-4">
                {[
                  'Unlimited AI Venting & CBT',
                  'Weekly Detailed Insights',
                  '1 Free Clinical Session /mo',
                  'Priority Community Support'
                ].map((feat, i) => (
                  <li key={i} className="flex items-center text-slate-600 text-sm">
                    <div className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center mr-3 flex-shrink-0">
                      <Check className="w-3 h-3 text-teal-600" />
                    </div>
                    {feat}
                  </li>
                ))}
              </ul>
              <div className="mt-10 space-y-3">
                <Button 
                  onClick={() => handleStripeCheckout('GOLD', 'price_gold')} 
                  disabled={loadingPlan !== null || currentPlan === 'GOLD'}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-2xl h-14 text-lg font-bold shadow-lg shadow-teal-600/20"
                >
                  {loadingPlan === 'GOLD' ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Shield className="w-5 h-5 mr-2" />}
                  Upgrade Now
                </Button>
                <button 
                  onClick={() => handleRazorpayCheckout('GOLD', 499)}
                  disabled={loadingPlan !== null || currentPlan === 'GOLD'}
                  className="w-full text-slate-400 hover:text-slate-600 text-xs font-medium py-2 transition-colors"
                >
                  Or pay with Razorpay (Local Cards)
                </button>
              </div>
            </div>

            {/* PLATINUM PLAN */}
            <div className="group bg-slate-900 rounded-3xl p-8 border-2 border-slate-900 hover:border-teal-400 transition-all duration-300 shadow-2xl relative text-white overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Crown className="w-32 h-32" />
              </div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-teal-400 group-hover:bg-teal-400 group-hover:text-slate-900 transition-colors duration-300">
                  <Crown className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-bold px-3 py-1 bg-teal-400 text-slate-900 rounded-full uppercase tracking-widest">Premium</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Platinum Elite</h3>
              <div className="mt-2 flex items-baseline text-white">
                <span className="text-4xl font-black tracking-tight">₹999</span>
                <span className="ml-1 text-lg font-medium text-slate-400">/mo</span>
              </div>
              <ul className="mt-8 space-y-4">
                {[
                  'Everything in Gold Plan',
                  'Unlimited Video Sessions',
                  'Personal Case Manager',
                  'Advanced Predictive Analytics'
                ].map((feat, i) => (
                  <li key={i} className="flex items-center text-slate-300 text-sm">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center mr-3 flex-shrink-0">
                      <Check className="w-3 h-3 text-teal-400" />
                    </div>
                    {feat}
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Button 
                  onClick={() => handleStripeCheckout('PLATINUM', 'price_platinum')} 
                  disabled={loadingPlan !== null || currentPlan === 'PLATINUM'}
                  className="w-full bg-white text-slate-900 hover:bg-teal-50 rounded-2xl h-14 text-lg font-bold transition-all transform hover:scale-[1.02]"
                >
                  {loadingPlan === 'PLATINUM' ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : 'Get Full Access'}
                </Button>
                <p className="text-center text-[10px] text-slate-500 mt-4 uppercase tracking-widest font-bold">Safe & Secure 256-bit Encryption</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
