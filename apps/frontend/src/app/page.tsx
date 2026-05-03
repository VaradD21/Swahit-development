'use client';

import Link from 'next/link';
import Image from 'next/image';
import logo from '@/images/logo.png';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MessageCircle, 
  Smile, 
  TrendingUp, 
  Calendar, 
  ShieldCheck, 
  ClipboardList,
  Lock,
  Zap,
  UserCheck,
  Clock,
  ArrowRight,
  PhoneCall
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#fafafa] selection:bg-teal-100 selection:text-teal-900">
      <main className="flex-1">
        {/* 1. HERO SECTION */}
        <section className="relative pt-24 pb-32 px-6 lg:px-12 text-center overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-full max-w-5xl h-full opacity-30 blur-[120px] bg-gradient-to-tr from-teal-200 to-emerald-100 rounded-full"></div>
          
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Where healing meets <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">
                empowerment <span className="inline-block transform hover:rotate-12 transition-transform duration-300">🌿</span>
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
              Swahit helps you understand your emotions, connect with support, and take control of your mental well-being — anytime, anywhere.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Link href="/login">
                <Button size="lg" className="h-14 px-8 text-lg font-semibold bg-teal-600 hover:bg-teal-700 shadow-xl shadow-teal-600/20 group text-white rounded-full">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold bg-white border-teal-200 text-teal-800 hover:bg-teal-50 rounded-full">
                  <MessageCircle className="mr-2 w-5 h-5" />
                  Talk to Swahit
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 2. ABOUT SWAHIT */}
        <section id="about" className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
            <h2 className="text-sm font-bold tracking-widest text-teal-600 uppercase">About Us</h2>
            <p className="text-2xl md:text-3xl font-medium text-slate-700 leading-relaxed">
              Swahit is a mental wellness platform designed to support individuals in managing emotions, stress, and overall mental health through mood tracking, guided conversations, and safe support tools.
            </p>
          </div>
        </section>

        {/* 3. FEATURES SECTION */}
        <section id="features" className="py-24 bg-[#fafafa] border-y border-teal-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">Everything you need to thrive</h2>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto">Tools designed with care to support your mental wellness journey.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Mood Tracking', desc: 'Log your feelings daily to visualize patterns and understand your emotional rhythms.', icon: Smile, color: 'text-blue-600', bg: 'bg-blue-100' },
                { title: 'Talk to Swahit', desc: 'An empathetic AI companion ready to listen, reflect, and guide you 24/7 without judgment.', icon: MessageCircle, color: 'text-teal-600', bg: 'bg-teal-100' },
                { title: 'Mood Insights', desc: 'Discover triggers and positive habits with deep analytics generated from your check-ins.', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-100' },
                { title: 'Book Appointment', desc: 'Seamlessly schedule private sessions with certified therapists when you need human support.', icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-100' },
                { title: 'Premium Support', desc: 'Access exclusive wellness plans, priority booking, and advanced therapeutic resources.', icon: ShieldCheck, color: 'text-rose-600', bg: 'bg-rose-100' },
                { title: 'Questionnaire', desc: 'Take clinically-backed assessments to evaluate your stress, anxiety, and wellness levels.', icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-100' },
              ].map((feature, i) => (
                <Card key={i} className="border-teal-100/50 shadow-sm hover:shadow-md hover:border-teal-200 transition-all bg-white group">
                  <CardContent className="p-8">
                    <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                    <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 4. WHY SWAHIT */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Why choose Swahit?</h2>
              <p className="text-lg text-slate-500">We prioritize your safety and comfort above all else, ensuring a seamless experience tailored just for you.</p>
              
              <div className="space-y-8 pt-4">
                {[
                  { title: 'Safe & Private', desc: 'Bank-level encryption ensures your data and conversations stay strictly confidential.', icon: Lock },
                  { title: 'Easy to Use', desc: 'A clean, intuitive interface that feels calming, not overwhelming.', icon: Zap },
                  { title: 'Personalized Experience', desc: 'Insights and plans that adapt uniquely to your emotional journey.', icon: UserCheck },
                  { title: 'Always Available', desc: 'Support is just a tap away, day or night, 365 days a year.', icon: Clock },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-teal-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-800">{item.title}</h4>
                      <p className="text-slate-500 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-teal-100 rounded-[2.5rem] transform translate-x-4 translate-y-4 -z-10"></div>
              <div className="bg-[#fafafa] border border-teal-100 rounded-[2.5rem] p-12 aspect-square flex flex-col justify-center items-center text-center shadow-lg">
                <div className="relative inline-block">
                  <Image src={logo} alt="Swahit Logo" width={96} height={96} className="mb-6 opacity-80 object-contain" />
                  <div className="absolute -top-2 -right-2 bg-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">BETA</div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Trust the process</h3>
                <p className="text-slate-500">Over 10,000+ users have found their safe space with Swahit.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. HOW IT WORKS */}
        <section id="how-it-works" className="py-24 bg-[#fafafa] border-t border-teal-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-16">Your path to wellness</h2>
            
            <div className="grid md:grid-cols-4 gap-8 relative">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-teal-100 -translate-y-1/2 z-0"></div>
              {[
                { step: '1', title: 'Log in', desc: 'And tell us how you feel today.' },
                { step: '2', title: 'Track mood', desc: 'Daily check-ins to build awareness.' },
                { step: '3', title: 'Get insights', desc: 'And personalized suggestions.' },
                { step: '4', title: 'Reach out', desc: 'When you need professional help.' },
              ].map((item, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center group">
                  <div className="w-16 h-16 rounded-full bg-white border-4 border-teal-100 text-teal-600 flex items-center justify-center text-2xl font-bold shadow-sm mb-6 group-hover:border-teal-400 group-hover:bg-teal-50 transition-colors">
                    {item.step}
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-2">{item.title}</h4>
                  <p className="text-slate-500 px-4">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. SUPPORT SECTION */}
        <section id="support" className="py-24 bg-teal-900 text-white text-center px-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="mb-8">
              <Image src={logo} alt="Swahit Logo" width={48} height={48} className="mx-auto opacity-80 object-contain" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">You are not alone. Help is always available.</h2>
            <p className="text-teal-100 text-lg max-w-2xl mx-auto">
              If you are in immediate distress, please reach out to a professional immediately.
            </p>
            <div className="bg-teal-800/50 border border-teal-700 rounded-2xl p-6 mt-8 inline-block backdrop-blur-sm">
              <p className="text-teal-200 text-sm font-medium uppercase tracking-wider mb-2">National Support Helpline</p>
              <div className="flex items-center justify-center gap-3 text-3xl font-bold text-white">
                <PhoneCall className="w-8 h-8" />
                <span>1-800-273-8255</span>
              </div>
            </div>
          </div>
        </section>

        {/* 7. FINAL CTA */}
        <section className="py-24 bg-white text-center px-6">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Start your journey toward better mental health today.
            </h2>
            <Link href="/login" className="inline-block">
              <Button size="lg" className="h-14 px-10 text-lg font-semibold bg-teal-600 hover:bg-teal-700 shadow-xl shadow-teal-600/20 text-white rounded-full">
                Get Started Now
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-12 bg-[#fafafa] border-t border-teal-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 mb-4">
            <Image src={logo} alt="Swahit Logo" width={32} height={32} className="object-contain" />
            <span className="text-xl font-bold text-teal-900 tracking-tight">Swahit</span>
          </div>
          <p className="text-slate-400 text-sm">
            © 2026 Swahit Therapy. All rights reserved.
          </p>
          <div className="flex gap-6 text-slate-400 text-sm">
            <Link href="#" className="hover:text-teal-600">Privacy Policy</Link>
            <Link href="#" className="hover:text-teal-600">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
