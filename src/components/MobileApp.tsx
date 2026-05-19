'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';

function AppStoreBadge() {
  return (
    <a href="#" className="flex items-center gap-3 rounded-xl px-5 py-3 transition-all duration-200" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)' }}>
      <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
      <div><p className="leading-tight" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Download on the</p><p className="text-white font-semibold text-sm leading-tight">App Store</p></div>
    </a>
  );
}

function PlayStoreBadge() {
  return (
    <a href="#" className="flex items-center gap-3 rounded-xl px-5 py-3 transition-all duration-200" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)' }}>
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
        <path d="M3 3.5L13.5 12 3 20.5V3.5Z" fill="#34A853"/>
        <path d="M3 3.5L13.5 12l3.5-3.5L5.5 2 3 3.5Z" fill="#4285F4"/>
        <path d="M3 20.5l10.5-8.5 3.5 3.5L5.5 22 3 20.5Z" fill="#EA4335"/>
        <path d="M13.5 12l7-4-3.5-3.5L13.5 12ZM13.5 12l3.5 3.5L20.5 12l-7-4Z" fill="#FBBC05"/>
      </svg>
      <div><p className="leading-tight" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Get it on</p><p className="text-white font-semibold text-sm leading-tight">Google Play</p></div>
    </a>
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
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase w-fit" style={{ color: '#c9a84c', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>Available Now</div>
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
            <div className="flex flex-wrap gap-4 pt-2">
              <AppStoreBadge />
              <PlayStoreBadge />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
