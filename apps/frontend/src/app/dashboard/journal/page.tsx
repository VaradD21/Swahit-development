"use client";

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Sparkles, Clock } from 'lucide-react';
import { FeatureGate } from '@/components/feature-gate';

type JournalEntry = {
  id: string;
  content: string;
  summary?: string;
  emotionTags?: string;
  createdAt: string;
};

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const data = await fetchApi('/journal');
      setEntries(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await fetchApi('/journal', {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      setContent('');
      await loadEntries(); // Reload to see the new entry
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FeatureGate featureKey="journaling">
      <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto w-full p-4 lg:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 bg-teal-100 rounded-xl text-teal-700">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Daily Journal</h1>
            <p className="text-slate-500">Log your thoughts. AI will summarize and tag your emotions automatically.</p>
          </div>
        </div>

        <Card className="p-4 mb-8 bg-white border-teal-100 shadow-sm">
          <Textarea 
            placeholder="How are you feeling today? What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none border-0 focus-visible:ring-0 text-base"
          />
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">Your journal is fully private and encrypted.</span>
            <Button 
              onClick={handleSave} 
              disabled={loading || !content.trim()}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md"
            >
              {loading ? 'Saving...' : 'Save Entry'}
            </Button>
          </div>
        </Card>

        <div className="flex-1 overflow-y-auto space-y-4 pb-12">
          <h2 className="font-semibold text-slate-700 mb-4">Recent Entries</h2>
          {entries.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No entries yet. Start writing above!</p>
          ) : (
            entries.map((entry) => (
              <Card key={entry.id} className="p-5 border-slate-100 hover:border-teal-100 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(entry.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </div>
                </div>
                
                <p className="text-slate-700 text-sm leading-relaxed mb-4">{entry.content}</p>

                {/* AI Processing Area */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 mb-2">
                    <Sparkles className="w-3.5 h-3.5" /> AI Insight
                  </div>
                  {entry.summary ? (
                    <>
                      <p className="text-xs text-slate-600 italic mb-3">"{entry.summary}"</p>
                      {entry.emotionTags && (
                        <div className="flex flex-wrap gap-2">
                          {entry.emotionTags.split(',').map((tag, i) => (
                            <span key={i} className="px-2 py-1 bg-white border border-slate-200 text-slate-600 text-[10px] uppercase font-bold rounded-full">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-slate-400 animate-pulse">Analyzing entry...</p>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </FeatureGate>
  );
}
