'use client';
import { motion } from 'framer-motion';
import { Bell, FileText, Shield } from 'lucide-react';

function AppStoreBadge() {
  return (
    <a href="#" className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-xl px-5 py-3 transition-all duration-200">
      <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
      <div><p className="text-white/50 text-[10px] leading-tight">Download on the</p><p className="text-white font-semibold text-sm leading-tight">App Store</p></div>
    </a>
  );
}

function PlayStoreBadge() {
  return (
    <a href="#" className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-xl px-5 py-3 transition-all duration-200">
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
        <path d="M3 3.5L13.5 12 3 20.5V3.5Z" fill="#34A853"/>
        <path d="M3 3.5L13.5 12l3.5-3.5L5.5 2 3 3.5Z" fill="#4285F4"/>
        <path d="M3 20.5l10.5-8.5 3.5 3.5L5.5 22 3 20.5Z" fill="#EA4335"/>
        <path d="M13.5 12l7-4-3.5-3.5L13.5 12ZM13.5 12l3.5 3.5L20.5 12l-7-4Z" fill="#FBBC05"/>
      </svg>
      <div><p className="text-white/50 text-[10px] leading-tight">Get it on</p><p className="text-white font-semibold text-sm leading-tight">Google Play</p></div>
    </a>
  );
}

function PhoneMockup() {
  return (
    <div className="relative w-64 h-[480px] mx-auto">
      <div className="absolute inset-0 bg-gradient-to-b from-navy-700 to-navy-900 rounded-[3rem] border-4 border-navy-600 shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-navy-950 rounded-b-2xl z-10" />
        <div className="absolute inset-0 bg-navy-950 m-0.5 rounded-[2.8rem] overflow-hidden">
          <div className="pt-8 px-4 pb-4 h-full flex flex-col gap-3">
            <div className="flex items-center justify-between mt-2">
              <span className="text-white text-xs font-bold">ContractShield</span>
              <Shield size={14} className="text-gold-500" />
            </div>
            <div className="bg-navy-800 rounded-2xl p-3 border border-navy-700">
              <p className="text-slate-500 text-[9px] uppercase tracking-widest mb-1">Latest Analysis</p>
              <p className="text-white text-[10px] font-semibold mb-2 truncate">vendor-agreement.pdf</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-navy-700 rounded-full overflow-hidden"><div className="w-[87%] h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full" /></div>
                <span className="text-red-400 text-[10px] font-black">87</span>
              </div>
            </div>
            {[{ label: 'Uncapped Liability', color: '#EF4444' }, { label: 'Auto-Renewal Trap', color: '#F59E0B' }, { label: 'IP Rights Transfer', color: '#EF4444' }].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2 bg-navy-800/60 rounded-xl px-3 py-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-white text-[9px] font-medium flex-1">{label}</span>
                <Bell size={8} style={{ color }} />
              </div>
            ))}
            <div className="flex-1 bg-navy-800/40 rounded-xl p-2.5 border border-navy-700/50">
              <p className="text-slate-500 text-[8px] uppercase tracking-widest mb-2">Recent Contracts</p>
              {['NDA - Acme Corp', 'SaaS MSA v3', 'Employment Agreement'].map((doc) => (
                <div key={doc} className="flex items-center gap-1.5 py-1.5">
                  <FileText size={9} className="text-gold-500 flex-shrink-0" />
                  <span className="text-slate-400 text-[9px] truncate">{doc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -inset-4 bg-gold-500/5 rounded-full blur-2xl" />
    </div>
  );
}

export default function MobileApp() {
  return (
    <section className="py-24 bg-navy-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(ellipse at 0% 50%, rgba(245,158,11,1) 0%, transparent 50%)' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="flex justify-center lg:justify-start order-2 lg:order-1">
            <PhoneMockup />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="flex flex-col gap-6 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-full px-4 py-1.5 text-gold-400 text-sm font-medium w-fit">Mobile App</div>
            <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">Review Contracts<br /><span className="text-gold-500">Anywhere</span></h2>
            <p className="text-xl text-slate-400 leading-relaxed">Never get caught off-guard again. Review, analyze, and approve contracts on the go with the ContractShield mobile app — available for iOS and Android.</p>
            <div className="flex flex-col gap-3">
              {['Instant push notifications for high-risk clauses', 'Biometric-secured contract vault', 'Offline analysis for sensitive documents', 'One-tap negotiation suggestions'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-gold-500/10 border border-gold-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-slate-300 text-sm">{item}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 pt-2">
              <AppStoreBadge />
              <PlayStoreBadge />
            </div>
            <p className="text-slate-500 text-xs">* Mobile app coming Q3 2024. Join the waitlist to get early access.</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
