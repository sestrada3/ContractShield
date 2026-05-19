'use client';
import { Check, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    tagline: 'Try ContractShield risk-free.',
    cta: 'Download Free',
    ctaStyle: 'border',
    popular: false,
    features: [
      '3 contract analyses per month',
      'Risk score (0–10)',
      'Plain English clause breakdown',
      'Basic red flag detection',
      'PDF, photo & paste support',
    ],
    missing: [
      'Unlimited analyses',
      'Full clause breakdowns',
      'Copy-ready negotiation scripts',
      'Market benchmarking',
      'Key date & deadline alerts',
      'Analysis history',
      'Priority support',
    ],
  },
  {
    name: 'Pro',
    monthlyPrice: '$9.99',
    yearlyPrice: '$5.99',
    yearlyBilled: '$71.88/yr',
    period: 'per month',
    tagline: 'Everything you need to negotiate confidently.',
    cta: 'Start Free 7-Day Trial',
    ctaStyle: 'solid',
    popular: true,
    features: [
      'Unlimited contract analyses',
      'Full clause breakdowns',
      'Market benchmarking',
      'Copy-ready negotiation scripts',
      'Key date & deadline alerts',
      'Analysis history',
      'Priority support',
    ],
    missing: [],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden" style={{ background: '#0b0d12' }}>
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 100%, rgba(201,168,76,1) 0%, transparent 60%)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#c9a84c', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>Simple Pricing</div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Start free.
            <span style={{ color: '#c9a84c' }}> Upgrade anytime.</span>
          </h2>
          <p className="text-xl max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>No hidden fees. Cancel anytime. Billed via Stripe.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">

          {/* Free */}
          <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="relative rounded-2xl p-8 flex flex-col"
            style={{ background: 'linear-gradient(135deg, #13161e 0%, #0d0f15 100%)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="mb-6">
              <h3 className="text-white font-bold text-xl mb-1">Free</h3>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-black text-white">$0</span>
                <span className="text-sm pb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>/ forever</span>
              </div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Try ContractShield risk-free.</p>
            </div>
            <a href="#download" className="w-full text-center font-bold py-3.5 rounded-xl transition-all duration-200 text-sm mb-8" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.88)' }}>Download Free</a>
            <div className="flex flex-col gap-3 flex-1">
              {plans[0].features.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)' }}><Check size={11} style={{ color: '#c9a84c' }} strokeWidth={3} /></div>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{feature}</span>
                </div>
              ))}
              {plans[0].missing.map((feature) => (
                <div key={feature} className="flex items-start gap-3 opacity-30">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#1e2333' }}><span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>—</span></div>
                  <span className="text-sm line-through" style={{ color: 'rgba(255,255,255,0.4)' }}>{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Pro */}
          <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
            className="relative rounded-2xl p-8 flex flex-col"
            style={{ background: 'linear-gradient(to bottom, #171b26, #0d0f15)', border: '2px solid #c9a84c', boxShadow: '0 0 40px rgba(201,168,76,0.08)' }}
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1.5 text-xs font-black px-4 py-1.5 rounded-full shadow-lg" style={{ background: '#c9a84c', color: '#0b0d12' }}>
                <Zap size={12} fill="currentColor" />Most Popular
              </div>
            </div>

            {/* Plan toggle */}
            <div className="mb-4">
              <h3 className="text-white font-bold text-xl mb-3">Pro</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: 'Monthly', price: '$9.99/mo', sub: '' },
                  { label: 'Yearly', price: '$5.99/mo', sub: 'Billed $71.88/yr · Save 40%' },
                ].map(({ label, price, sub }) => (
                  <div key={label} className="rounded-xl p-3 text-center" style={{ background: label === 'Yearly' ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.04)', border: label === 'Yearly' ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.08)' }}>
                    {label === 'Yearly' && <div className="text-[9px] font-black tracking-wider mb-1 px-1.5 py-0.5 rounded inline-block" style={{ background: '#4caf7d', color: '#0b0d12' }}>SAVE 40%</div>}
                    <p className="text-xs mb-1" style={{ color: label === 'Yearly' ? '#c9a84c' : 'rgba(255,255,255,0.4)' }}>{label}</p>
                    <p className="text-lg font-black" style={{ color: label === 'Yearly' ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.55)' }}>{price}</p>
                    {sub && <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub}</p>}
                  </div>
                ))}
              </div>
            </div>

            <a href="#download" className="w-full text-center font-bold py-3.5 rounded-xl transition-all duration-200 text-sm mb-2" style={{ background: '#c9a84c', color: '#0b0d12' }}>Start Free 7-Day Trial →</a>
            <p className="text-center text-xs mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>No charge today · Cancel anytime before trial ends</p>

            <div className="flex flex-col gap-3 flex-1">
              {plans[1].features.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)' }}><Check size={11} style={{ color: '#c9a84c' }} strokeWidth={3} /></div>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }} className="mt-8 text-center">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Billed via Stripe · Not legal advice · Cancel anytime</p>
        </motion.div>
      </div>
    </section>
  );
}
