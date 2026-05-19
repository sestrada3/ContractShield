'use client';
import { BarChart3, BookOpen, MessageSquare, Calendar, ShieldCheck, EyeOff, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: BarChart3,
    color: '#c9a84c',
    title: 'Risk Score (0–10)',
    description: 'Every contract gets a fairness score from 0–10 with context like "Most NDAs score 4–6" so you know exactly where yours stands.',
    highlight: 'Instant scoring',
  },
  {
    icon: BookOpen,
    color: '#4a9eff',
    title: 'Plain English Breakdown',
    description: 'Every clause translated from legalese into clear language you actually understand — no law degree required.',
    highlight: 'Every clause',
  },
  {
    icon: MessageSquare,
    color: '#c9a84c',
    title: 'Copy-Ready Negotiation Scripts',
    description: 'Word-for-word scripts for every flagged clause. Copy and paste directly into your negotiation email or call.',
    highlight: 'One-tap copy',
  },
  {
    icon: Search,
    color: '#4a9eff',
    title: 'Market Benchmarking',
    description: 'Each clause is benchmarked against real-world standards — Aggressive, Unusual, Standard, or Favorable — so you know what to push back on.',
    highlight: 'Industry standards',
  },
  {
    icon: Calendar,
    color: '#4caf7d',
    title: 'Key Date & Deadline Alerts',
    description: 'Auto-renewal dates, cancellation windows, notice periods — all surfaced so you never miss a critical deadline.',
    highlight: 'Never miss a date',
  },
  {
    icon: ShieldCheck,
    color: '#4caf7d',
    title: 'Privacy-First Analysis',
    description: 'Your contract is analyzed and immediately discarded. PII is automatically stripped before processing. Only your results are saved.',
    highlight: 'Never stored',
  },
  {
    icon: EyeOff,
    color: '#e05252',
    title: 'Hidden Clause Detection',
    description: 'Catches non-compete traps, auto-renewal tricks, hidden fees, broad IP transfers, and one-sided liability clauses you might have missed.',
    highlight: 'Nothing slips through',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 relative overflow-hidden" style={{ background: '#0b0d12' }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24" style={{ background: 'linear-gradient(to bottom, transparent, rgba(201,168,76,0.3))' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#c9a84c', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>Everything You Need</div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Not just a summary.
            <br />
            <span style={{ color: '#c9a84c' }}>A full legal briefing.</span>
          </h2>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>
            ContractShield goes clause by clause — scoring, explaining, benchmarking, and arming you with exactly what to say.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.slice(0, 6).map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="group relative rounded-2xl p-6 transition-all duration-300 cursor-default"
              style={{ background: 'linear-gradient(135deg, #13161e 0%, #0d0f15 100%)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors" style={{ background: `${feature.color}15`, border: `1px solid ${feature.color}30` }}>
                <feature.icon size={22} style={{ color: feature.color }} />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>{feature.description}</p>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5" style={{ color: feature.color, background: `${feature.color}12` }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: feature.color }} />
                {feature.highlight}
              </div>
            </motion.div>
          ))}
        </div>

        {/* 7th feature full width */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-5 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6"
          style={{ background: 'linear-gradient(to right, #13161e, #0d0f15)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(224,82,82,0.12)', border: '1px solid rgba(224,82,82,0.25)' }}>
            <EyeOff size={22} style={{ color: '#e05252' }} />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-1">{features[6].title}</h3>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{features[6].description}</p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 flex-shrink-0" style={{ color: '#e05252', background: 'rgba(224,82,82,0.1)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red" />{features[6].highlight}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
