"use client";

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { FeatureGate } from '@/components/feature-gate';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BrainCircuit, Activity, Zap } from 'lucide-react';

export default function InsightsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchApi('/mood/insights').then(setData).catch(console.error);
  }, []);

  return (
    <FeatureGate featureKey="mood_insights_weekly">
      <div className="flex flex-col max-w-5xl mx-auto w-full p-4 lg:p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">AI Insights</h1>
            <p className="text-slate-500">Correlations and patterns detected from your moods and journals.</p>
          </div>
        </div>

        {!data ? (
          <div className="animate-pulse flex gap-4">
            <div className="h-32 bg-slate-100 rounded-2xl flex-1"></div>
            <div className="h-32 bg-slate-100 rounded-2xl flex-1"></div>
          </div>
        ) : data.message ? (
          <Card className="p-8 text-center text-slate-500 border-dashed">
            {data.message}
          </Card>
        ) : (
          <>
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5 border-slate-100 flex flex-col justify-center items-center text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">30-Day Average</p>
                <p className="text-4xl font-black text-indigo-600">{data.averageScore} <span className="text-xl text-slate-400">/ 10</span></p>
              </Card>
              <Card className="p-5 border-slate-100 flex flex-col justify-center items-center text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Most Frequent</p>
                <p className="text-2xl font-black text-slate-700 capitalize">{data.mostFrequentMood}</p>
              </Card>
              <Card className="p-5 border-slate-100 bg-indigo-50 flex flex-col justify-center items-center text-center">
                <Zap className="w-6 h-6 text-indigo-500 mb-2" />
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Detected Trigger</p>
                <p className="text-sm font-semibold text-indigo-900 leading-tight">
                  {data.topTrigger || "No clear negative triggers detected. You're doing great!"}
                </p>
              </Card>
            </div>

            {/* Chart */}
            <Card className="p-6 border-slate-100">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-slate-400" />
                <h3 className="font-bold text-slate-700">Mood Trend (Last 30 Days)</h3>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      domain={[0, 10]} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: '#64748b', fontWeight: 600, marginBottom: '4px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="intensity" 
                      stroke="#4f46e5" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }} 
                      activeDot={{ r: 6, strokeWidth: 0 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </>
        )}
      </div>
    </FeatureGate>
  );
}
