'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchApi } from '@/lib/api';

export interface FeatureAccess {
  enabled: boolean;
  limit: number | null;
  used: number;
  remaining: number | null;
}

export interface EntitlementsState {
  plan: string;
  features: Record<string, FeatureAccess>;
}

interface EntitlementContextValue {
  entitlements: EntitlementsState | null;
  loading: boolean;
  error: string | null;
  refreshEntitlements: () => Promise<void>;
  checkAccess: (featureKey: string) => FeatureAccess;
  openUpgradeModal: () => void;
  isUpgradeModalOpen: boolean;
  closeUpgradeModal: () => void;
}

const EntitlementContext = createContext<EntitlementContextValue | undefined>(undefined);

export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const [entitlements, setEntitlements] = useState<EntitlementsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const fetchEntitlements = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const data = await fetchApi('/user/entitlements');
      setEntitlements(data);
    } catch (err) {
      console.error(err);
      setError('Network error fetching entitlements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntitlements();
  }, [fetchEntitlements]);

  const checkAccess = useCallback(
    (featureKey: string): FeatureAccess => {
      if (!entitlements) return { enabled: false, limit: null, used: 0, remaining: 0 };
      return entitlements.features[featureKey] || { enabled: false, limit: null, used: 0, remaining: 0 };
    },
    [entitlements]
  );

  const openUpgradeModal = useCallback(() => setIsUpgradeModalOpen(true), []);
  const closeUpgradeModal = useCallback(() => setIsUpgradeModalOpen(false), []);

  return (
    <EntitlementContext.Provider
      value={{
        entitlements,
        loading,
        error,
        refreshEntitlements: fetchEntitlements,
        checkAccess,
        openUpgradeModal,
        isUpgradeModalOpen,
        closeUpgradeModal,
      }}
    >
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlements() {
  const context = useContext(EntitlementContext);
  if (context === undefined) {
    throw new Error('useEntitlements must be used within an EntitlementProvider');
  }
  return context;
}
