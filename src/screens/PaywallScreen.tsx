import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { createCheckoutSession, createOneTimeCheckout } from '../services/api';
import { C } from '../theme';

// IMPORTANT: perAnalysis and creditPack must be Stripe PRICE IDs (price_xxx),
// not product IDs (prod_xxx). Get them from your Stripe Dashboard → Products,
// then set EXPO_PUBLIC_STRIPE_PRICE_CREDIT_1 and EXPO_PUBLIC_STRIPE_PRICE_CREDIT_10
// in your .env / EAS secrets to match the STRIPE_PRICE_CREDIT_1/10 server env vars.
const PRICES = {
  perAnalysis: process.env.EXPO_PUBLIC_STRIPE_PRICE_CREDIT_1  || 'price_1TYuudPwwT0D6amwxOSm2OlZ',
  creditPack:  process.env.EXPO_PUBLIC_STRIPE_PRICE_CREDIT_10 || 'price_1TYuvIPwwT0D6amwWjbCGLss',
  monthly:     'price_1TY8noPwwT0D6amwKPNvzhTO',
  yearly:      'price_1TY8npPwwT0D6amwuwTPZRm4',
};

const FEATURES_PRO = [
  'Unlimited contract analyses',
  'Full clause risk breakdowns',
  'Market benchmarking on every clause',
  'Copy-ready negotiation scripts',
  'Key date & deadline tracking',
  'Full analysis history',
  'Priority support',
];

const FEATURES_FREE = [
  '3 free analyses total',
  'Basic risk score',
  'Top 3 risky clauses only',
];

const TESTIMONIALS = [
  {
    quote: 'Found a hidden auto-renewal clause in my lease. Negotiated it out and saved $1,200.',
    name: 'Marcus T.',
    role: 'Renter, Austin TX',
  },
  {
    quote: 'The negotiation scripts are incredible. I used one word-for-word and got my non-compete narrowed.',
    name: 'Priya S.',
    role: 'Software Engineer',
  },
  {
    quote: 'I review freelance contracts weekly. ContractShield Pro pays for itself on the first contract.',
    name: 'Jordan K.',
    role: 'Creative Director',
  },
];

type Tab = 'plans' | 'payg';

export default function PaywallScreen() {
  const navigation   = useNavigation<any>();
  const [tab, setTab]         = useState<Tab>('plans');
  const [plan, setPlan]       = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading('sub');
    try {
      const priceId = plan === 'monthly' ? PRICES.monthly : PRICES.yearly;
      const { url } = await createCheckoutSession(priceId);
      await Linking.openURL(url);
    } catch (e: any) {
      Alert.alert('Checkout Error', 'Could not open checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleOneTime = async (type: 'single' | 'pack') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(type);
    try {
      const priceId = type === 'single' ? PRICES.perAnalysis : PRICES.creditPack;
      const { url } = await createOneTimeCheckout(priceId);
      await Linking.openURL(url);
    } catch (e: any) {
      Alert.alert('Checkout Error', 'Could not open checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Close */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.close}>
          <View style={s.closeCircle}>
            <Ionicons name="close" size={16} color={C.tm}/>
          </View>
        </TouchableOpacity>

        {/* Hero */}
        <View style={s.hero}>
          <LinearGradient
            colors={['rgba(201,168,76,0.18)', 'rgba(201,168,76,0.04)']}
            style={s.heroIconWrap}
          >
            <Ionicons name="shield-checkmark" size={52} color={C.gold}/>
          </LinearGradient>
          <Text style={s.heroTitle}>ContractShield Pro</Text>
          <Text style={s.heroSub}>Know exactly what you're signing — and how to negotiate it.</Text>
        </View>

        {/* Tab Switcher */}
        <View style={s.tabRow}>
          <TouchableOpacity
            style={[s.tab, tab === 'plans' && s.tabActive]}
            onPress={() => setTab('plans')}
          >
            <Text style={[s.tabText, tab === 'plans' && s.tabTextActive]}>Subscribe</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, tab === 'payg' && s.tabActive]}
            onPress={() => setTab('payg')}
          >
            <Text style={[s.tabText, tab === 'payg' && s.tabTextActive]}>Pay As You Go</Text>
          </TouchableOpacity>
        </View>

        {/* ── SUBSCRIPTION TAB ───────────────────────────────── */}
        {tab === 'plans' && (
          <View>
            {/* Plan Toggle */}
            <View style={s.planRow}>
              <TouchableOpacity
                style={[s.planBtn, plan === 'monthly' && s.planBtnActive]}
                onPress={() => setPlan('monthly')}
              >
                <Text style={[s.planBtnText, plan === 'monthly' && s.planBtnTextActive]}>Monthly</Text>
                <Text style={[s.planPrice, plan === 'monthly' && s.planPriceActive]}>$9.99/mo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.planBtn, plan === 'yearly' && s.planBtnActive, s.planBtnYearly]}
                onPress={() => setPlan('yearly')}
              >
                <View style={s.bestValueBadge}>
                  <Text style={s.bestValueText}>BEST VALUE</Text>
                </View>
                <Text style={[s.planBtnText, plan === 'yearly' && s.planBtnTextActive]}>Yearly</Text>
                <Text style={[s.planPrice, plan === 'yearly' && s.planPriceActive]}>$5.99/mo</Text>
                <Text style={s.planSavings}>Save $47.88 vs monthly</Text>
                <Text style={s.planSub}>billed $71.88/yr</Text>
              </TouchableOpacity>
            </View>

            {/* Features */}
            <View style={s.featureBox}>
              <Text style={s.featureHeader}>Everything in Pro</Text>
              {FEATURES_PRO.map(f => (
                <View key={f} style={s.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={C.green}/>
                  <Text style={s.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[s.cta, loading === 'sub' && s.ctaDisabled]}
              onPress={handleSubscribe}
              disabled={loading === 'sub'}
            >
              <LinearGradient colors={[C.gold, C.goldD]} style={s.ctaGrad}>
                <Text style={s.ctaText}>
                  {loading === 'sub'
                    ? 'Opening...'
                    : plan === 'yearly'
                      ? 'Start Pro — $5.99/mo'
                      : 'Start Pro — $9.99/mo'}
                </Text>
                {loading !== 'sub' && (
                  <Text style={s.ctaSub}>Cancel anytime · No hidden fees</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Testimonials */}
            <View style={s.testimonialsWrap}>
              <Text style={s.testimonialsHeader}>What our users say</Text>
              {TESTIMONIALS.map((t, i) => (
                <View key={i} style={s.testimonialCard}>
                  <View style={s.starsRow}>
                    {[...Array(5)].map((_, j) => (
                      <Ionicons key={j} name="star" size={11} color={C.gold}/>
                    ))}
                  </View>
                  <Text style={s.testimonialQuote}>"{t.quote}"</Text>
                  <Text style={s.testimonialName}>{t.name} · {t.role}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── PAY AS YOU GO TAB ─────────────────────────────── */}
        {tab === 'payg' && (
          <View>
            <Text style={s.paygDesc}>
              No commitment. Buy exactly what you need.
            </Text>

            {/* Single Analysis */}
            <View style={s.paygCard}>
              <View style={s.paygCardLeft}>
                <Text style={s.paygCardTitle}>Single Analysis</Text>
                <Text style={s.paygCardSub}>Full AI review of one contract</Text>
                <View style={s.paygCardFeatures}>
                  <Text style={s.paygFeature}>• Risk score + clause breakdown</Text>
                  <Text style={s.paygFeature}>• Negotiation scripts</Text>
                  <Text style={s.paygFeature}>• Credits never expire</Text>
                </View>
              </View>
              <View style={s.paygCardRight}>
                <Text style={s.paygPrice}>$2.99</Text>
                <TouchableOpacity
                  style={[s.paygBtn, loading === 'single' && s.ctaDisabled]}
                  onPress={() => handleOneTime('single')}
                  disabled={loading === 'single'}
                >
                  <Text style={s.paygBtnText}>{loading === 'single' ? '...' : 'Buy'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Credit Pack */}
            <View style={[s.paygCard, s.paygCardHighlight]}>
              <View style={s.paygBestBadge}>
                <Text style={s.paygBestText}>MOST POPULAR</Text>
              </View>
              <View style={s.paygCardLeft}>
                <Text style={s.paygCardTitle}>10-Pack</Text>
                <Text style={s.paygCardSub}>10 analyses, use anytime</Text>
                <View style={s.paygCardFeatures}>
                  <Text style={s.paygFeature}>• $1.50/analysis — 50% off</Text>
                  <Text style={s.paygFeature}>• All Single Analysis features</Text>
                  <Text style={s.paygFeature}>• Credits never expire</Text>
                </View>
              </View>
              <View style={s.paygCardRight}>
                <Text style={s.paygPrice}>$14.99</Text>
                <TouchableOpacity
                  style={[s.paygBtn, s.paygBtnGold, loading === 'pack' && s.ctaDisabled]}
                  onPress={() => handleOneTime('pack')}
                  disabled={loading === 'pack'}
                >
                  <Text style={[s.paygBtnText, { color: C.bg }]}>{loading === 'pack' ? '...' : 'Buy'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Upgrade nudge */}
            <TouchableOpacity style={s.upgradeNudge} onPress={() => setTab('plans')}>
              <Ionicons name="trending-up-outline" size={14} color={C.green}/>
              <Text style={s.upgradeNudgeText}>Use 4+ analyses/month? Pro saves you money →</Text>
            </TouchableOpacity>

            <Text style={s.legalText}>One-time charge. Secure checkout via Stripe.</Text>
          </View>
        )}

        {/* Free tier reminder */}
        <View style={s.freeBox}>
          <Text style={s.freeTitle}>Free Tier (Current)</Text>
          {FEATURES_FREE.map(f => (
            <View key={f} style={s.featureRow}>
              <Ionicons name="remove" size={14} color={C.td}/>
              <Text style={[s.featureText, { color: C.tm }]}>{f}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingBottom: 48 },

  // Close
  close:       { alignSelf: 'flex-end', marginBottom: 4 },
  closeCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.surf, alignItems: 'center', justifyContent: 'center' },

  // Hero
  hero:        { alignItems: 'center', marginBottom: 28 },
  heroIconWrap:{ width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  heroTitle:   { fontSize: 26, fontWeight: '800', color: C.t, letterSpacing: -0.5 },
  heroSub:     { fontSize: 14, color: C.tm, marginTop: 6, textAlign: 'center', lineHeight: 21, maxWidth: 280 },

  // Tabs
  tabRow:          { flexDirection: 'row', backgroundColor: C.surf, borderRadius: 12, padding: 4, marginBottom: 24 },
  tab:             { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  tabActive:       { backgroundColor: C.hi },
  tabText:         { fontSize: 14, fontWeight: '600', color: C.tm },
  tabTextActive:   { color: C.t },

  // Plan toggle
  planRow:           { flexDirection: 'row', gap: 12, marginBottom: 20 },
  planBtn:           { flex: 1, backgroundColor: C.surf, borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
  planBtnActive:     { borderColor: C.gold, backgroundColor: 'rgba(201,168,76,0.08)' },
  planBtnYearly:     { paddingTop: 24 },
  planBtnText:       { fontSize: 14, fontWeight: '700', color: C.tm },
  planBtnTextActive: { color: C.gold },
  planPrice:         { fontSize: 20, fontWeight: '800', color: C.tm, marginTop: 4 },
  planPriceActive:   { color: C.t },
  planSavings:       { fontSize: 11, color: C.green, fontWeight: '700', marginTop: 3 },
  planSub:           { fontSize: 10, color: C.td, marginTop: 2 },

  bestValueBadge: { position: 'absolute', top: -1, alignSelf: 'center', backgroundColor: C.gold, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  bestValueText:  { fontSize: 9, fontWeight: '800', color: C.bg, letterSpacing: 0.8 },

  // Features
  featureBox:    { backgroundColor: C.surf, borderRadius: 14, padding: 18, marginBottom: 20 },
  featureHeader: { fontSize: 12, fontWeight: '700', color: C.tm, letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  featureRow:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  featureText:   { flex: 1, fontSize: 14, color: C.t, lineHeight: 20 },

  // CTA
  cta:       { borderRadius: 14, overflow: 'hidden', marginBottom: 24 },
  ctaGrad:   { paddingVertical: 18, alignItems: 'center', gap: 4 },
  ctaText:   { fontSize: 16, fontWeight: '800', color: '#0b0d12', letterSpacing: 0.3 },
  ctaSub:    { fontSize: 11, color: 'rgba(11,13,18,0.55)', fontWeight: '500' },
  ctaDisabled: { opacity: 0.5 },

  legalText: { fontSize: 11, color: C.td, textAlign: 'center', lineHeight: 16, marginBottom: 8 },

  // Testimonials
  testimonialsWrap:   { marginBottom: 8 },
  testimonialsHeader: { fontSize: 11, color: C.td, letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'center', marginBottom: 14 },
  testimonialCard:    { backgroundColor: C.surf, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  starsRow:           { flexDirection: 'row', gap: 2, marginBottom: 8 },
  testimonialQuote:   { fontSize: 13, color: C.t, lineHeight: 20, marginBottom: 8, fontStyle: 'italic' },
  testimonialName:    { fontSize: 11, color: C.td, fontWeight: '600' },

  // Pay As You Go
  paygDesc:          { fontSize: 13, color: C.tm, lineHeight: 20, marginBottom: 20 },
  paygCard:          { backgroundColor: C.surf, borderRadius: 14, padding: 18, marginBottom: 14, borderWidth: 1.5, borderColor: C.border, flexDirection: 'row' },
  paygCardHighlight: { borderColor: 'rgba(201,168,76,0.35)', backgroundColor: 'rgba(201,168,76,0.05)' },
  paygCardLeft:      { flex: 1 },
  paygCardRight:     { alignItems: 'flex-end', justifyContent: 'space-between', paddingLeft: 12 },
  paygCardTitle:     { fontSize: 16, fontWeight: '800', color: C.t, marginBottom: 3 },
  paygCardSub:       { fontSize: 12, color: C.tm, marginBottom: 10 },
  paygCardFeatures:  { gap: 4 },
  paygFeature:       { fontSize: 12, color: C.tm },
  paygPrice:         { fontSize: 22, fontWeight: '800', color: C.t },
  paygBtn:           { backgroundColor: C.hi, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
  paygBtnGold:       { backgroundColor: C.gold, borderColor: C.gold },
  paygBtnText:       { fontSize: 14, fontWeight: '700', color: C.t },
  paygBestBadge:     { position: 'absolute', top: -1, left: 18, backgroundColor: C.green, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  paygBestText:      { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.8 },

  upgradeNudge:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(76,175,125,0.08)', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(76,175,125,0.2)' },
  upgradeNudgeText: { fontSize: 13, color: C.green, flex: 1 },

  // Free tier
  freeBox:   { marginTop: 28, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 20 },
  freeTitle: { fontSize: 12, fontWeight: '700', color: C.td, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
});
