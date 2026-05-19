import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Linking, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { createCheckoutSession, createOneTimeCheckout } from '../services/api';

// ─── Replace with your actual Stripe Price IDs ───────────────────────────────
const PRICES = {
  perAnalysis: 'prod_UY0wLBuE0jEPPa',   // $2.99 one-time
  creditPack:  'prod_UY0xUfXcea1cti',    // $14.99 one-time (10 analyses)
  monthly:     'price_1TY8noPwwT0D6amwKPNvzhTO',         // $9.99/mo recurring
  yearly:      'price_1TY8npPwwT0D6amwuwTPZRm4',         // $71.88/yr recurring
};

const C = {
  bg:    '#0b0d12',
  surf:  '#13161e',
  surf2: '#1a1d28',
  gold:  '#c9a84c',
  goldD: '#8b6914',
  green: '#4caf7d',
  red:   '#e05c5c',
  t:     'rgba(255,255,255,0.92)',
  tm:    'rgba(255,255,255,0.55)',
  td:    'rgba(255,255,255,0.28)',
  border:'rgba(255,255,255,0.08)',
};

const FEATURES_PRO = [
  'Unlimited contract analyses',
  'Full clause risk breakdowns',
  'Market benchmarking',
  'Copy-ready negotiation scripts',
  'Key date & deadline alerts',
  'Full analysis history',
  'Priority support',
];

const FEATURES_FREE = [
  '3 free analyses total',
  'Basic risk score',
  'Top 3 risky clauses',
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
      alert('Could not open checkout: ' + e.message);
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
      alert('Could not open checkout: ' + e.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Close */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.close}>
          <Text style={s.closeText}>✕</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={s.hero}>
          <LinearGradient colors={[C.gold, C.goldD]} style={s.heroIcon}>
            <Text style={{ fontSize: 30 }}>⚖️</Text>
          </LinearGradient>
          <Text style={s.heroTitle}>ContractShield Pro</Text>
          <Text style={s.heroSub}>Stop signing contracts you don't understand.</Text>
        </View>

        {/* Tab Switcher */}
        <View style={s.tabRow}>
          <TouchableOpacity
            style={[s.tab, tab === 'plans' && s.tabActive]}
            onPress={() => setTab('plans')}
          >
            <Text style={[s.tabText, tab === 'plans' && s.tabTextActive]}>
              Subscribe
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, tab === 'payg' && s.tabActive]}
            onPress={() => setTab('payg')}
          >
            <Text style={[s.tabText, tab === 'payg' && s.tabTextActive]}>
              Pay As You Go
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── SUBSCRIPTION TAB ─────────────────────────────────── */}
        {tab === 'plans' && (
          <View>
            {/* Plan Toggle */}
            <View style={s.planRow}>
              <TouchableOpacity
                style={[s.planBtn, plan === 'monthly' && s.planBtnActive]}
                onPress={() => setPlan('monthly')}
              >
                <Text style={[s.planBtnText, plan === 'monthly' && s.planBtnTextActive]}>
                  Monthly
                </Text>
                <Text style={[s.planPrice, plan === 'monthly' && s.planPriceActive]}>
                  $9.99/mo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.planBtn, plan === 'yearly' && s.planBtnActive, s.planBtnYearly]}
                onPress={() => setPlan('yearly')}
              >
                <View style={s.bestValueBadge}>
                  <Text style={s.bestValueText}>BEST VALUE</Text>
                </View>
                <Text style={[s.planBtnText, plan === 'yearly' && s.planBtnTextActive]}>
                  Yearly
                </Text>
                <Text style={[s.planPrice, plan === 'yearly' && s.planPriceActive]}>
                  $5.99/mo
                </Text>
                <Text style={s.planSub}>billed $71.88/yr · save 40%</Text>
              </TouchableOpacity>
            </View>

            {/* Features */}
            <View style={s.featureBox}>
              <Text style={s.featureHeader}>Everything in Pro</Text>
              {FEATURES_PRO.map(f => (
                <View key={f} style={s.featureRow}>
                  <Text style={[s.featureIcon, { color: C.green }]}>✓</Text>
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
                  {loading === 'sub' ? 'Opening...' : `Start Pro ${plan === 'yearly' ? 'Yearly' : 'Monthly'}`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={s.legalText}>
              Cancel anytime. Billed via Stripe. No hidden fees.
            </Text>
          </View>
        )}

        {/* ── PAY AS YOU GO TAB ─────────────────────────────────── */}
        {tab === 'payg' && (
          <View>
            <Text style={s.paygDesc}>
              No commitment. Buy exactly what you need. Great for occasional use.
            </Text>

            {/* Single Analysis */}
            <View style={s.paygCard}>
              <View style={s.paygCardLeft}>
                <Text style={s.paygCardTitle}>Single Analysis</Text>
                <Text style={s.paygCardSub}>Full AI review of one contract</Text>
                <View style={s.paygCardFeatures}>
                  <Text style={s.paygFeature}>• Risk score + clause breakdown</Text>
                  <Text style={s.paygFeature}>• Negotiation scripts</Text>
                  <Text style={s.paygFeature}>• Expires never</Text>
                </View>
              </View>
              <View style={s.paygCardRight}>
                <Text style={s.paygPrice}>$2.99</Text>
                <TouchableOpacity
                  style={[s.paygBtn, loading === 'single' && s.ctaDisabled]}
                  onPress={() => handleOneTime('single')}
                  disabled={loading === 'single'}
                >
                  <Text style={s.paygBtnText}>
                    {loading === 'single' ? '...' : 'Buy'}
                  </Text>
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
                  <Text style={s.paygFeature}>• $1.50/analysis (50% off)</Text>
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
                  <Text style={[s.paygBtnText, { color: C.bg }]}>
                    {loading === 'pack' ? '...' : 'Buy'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Upgrade nudge */}
            <TouchableOpacity style={s.upgradeNudge} onPress={() => setTab('plans')}>
              <Text style={s.upgradeNudgeText}>
                💡 Use 4+ analyses/month? Pro saves you money →
              </Text>
            </TouchableOpacity>

            <Text style={s.legalText}>
              One-time charge. Secure checkout via Stripe.
            </Text>
          </View>
        )}

        {/* Free tier reminder */}
        <View style={s.freeBox}>
          <Text style={s.freeTitle}>Free Tier (Current)</Text>
          {FEATURES_FREE.map(f => (
            <View key={f} style={s.featureRow}>
              <Text style={[s.featureIcon, { color: C.td }]}>–</Text>
              <Text style={[s.featureText, { color: C.tm }]}>{f}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: C.bg },
  scroll:            { padding: 20, paddingBottom: 48 },

  close:             { alignSelf: 'flex-end', padding: 8, marginBottom: 4 },
  closeText:         { color: C.tm, fontSize: 18 },

  // Hero
  hero:              { alignItems: 'center', marginBottom: 28 },
  heroIcon:          { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  heroTitle:         { fontSize: 26, fontWeight: '800', color: C.t, letterSpacing: -0.5 },
  heroSub:           { fontSize: 14, color: C.tm, marginTop: 6, textAlign: 'center' },

  // Tab switcher
  tabRow:            { flexDirection: 'row', backgroundColor: C.surf, borderRadius: 12, padding: 4, marginBottom: 24 },
  tab:               { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  tabActive:         { backgroundColor: C.surf2 },
  tabText:           { fontSize: 14, fontWeight: '600', color: C.tm },
  tabTextActive:     { color: C.t },

  // Plan toggle
  planRow:           { flexDirection: 'row', gap: 12, marginBottom: 20 },
  planBtn:           { flex: 1, backgroundColor: C.surf, borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
  planBtnActive:     { borderColor: C.gold, backgroundColor: 'rgba(201,168,76,0.08)' },
  planBtnYearly:     { paddingTop: 24 },
  planBtnText:       { fontSize: 14, fontWeight: '700', color: C.tm },
  planBtnTextActive: { color: C.gold },
  planPrice:         { fontSize: 20, fontWeight: '800', color: C.tm, marginTop: 4 },
  planPriceActive:   { color: C.t },
  planSub:           { fontSize: 10, color: C.td, marginTop: 3 },

  bestValueBadge:    { position: 'absolute', top: -1, alignSelf: 'center', backgroundColor: C.gold, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  bestValueText:     { fontSize: 9, fontWeight: '800', color: C.bg, letterSpacing: 0.8 },

  // Features
  featureBox:        { backgroundColor: C.surf, borderRadius: 14, padding: 18, marginBottom: 20 },
  featureHeader:     { fontSize: 12, fontWeight: '700', color: C.tm, letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  featureRow:        { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  featureIcon:       { fontSize: 14, fontWeight: '800', lineHeight: 20 },
  featureText:       { flex: 1, fontSize: 14, color: C.t, lineHeight: 20 },

  // CTA
  cta:               { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  ctaGrad:           { paddingVertical: 17, alignItems: 'center' },
  ctaText:           { fontSize: 16, fontWeight: '800', color: '#0b0d12', letterSpacing: 0.3 },
  ctaDisabled:       { opacity: 0.5 },

  legalText:         { fontSize: 11, color: C.td, textAlign: 'center', lineHeight: 16 },

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
  paygBtn:           { backgroundColor: C.surf2, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
  paygBtnGold:       { backgroundColor: C.gold, borderColor: C.gold },
  paygBtnText:       { fontSize: 14, fontWeight: '700', color: C.t },

  paygBestBadge:     { position: 'absolute', top: -1, left: 18, backgroundColor: C.green, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  paygBestText:      { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.8 },

  upgradeNudge:      { backgroundColor: 'rgba(76,175,125,0.08)', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(76,175,125,0.2)' },
  upgradeNudgeText:  { fontSize: 13, color: C.green, textAlign: 'center' },

  // Free tier
  freeBox:           { marginTop: 28, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 20 },
  freeTitle:         { fontSize: 12, fontWeight: '700', color: C.td, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
});
