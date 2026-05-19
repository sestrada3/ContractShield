'use client';
import { Upload, Zap, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  { number: '01', icon: Upload, title: 'Upload', subtitle: 'Drop your document', description: 'Upload a PDF, Word doc, or paste text directly. We support all major contract formats including NDA, SaaS, employment, and service agreements.', detail: 'PDF · DOCX · TXT · Paste' },
  { number: '02', icon: Zap, title: 'Analyze', subtitle: 'AI scans every clause', description: 'Our AI reads and scores every clause in under 30 seconds — identifying risks, flagging unusual terms, and comparing against standard market practices.', detail: '< 30 seconds' },
  { number: '03', icon: CheckCircle, title: 'Act', subtitle: 'Negotiate with confidence', description: 'Review the risk report, accept AI-suggested redlines, share with your team, and sign knowing exactly what you agreed to.', detail: 'Negotiate · Approve · Sign' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-navy-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(245,158,11,1) 0%, transparent 70%)' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-full px-4 py-1.5 text-gold-400 text-sm font-medium mb-4">Simple as 1-2-3</div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">From Upload to<span className="text-gold-500"> Clarity</span></h2>
          <p className="text-xl text-slate-400 max-w-xl mx-auto">Get a complete contract risk analysis in under a minute.</p>
        </motion.div>
        <div className="relative">
          <div className="hidden lg:block absolute top-16 left-0 right-0 h-px">
            <div className="max-w-3xl mx-auto relative h-px">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, i) => (
              <motion.div key={step.number} initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.15 }} className="flex flex-col items-center text-center group">
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-full bg-navy-800 border-2 border-navy-700 group-hover:border-gold-500/50 flex items-center justify-center transition-all duration-300">
                    <div className="flex flex-col items-center gap-1">
                      <step.icon size={28} className="text-gold-500" />
                      <span className="text-xs font-bold text-slate-500">{step.number}</span>
                    </div>
                  </div>
                </div>
                <div className="w-8 h-8 bg-gold-500 text-navy-950 rounded-full flex items-center justify-center font-black text-sm mb-4">{i + 1}</div>
                <h3 className="text-2xl font-black text-white mb-1">{step.title}</h3>
                <p className="text-gold-400 text-sm font-semibold mb-3">{step.subtitle}</p>
                <p className="text-slate-400 leading-relaxed text-sm max-w-xs mb-4">{step.description}</p>
                <div className="inline-flex items-center gap-1.5 text-slate-500 text-xs bg-navy-800 border border-navy-700 rounded-lg px-3 py-1.5">{step.detail}</div>
                {i < steps.length - 1 && (
                  <div className="lg:hidden mt-8">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.4 }} className="text-center mt-16">
          <a href="#pricing" className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-xl text-base">Try it Free — No Credit Card Required</a>
        </motion.div>
      </div>
    </section>
  );
}
