'use client';
import { Check, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const plans = [
  {
    name: 'Free', price: '$0', period: 'forever',
    tagline: 'Perfect for individuals and small teams getting started.',
    cta: 'Get Started Free', ctaStyle: 'border', popular: false,
    features: ['3 contract analyses per month', 'Basic risk score (0–100)', 'Plain English summary', 'Red flag highlights', 'PDF & DOCX support', 'Email support'],
    missing: ['Negotiation suggestions', 'Side-by-side comparison', 'Team collaboration', 'Audit trail', 'API access'],
  },
  {
    name: 'Pro', price: '$49', period: 'per month',
    tagline: 'Everything you need to protect your business at scale.',
    cta: 'Start 14-Day Free Trial', ctaStyle: 'solid', popular: true,
    features: ['Unlimited contract analyses', 'Full AI risk analysis', 'AI negotiation suggestions', 'Side-by-side version comparison', 'Team collaboration (unlimited seats)', 'Full audit trail & compliance logs', 'API access', 'Priority support (< 4h response)', 'Custom risk templates', 'Slack & email notifications'],
    missing: [],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-navy-950 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 100%, rgba(245,158,11,1) 0%, transparent 60%)' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-full px-4 py-1.5 text-gold-400 text-sm font-medium mb-4">Simple, Transparent Pricing</div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Choose Your<span className="text-gold-500"> Protection Level</span></h2>
          <p className="text-xl text-slate-400 max-w-xl mx-auto">Start free. Upgrade when you need more. No hidden fees, no surprise charges.</p>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-2xl p-8 flex flex-col ${plan.popular ? 'bg-gradient-to-b from-navy-800 to-navy-900 border-2 border-gold-500 shadow-2xl shadow-gold-500/10' : 'bg-card-gradient border border-navy-700'}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 bg-gold-500 text-navy-950 text-xs font-black px-4 py-1.5 rounded-full shadow-lg">
                    <Zap size={12} fill="currentColor" />Most Popular
                  </div>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-white font-bold text-xl mb-1">{plan.name}</h3>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-5xl font-black text-white">{plan.price}</span>
                  <span className="text-slate-400 text-sm pb-2">/ {plan.period}</span>
                </div>
                <p className="text-slate-400 text-sm">{plan.tagline}</p>
              </div>
              <a href="#" className={`w-full text-center font-bold py-3.5 rounded-xl transition-all duration-200 text-sm mb-8 ${plan.ctaStyle === 'solid' ? 'bg-gold-500 hover:bg-gold-400 text-navy-950 shadow-lg' : 'border border-navy-600 hover:border-navy-500 text-white hover:bg-navy-800'}`}>{plan.cta}</a>
              <div className="flex flex-col gap-3 flex-1">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-gold-500/10 border border-gold-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><Check size={11} className="text-gold-500" strokeWidth={3} /></div>
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </div>
                ))}
                {plan.missing.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 opacity-40">
                    <div className="w-5 h-5 bg-navy-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-slate-500 text-xs">—</span></div>
                    <span className="text-slate-500 text-sm line-through">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }} className="mt-10 text-center">
          <p className="text-slate-400 text-sm">Need enterprise features? Custom contracts, SSO, SAML, dedicated support.{' '}<a href="#" className="text-gold-400 hover:text-gold-300 font-semibold underline underline-offset-2 transition-colors">Contact Sales →</a></p>
        </motion.div>
      </div>
    </section>
  );
}
