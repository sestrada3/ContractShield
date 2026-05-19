'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitted'>('idle');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('submitted');
  }

  if (status === 'submitted') {
    return (
      <div className="flex items-center gap-3 rounded-xl px-5 py-4" style={{ background: 'rgba(76,175,125,0.08)', border: '1px solid rgba(76,175,125,0.3)' }}>
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#4caf7d" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        <p className="text-sm font-semibold" style={{ color: '#4caf7d' }}>You&apos;re on the list! We&apos;ll email you the day it&apos;s live.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
        style={{ background: '#13161e', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)' }}
      />
      <button
        type="submit"
        className="font-bold px-5 py-3 rounded-xl text-sm transition-all duration-200 whitespace-nowrap"
        style={{ background: '#c9a84c', color: '#0b0d12' }}
      >
        Notify Me
      </button>
    </form>
  );
}

const reviews = [
  { text: '"Caught a non-compete clause that would have cost me my next job."', author: 'Michael T., Software Engineer' },
  { text: '"Saved me $4,000 in hidden HOA fees before I signed the lease."', author: 'Priya R., First-time Homebuyer' },
  { text: '"Like having a lawyer friend on call. Worth every penny."', author: 'James L., Freelance Consultant' },
];

export default function MobileApp() {
  return (
    <section id="download" className="py-24 relative overflow-hidden" style={{ background: '#0d0f15' }}>
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(ellipse at 0% 50%, rgba(201,168,76,1) 0%, transparent 50%)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Reviews row */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase mb-6" style={{ color: '#c9a84c', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>What Users Say</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
            {reviews.map(({ text, author }) => (
              <div key={author} className="rounded-2xl p-6" style={{ background: '#13161e', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-sm italic leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.75)' }}>{text}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>— {author}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Phone mockup */}
          <motion.div initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="flex justify-center lg:justify-start order-2 lg:order-1">
            <div className="relative w-64 h-[480px] mx-auto">
              <div className="absolute inset-0 rounded-[3rem] shadow-2xl overflow-hidden" style={{ background: 'linear-gradient(to bottom, #171b26, #0d0f15)', border: '4px solid #1e2333' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 rounded-b-2xl z-10" style={{ background: '#0b0d12' }} />
                <div className="absolute inset-0 m-0.5 rounded-[2.8rem] overflow-hidden" style={{ background: '#0b0d12' }}>
                  <div className="pt-8 px-4 pb-4 h-full flex flex-col gap-3">
                    <div className="flex items-center justify-between mt-2">
                      <Image src="https://raw.githubusercontent.com/sestrada3/ContractShield/master/assets/logo%20SMALL.png" alt="ContractShield" width={20} height={20} className="object-contain" unoptimized />
                      <span className="text-white text-xs font-bold">ContractShield</span>
                    </div>
                    <div className="rounded-2xl p-3" style={{ background: '#171b26', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <p className="uppercase tracking-widest mb-1" style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)' }}>Analysis Result</p>
                      <p className="font-semibold mb-2 truncate" style={{ fontSize: 10, color: 'rgba(255,255,255,0.92)' }}>employment-offer.pdf</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#1e2333' }}>
                          <div className="w-[32%] h-full rounded-full" style={{ background: '#e05252' }} />
                        </div>
                        <span className="font-black" style={{ fontSize: 10, color: '#e05252' }}>3.2</span>
                      </div>
                    </div>
                    {[{ label: 'Non-Compete', color: '#e05252' }, { label: 'IP Assignment', color: '#e05252' }, { label: 'At-Will Clause', color: '#e0993a' }].map(({ label, color }) => (
                      <div key={label} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                        <span className="font-medium flex-1" style={{ fontSize: 9, color: 'rgba(255,255,255,0.88)' }}>{label}</span>
                      </div>
                    ))}
                    <div className="rounded-xl p-2.5" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
                      <p className="uppercase tracking-widest mb-1" style={{ fontSize: 7, color: '#c9a84c' }}>WHAT TO SAY</p>
                      <p className="italic leading-tight" style={{ fontSize: 8, color: '#d4b86a' }}>&ldquo;Limit non-compete to 6 months and my direct role only.&rdquo;</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-4 rounded-full blur-2xl" style={{ background: 'rgba(201,168,76,0.04)' }} />
            </div>
          </motion.div>

          {/* Copy */}
          <motion.div initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="flex flex-col gap-6 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase w-fit" style={{ color: '#c9a84c', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#c9a84c' }} />
              Coming Soon
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
              Review Contracts
              <br />
              <span style={{ color: '#c9a84c' }}>on the Go</span>
            </h2>
            <p className="text-xl leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              ContractShield is a mobile app for iOS and Android. Analyze any contract from your phone — before you sign anything, anywhere.
            </p>
            <div className="flex flex-col gap-3">
              {[
                'Scan a physical contract with your camera',
                'Get results in 15–30 seconds',
                'Copy negotiation scripts straight to your clipboard',
                'Your documents are never stored',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)' }}>
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#c9a84c" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{item}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.28)' }}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#c9a84c' }} />
                  Coming Soon — Join the Waitlist
                </span>
              </p>
              <WaitlistForm />
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>iOS &amp; Android · Free to download · No spam, ever</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
