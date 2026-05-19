'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Lock, ShieldCheck, EyeOff } from 'lucide-react';
import Image from 'next/image';

function ScoreRing() {
  const [score, setScore] = useState(0);
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
    const target = 3.2;
    const duration = 1600;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + increment, target);
      setScore(parseFloat(current.toFixed(1)));
      if (current >= target) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started]);

  const radius = 68;
  const circ = 2 * Math.PI * radius;
  const pct = score / 10;
  // Low score = red (risky contract)
  const color = score >= 7 ? '#4caf7d' : score >= 4 ? '#e0993a' : '#e05252';
  const label = score >= 8 ? 'Very Fair' : score >= 6 ? 'Moderate' : score >= 4 ? 'Concerning' : 'Risky';
  const offset = circ * (1 - pct);

  return (
    <div ref={ref} className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: 160, height: 160 }}>
        <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
          <circle
            cx="80" cy="80" r={radius}
            fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.05s linear, stroke 0.3s' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black tabular-nums leading-none" style={{ color }}>{score.toFixed(1)}</span>
          <span className="text-xs font-bold tracking-widest uppercase mt-1" style={{ color: 'rgba(255,255,255,0.28)' }}>{label}</span>
        </div>
      </div>
      <div className="text-xs italic" style={{ color: 'rgba(255,255,255,0.28)' }}>Most employment contracts score 5–7</div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(201,168,76,0.07) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(74,158,255,0.05) 0%, transparent 50%)' }} />
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: copy */}
          <div className="flex flex-col gap-8">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-gold-500 text-xs font-bold tracking-widest uppercase w-fit" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}>
              <span className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-pulse" />
              AI Legal Document Review
            </div>

            <div className="flex flex-col gap-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
                Know what you&apos;re
                <br />
                <span className="text-gold-500">actually</span>
                <br />
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>signing.</span>
              </h1>
              <p className="text-xl leading-relaxed max-w-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Upload any contract, NDA, lease, or job offer and get instant plain-English analysis with word-for-word negotiation scripts — in 15–30 seconds.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <a href="#download" className="group flex items-center gap-2 font-bold px-7 py-4 rounded-xl transition-all duration-200 shadow-xl text-base" style={{ background: '#c9a84c', color: '#0b0d12' }}>
                Join Waitlist
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#pricing" className="flex items-center gap-2 font-semibold px-7 py-4 rounded-xl transition-all duration-200 text-base" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.88)' }}>
                View Pricing
              </a>
            </div>

            {/* Security trust bar */}
            <div className="flex flex-wrap gap-3">
              {[
                { Icon: Lock, text: 'Encrypted transit' },
                { Icon: EyeOff, text: 'PII auto-stripped' },
                { Icon: ShieldCheck, text: 'Never stored' },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-2" style={{ color: '#4a9eff', background: 'rgba(74,158,255,0.06)', border: '1px solid rgba(74,158,255,0.15)' }}>
                  <Icon size={12} />{text}
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <svg key={s} className="w-4 h-4" fill="#c9a84c" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                ))}
              </div>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                <span className="text-white font-semibold">⭐ 4.9</span> · Trusted by <span className="text-white font-semibold">12,000+</span> users
              </span>
            </div>
          </div>

          {/* Right: live score card */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl blur-xl" style={{ background: 'rgba(201,168,76,0.07)' }} />
              <div className="relative rounded-2xl p-8 shadow-2xl w-full max-w-sm" style={{ background: 'rgba(23,27,38,0.9)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>Analysis Result</p>
                    <p className="text-sm font-semibold text-white">employment-offer.pdf</p>
                  </div>
                  <div className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(224,82,82,0.12)', border: '1px solid rgba(224,82,82,0.3)', color: '#e05252' }}>Risky</div>
                </div>

                <ScoreRing />

                {/* Clause breakdown */}
                <div className="mt-5 space-y-2" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
                  {[
                    { label: 'Non-Compete', risk: 'high', text: 'Overly broad — 2yr, nationwide' },
                    { label: 'IP Assignment', risk: 'high', text: 'All work including personal projects' },
                    { label: 'At-Will Clause', risk: 'medium', text: 'Standard but no severance' },
                    { label: 'PTO Policy', risk: 'low', text: '20 days — above market average' },
                  ].map(({ label, risk, text }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: risk === 'high' ? '#e05252' : risk === 'medium' ? '#e0993a' : '#4caf7d' }} />
                      <span className="text-xs w-24 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                      <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>{text}</span>
                    </div>
                  ))}
                </div>

                {/* What to say */}
                <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)' }}>
                  <p className="text-xs font-bold tracking-widest uppercase mb-1.5" style={{ color: '#c9a84c' }}>WHAT TO SAY</p>
                  <p className="text-xs italic leading-relaxed" style={{ color: '#d4b86a' }}>&ldquo;I&apos;d like to limit the non-compete to 6 months and my direct role only.&rdquo;</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
