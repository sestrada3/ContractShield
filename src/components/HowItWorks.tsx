'use client';
import { Upload, Zap, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    number: '01',
    icon: Upload,
    color: '#c9a84c',
    title: 'Upload',
    subtitle: 'Any format works',
    description: 'Browse for a PDF, take a photo of a physical contract, choose from your photo library, or just paste the text directly. We handle it all.',
    detail: 'PDF · Photo · Camera · Paste',
  },
  {
    number: '02',
    icon: Zap,
    color: '#4a9eff',
    title: 'Analyze',
    subtitle: 'AI scans every clause',
    description: 'Our AI reads your document clause by clause — scoring risk, translating legalese, benchmarking against market standards, and flagging key dates.',
    detail: '15–30 seconds',
  },
  {
    number: '03',
    icon: MessageSquare,
    color: '#4caf7d',
    title: 'Negotiate',
    subtitle: 'Know exactly what to say',
    description: 'Get word-for-word negotiation scripts for every flagged clause. Copy them straight into your email or walk into the conversation fully prepared.',
    detail: 'Copy-ready scripts',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden" style={{ background: '#0d0f15' }}>
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(201,168,76,1) 0%, transparent 70%)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#c9a84c', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>Simple as 1-2-3</div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Upload. Analyze.
            <span style={{ color: '#c9a84c' }}> Negotiate.</span>
          </h2>
          <p className="text-xl max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>Three steps. Thirty seconds. Complete clarity.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 group-hover:shadow-lg" style={{ background: '#13161e', border: `2px solid rgba(255,255,255,0.07)` }}>
                  <div className="flex flex-col items-center gap-1">
                    <step.icon size={28} style={{ color: step.color }} />
                    <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.28)' }}>{step.number}</span>
                  </div>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm mb-4" style={{ background: step.color, color: '#0b0d12' }}>{i + 1}</div>
              <h3 className="text-2xl font-black text-white mb-1">{step.title}</h3>
              <p className="text-sm font-semibold mb-3" style={{ color: step.color }}>{step.subtitle}</p>
              <p className="text-sm leading-relaxed max-w-xs mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>{step.description}</p>
              <div className="inline-flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5" style={{ color: 'rgba(255,255,255,0.4)', background: '#13161e', border: '1px solid rgba(255,255,255,0.07)' }}>{step.detail}</div>
              {i < steps.length - 1 && (
                <div className="lg:hidden mt-8">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.4 }} className="text-center mt-16">
          <a href="#download" className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-xl text-base" style={{ background: '#c9a84c', color: '#0b0d12' }}>Join the Waitlist — Free, No Credit Card</a>
        </motion.div>
      </div>
    </section>
  );
}
