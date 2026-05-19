'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Play, Shield, Lock, CheckCircle } from 'lucide-react';

function RiskScoreGauge() {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const target = 87;
    const step = 2000 / target;
    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      setCount(current);
      if (current >= target) clearInterval(timer);
    }, step);
    return () => clearInterval(timer);
  }, [started]);

  const degree = (count / 100) * 360;
  const color = count < 40 ? '#22C55E' : count < 70 ? '#F59E0B' : '#EF4444';

  return (
    <div ref={ref} className="flex flex-col items-center gap-4">
      <div className="relative w-44 h-44">
        <div className="absolute inset-0 rounded-full blur-md opacity-40" style={{ background: color }} />
        <div className="absolute inset-0 rounded-full bg-navy-800" />
        <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${color} ${degree}deg, #1E293B ${degree}deg)` }} />
        <div className="absolute inset-2 rounded-full bg-navy-900 flex flex-col items-center justify-center">
          <span className="text-4xl font-black tabular-nums" style={{ color }}>{count}</span>
          <span className="text-xs text-slate-400 font-medium tracking-widest uppercase mt-0.5">Risk Score</span>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold" style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />
        {count < 40 ? 'Low Risk' : count < 70 ? 'Medium Risk' : 'High Risk'}
      </div>
      <div className="w-full max-w-xs bg-navy-800/60 rounded-xl p-4 border border-navy-700 space-y-2">
        {[
          { label: 'Liability Cap', status: 'danger', text: 'Uncapped liability detected' },
          { label: 'Auto-Renewal', status: 'warning', text: '30-day cancellation window' },
          { label: 'IP Assignment', status: 'danger', text: 'Broad IP transfer clause' },
          { label: 'Payment Terms', status: 'safe', text: 'Standard NET-30' },
        ].map(({ label, status, text }) => (
          <div key={label} className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: status === 'danger' ? '#EF4444' : status === 'warning' ? '#F59E0B' : '#22C55E' }} />
            <span className="text-xs text-slate-400 w-20 flex-shrink-0">{label}</span>
            <span className="text-xs text-slate-300 truncate">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(245,158,11,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.06) 0%, transparent 50%)' }} />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(248,250,252,1) 1px, transparent 1px), linear-gradient(90deg, rgba(248,250,252,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-8">
            <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 rounded-full px-4 py-1.5 text-gold-400 text-sm font-medium w-fit">
              <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse" />
              AI-Powered Contract Intelligence
            </div>
            <div className="flex flex-col gap-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
                Stop Signing<br />
                <span className="text-gold-500">Contracts</span><br />
                <span className="text-slate-300">Blind</span>
              </h1>
              <p className="text-xl text-slate-400 leading-relaxed max-w-lg">AI-powered risk analysis that reads the fine print, flags red flags, and scores every clause — in seconds. Protect your business before you sign.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <a href="#pricing" className="group flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold px-7 py-4 rounded-xl transition-all duration-200 shadow-xl text-base">
                Analyze a Contract Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <button className="flex items-center gap-2.5 text-white border border-navy-700 hover:border-navy-600 bg-navy-800/50 hover:bg-navy-800 font-semibold px-7 py-4 rounded-xl transition-all duration-200 text-base">
                <div className="w-8 h-8 bg-gold-500/20 rounded-full flex items-center justify-center">
                  <Play size={12} className="text-gold-400 ml-0.5" fill="currentColor" />
                </div>
                Watch Demo
              </button>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              {[{ icon: Shield, text: 'SOC 2 Certified' }, { icon: Lock, text: '256-bit Encryption' }, { icon: CheckCircle, text: 'GDPR Compliant' }].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-slate-400 text-xs font-medium bg-navy-800/40 border border-navy-700/50 rounded-lg px-3 py-2">
                  <Icon size={13} className="text-gold-500" />{text}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2">
                {['#4F46E5','#0EA5E9','#10B981','#F59E0B'].map((color, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-navy-900 flex items-center justify-center text-xs font-bold" style={{ background: color }}>{String.fromCharCode(65+i)}</div>
                ))}
              </div>
              <div className="text-sm"><span className="text-white font-semibold">2,400+</span><span className="text-slate-400"> businesses protected</span></div>
              <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <svg key={s} className="w-4 h-4 text-gold-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>)}</div>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-gold-500/10 to-transparent rounded-3xl blur-xl" />
              <div className="relative bg-navy-800/80 backdrop-blur border border-navy-700 rounded-2xl p-8 shadow-2xl w-full max-w-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest">Analysis Result</p>
                    <p className="text-sm font-semibold text-white mt-0.5">SaaS Agreement v2.3.pdf</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold px-2.5 py-1 rounded-full">Action Required</div>
                </div>
                <RiskScoreGauge />
                <button className="mt-6 w-full bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold py-3 rounded-xl transition-colors text-sm">View Full Report →</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
