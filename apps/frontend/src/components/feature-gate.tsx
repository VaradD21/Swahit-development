'use client';

import React from 'react';
import { useEntitlements } from '../context/entitlement-context';
import { Lock } from 'lucide-react';
import { Button } from './ui/button';

interface FeatureGateProps {
  featureKey: string;
  children: React.ReactNode;
  fallbackMessage?: string;
  requiredPlanDisplay?: string;
}

export function FeatureGate({
  featureKey,
  children,
  fallbackMessage = 'This feature is locked.',
  requiredPlanDisplay = 'PREMIUM',
}: FeatureGateProps) {
  const { checkAccess, loading, openUpgradeModal } = useEntitlements();
  const access = checkAccess(featureKey);

  if (loading) {
    return <div className="animate-pulse bg-slate-100 rounded-xl h-32 w-full"></div>;
  }

  if (access.enabled && (access.limit === null || access.remaining! > 0)) {
    return <>{children}</>;
  }

  return (
    <div className="relative group overflow-hidden rounded-xl border border-slate-200">
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center transition-all duration-300">
        <div className="bg-slate-100 p-3 rounded-full mb-3 text-slate-500 shadow-sm">
          <Lock className="w-6 h-6" />
        </div>
        <h4 className="font-semibold text-slate-800 mb-1">{fallbackMessage}</h4>
        <p className="text-sm text-slate-600 mb-4 max-w-xs">
          Upgrade to {requiredPlanDisplay} to unlock this feature and elevate your mental wellness journey.
        </p>
        <Button onClick={openUpgradeModal} className="bg-teal-600 hover:bg-teal-700 text-white">
          Upgrade Now
        </Button>
      </div>
      <div className="opacity-30 pointer-events-none select-none blur-[2px]">{children}</div>
    </div>
  );
}
