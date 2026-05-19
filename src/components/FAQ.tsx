'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    q: 'Is ContractShield a law firm or a lawyer?',
    a: 'No. ContractShield is an AI-powered analysis tool that provides informational summaries of contract language. It is not legal advice and does not create an attorney-client relationship. For significant legal matters, consult a licensed attorney.',
  },
  {
    q: 'What types of documents can I analyze?',
    a: 'Any text-based legal document: employment offers, NDAs, leases, freelance contracts, service agreements, and more. You can upload a PDF, take a photo of a physical document, pick from your photo library, or paste the text directly.',
  },
  {
    q: 'Is my contract stored after analysis?',
    a: 'No. Your document is processed in-memory and immediately discarded after analysis. Personally identifiable information is automatically stripped before it reaches our AI. Only your analysis results (risk score and clause breakdown) are saved to your account history.',
  },
  {
    q: 'How does the 0–10 risk score work?',
    a: 'The score reflects the overall fairness of the contract from your perspective as the signing party — 10 is maximally fair to you, 0 is extremely one-sided against you. Each clause is individually scored and the overall score is a weighted aggregate. We also provide market context, like "Most employment contracts score 5–7."',
  },
  {
    q: 'What happens after my 7-day free trial?',
    a: 'If you don\'t cancel before the trial ends, your chosen plan (monthly or yearly) begins automatically. You can cancel anytime from the app — no hoops, no forms. There\'s no charge at all during the trial period.',
  },
  {
    q: 'Can I use ContractShield before my company\'s lawyers review the contract?',
    a: 'Absolutely — that\'s exactly the use case. Running ContractShield first means you walk into a lawyer consultation (or negotiation) already knowing which clauses to focus on, which saves you time and legal fees.',
  },
  {
    q: 'What AI model powers the analysis?',
    a: 'ContractShield uses Claude by Anthropic — one of the most accurate large language models available, specifically known for careful reasoning on complex documents. All processing happens over encrypted connections.',
  },
];

function FAQItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer"
      style={{ background: open ? '#13161e' : 'rgba(19,22,30,0.6)', border: `1px solid ${open ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.07)'}` }}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between px-6 py-5 gap-4">
        <span className="text-sm font-semibold text-white leading-snug">{q}</span>
        <ChevronDown
          size={18}
          style={{ color: '#c9a84c', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }}
        />
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 relative overflow-hidden" style={{ background: '#0b0d12' }}>
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,1) 0%, transparent 60%)' }} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#c9a84c', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>FAQ</div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Common questions,
            <br />
            <span style={{ color: '#c9a84c' }}>straight answers.</span>
          </h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }} className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              q={faq.q}
              a={faq.a}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
