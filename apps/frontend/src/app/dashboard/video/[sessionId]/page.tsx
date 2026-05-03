"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { fetchApi } from '@/lib/api';
import { FeatureGate } from '@/components/feature-gate';
import { Card } from '@/components/ui/card';
import { DailyProvider } from '@daily-co/daily-react';
// import { DailyVideo } from '@/components/dashboard/daily-video'; // We will create this wrapper next

export default function VideoConsultationPage() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadToken() {
      try {
        const response = await fetchApi(`/video/token/${sessionId}`);
        setToken(response.token);
        setRoomUrl(`https://swahit.daily.co/${response.roomName}`);
      } catch (err: any) {
        setError(err.message || 'Failed to connect to the video session.');
      }
    }
    if (sessionId) loadToken();
  }, [sessionId]);

  return (
    <FeatureGate featureKey="live_consultation">
      <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Live Consultation</h1>
          <p className="text-slate-500">Your secure, private session with a licensed professional.</p>
        </div>

        <Card className="flex-1 overflow-hidden bg-black flex items-center justify-center border-none shadow-xl rounded-2xl">
          {error ? (
            <div className="text-red-400 text-center">
              <p className="text-lg font-semibold">Connection Error</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          ) : token && roomUrl ? (
            <DailyProvider url={roomUrl} token={token}>
              {/* <DailyVideo /> */}
              <div className="text-white text-center p-8">
                <p className="text-xl font-bold">Daily.co Call Active</p>
                <p className="text-slate-400 mt-2 text-sm">Room: {roomUrl}</p>
                <p className="text-teal-400 mt-4 text-xs bg-teal-900/30 px-3 py-1 rounded-full border border-teal-800/50 inline-block">
                  Awaiting UI Component implementation
                </p>
              </div>
            </DailyProvider>
          ) : (
            <div className="text-slate-400 animate-pulse text-sm">
              Connecting to secure room...
            </div>
          )}
        </Card>
      </div>
    </FeatureGate>
  );
}
