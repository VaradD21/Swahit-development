"use client";

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Flame, Target } from 'lucide-react';

type Habit = {
  id: string;
  title: string;
  category: string;
  currentStreak: number;
  longestStreak: number;
  logs: any[];
};

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const data = await fetchApi('/habits');
      setHabits(data);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleHabit = async (habitId: string, currentlyCompleted: boolean) => {
    const newStatus = currentlyCompleted ? 'missed' : 'completed';
    // Optimistic update
    setHabits(habits.map(h => {
      if (h.id === habitId) {
        const hasToday = h.logs.some(l => l.date === todayStr);
        const newLogs = hasToday 
          ? h.logs.map(l => l.date === todayStr ? { ...l, status: newStatus } : l)
          : [{ date: todayStr, status: newStatus }, ...h.logs];
        return { ...h, logs: newLogs, currentStreak: newStatus === 'completed' ? h.currentStreak + 1 : 0 };
      }
      return h;
    }));

    try {
      await fetchApi(`/habits/${habitId}/log`, {
        method: 'POST',
        body: JSON.stringify({ date: todayStr, status: newStatus }),
      });
      // Reload strictly to fix streaks
      await loadHabits();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col max-w-4xl mx-auto w-full p-4 lg:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Habits & Goals</h1>
            <p className="text-slate-500">Build consistency and track your wellness streaks.</p>
          </div>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-md">
          + New Habit
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {habits.length === 0 ? (
          <Card className="p-8 text-center border-dashed text-slate-500">
            No habits created yet. Click "New Habit" to start building your routine!
          </Card>
        ) : (
          habits.map((habit) => {
            const completedToday = habit.logs.some(l => l.date === todayStr && l.status === 'completed');

            return (
              <Card key={habit.id} className="p-5 border-slate-100 flex items-center justify-between hover:border-orange-200 transition-all">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleHabit(habit.id, completedToday)}
                    className="transition-transform active:scale-95"
                  >
                    {completedToday ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    ) : (
                      <Circle className="w-8 h-8 text-slate-300 hover:text-emerald-400" />
                    )}
                  </button>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{habit.title}</h3>
                    <p className="text-xs text-slate-500 capitalize">{habit.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-orange-500 font-bold text-lg">
                      <Flame className="w-5 h-5 fill-orange-500" />
                      {habit.currentStreak}
                    </div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400">Current Streak</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-600 font-bold text-lg">
                      {habit.longestStreak}
                    </div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400">Longest Streak</p>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
