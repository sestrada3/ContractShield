'use client';
import { BarChart3, AlertTriangle, BookOpen, GitCompare, MessageSquare, Users, ScrollText } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { icon: BarChart3, title: 'AI Risk Scoring', description: 'Instant 0–100 risk scores for every contract clause. Know exactly what you\'re signing before pen hits paper.', highlight: 'Scores in < 30s' },
  { icon: AlertTriangle, title: 'Red Flag Detection', description: 'Automatically surfaces dangerous terms, hidden penalties, unlimited liability clauses, and one-sided conditions.', highlight: '200+ risk patterns' },
  { icon: BookOpen, title: 'Plain English Summaries', description: 'Complex legal jargon translated into clear, actionable language your whole team can understand — no law degree needed.', highlight: 'Instant translation' },
  { icon: GitCompare, title: 'Side-by-Side Comparison', description: 'Compare contract versions or benchmark against industry-standard templates to spot unfavorable deviations.', highlight: 'Version tracking' },
  { icon: MessageSquare, title: 'Negotiation Suggestions', description: 'AI-generated counter-proposals and redline suggestions for every flagged clause. Walk into negotiations prepared.', highlight: 'AI-generated redlines' },
  { icon: Users, title: 'Team Collaboration', description: 'Share contracts, assign reviewers, leave comments, and track approval status — all in one secure workspace.', highlight: 'Unlimited seats on Pro' },
  { icon: ScrollText, title: 'Audit Trail', description: 'Full immutable history of every review, approval, comment, and change for compliance and accountability.', highlight: 'SOC 2 compliant logs' },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-navy-950 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent to-gold-500/30" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-full px-4 py-1.5 text-gold-400 text-sm font-medium mb-4">Everything You Need</div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Contract Intelligence,<br /><span className="text-gold-500">Built for Business</span></h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">From risk detection to negotiation support — ContractShield covers every stage of the contract lifecycle.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.slice(0, 6).map((feature, i) => (
            <motion.div key={feature.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }} whileHover={{ y: -4 }} className="group relative bg-card-gradient border border-navy-700 hover:border-gold-500/40 rounded-2xl p-6 transition-all duration-300 cursor-default">
              <div className="absolute inset-0 rounded-2xl group-hover:bg-gold-500/5 transition-all duration-300" />
              <div className="relative">
                <div className="w-12 h-12 bg-gold-500/10 border border-gold-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gold-500/20 transition-colors">
                  <feature.icon size={22} className="text-gold-500" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">{feature.description}</p>
                <div className="inline-flex items-center gap-1.5 text-gold-500 text-xs font-semibold bg-gold-500/10 rounded-lg px-3 py-1.5">
                  <span className="w-1.5 h-1.5 bg-gold-500 rounded-full" />{feature.highlight}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.5 }} className="mt-6 group relative bg-gradient-to-r from-navy-800 to-navy-900 border border-navy-700 hover:border-gold-500/40 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 transition-all duration-300">
          <div className="w-12 h-12 bg-gold-500/10 border border-gold-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <ScrollText size={22} className="text-gold-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-1">{features[6].title}</h3>
            <p className="text-slate-400 text-sm">{features[6].description}</p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-gold-500 text-xs font-semibold bg-gold-500/10 rounded-lg px-3 py-1.5 flex-shrink-0">
            <span className="w-1.5 h-1.5 bg-gold-500 rounded-full" />{features[6].highlight}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
