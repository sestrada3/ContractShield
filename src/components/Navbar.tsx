'use client';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-navy-950/95 backdrop-blur-md border-b border-navy-800 shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-slate-300 hover:text-white text-sm font-medium transition-colors">{link.label}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-4">
            <a href="#pricing" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">Sign In</a>
            <a href="#pricing" className="bg-gold-500 hover:bg-gold-400 text-navy-950 font-semibold text-sm px-5 py-2.5 rounded-lg transition-all duration-200 shadow-lg">Start Free</a>
          </div>
          <button className="md:hidden text-slate-300 hover:text-white p-1" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden bg-navy-900/98 backdrop-blur-md border-b border-navy-800">
          <div className="px-4 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white font-medium transition-colors py-1">{link.label}</a>
            ))}
            <a href="#pricing" onClick={() => setIsOpen(false)} className="bg-gold-500 hover:bg-gold-400 text-navy-950 font-semibold text-center px-5 py-3 rounded-lg transition-colors mt-2">Start Free</a>
          </div>
        </div>
      )}
    </nav>
  );
}
