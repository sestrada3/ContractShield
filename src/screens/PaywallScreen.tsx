import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, AppState, AppStateStatus } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { createCheckoutSession, getUsage } from '../services/api';
import { useStore } from '../services/store';

const C = {
  bg:'#0b0d12', surf:'#13161e',
  gold:'#c9a84c', green:'#4caf7d',
  t:'rgba(255,255,255,0.88)', tm:'rgba(255,255,255,0.5)', td:'rgba(255,255,255,0.28)',
};

const PRICE_MONTHLY = 'price_1TY8noPwwT0D6amwKPNvzhTO';
const PRICE_YEARLY  = 'price_1TY8npPwwT0D6amwuwTPZRm4';

const FEATURES = [
  '✦ Unlimited contract analyses',
  '✦ Full clause breakdowns',
  '✦ Market benchmarking',
  '✦ Copy-ready negotiation scripts',
  '✦ Key date & deadline alerts',
  '✦ Analysis history',
  '✦ Priority support',
];

const REVIEWS = [
  { text: '"Caught a non-compete clause that would have cost me my next job."', author: 'Michael T., Software Engineer' },
  { text: '"Saved me $4,000 in hidden HOA fees before I signed the lease."', author: 'Priya R., First-time Homebuyer' },
  { text: '"Like having a lawyer friend on call. Worth every penny."', author: 'James L., Freelance Consultant' },
];

export default function PaywallScreen() {
  const navigation = useNavigation<any>();
  const { setIsPro, setUsage } = useStore();
  const [loading, setLoading]   = React.useState(false);
  const [plan, setPlan]         = React.useState<'monthly'|'yearly'>('yearly');
  const [reviewIdx, setReviewIdx] = React.useState(0);
  const awaitingPayment = React.useRef(false);

  // Rotate reviews every 4s
  React.useEffect(() => {
    const t = setInterval(() => setReviewIdx(i => (i + 1) % REVIEWS.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Detect app returning to foreground after checkout
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', async (state: AppStateStatus) => {
      if (state === 'active' && awaitingPayment.current) {
        awaitingPayment.current = false;
        try {
          const usage = await getUsage();
          setIsPro(usage.isPro);
          setUsage(usage.used, usage.limit);
          if (usage.isPro) {
            Alert.alert('Welcome to Pro! 🎉', 'Your subscription is now active.', [
              { text: 'Get started', onPress: () => navigation.goBack() },
            ]);
          }
        } catch {}
      }
    });
    return () => sub.remove();
  }, []);

  const subscribe = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const priceId = plan === 'monthly' ? PRICE_MONTHLY : PRICE_YEARLY;
      const { url } = await createCheckoutSession(priceId);
      awaitingPayment.current = true;
      await WebBrowser.openBrowserAsync(url, { dismissButtonStyle: 'done' });
      if (awaitingPayment.current) {
        awaitingPayment.current = false;
        const usage = await getUsage();
        setIsPro(usage.isPro);
        setUsage(usage.used, usage.limit);
        if (usage.isPro) {
          Alert.alert('Welcome to Pro! 🎉', 'Your subscription is now active.', [
            { text: 'Get started', onPress: () => navigation.goBack() },
          ]);
        }
      }
    } catch(e: any) {
      awaitingPayment.current = false;
      Alert.alert('Checkout error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const review = REVIEWS[reviewIdx];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.closeBtn}>
          <Text style={s.closeBtnText}>✕</Text>
        </TouchableOpacity>

        <View style={s.hero}>
          <Image source={require('../../assets/logo.png')} style={s.heroIcon} resizeMode="contain"/>
          <Text style={s.heroTitle}>ContractShield Pro</Text>
          <Text style={s.heroSub}>Stop signing contracts you don't understand. Know your rights before you sign.</Text>
        </View>

        {/* Social proof */}
        <View style={s.socialProof}>
          <Text style={s.socialStat}>⭐ 4.9 · Trusted by 12,000+ users</Text>
        </View>

        {/* Rotating review */}
        <View style={s.reviewBox}>
          <Text style={s.reviewText}>{review.text}</Text>
          <Text style={s.reviewAuthor}>— {review.author}</Text>
          <View style={s.reviewDots}>
            {REVIEWS.map((_, i) => (
              <View key={i} style={[s.dot, i === reviewIdx && s.dotActive]}/>
            ))}
          </View>
        </View>

        {/* Features */}
        <View style={s.featuresBox}>
          {FEATURES.map(f => (
            <View key={f} style={s.featureRow}>
              <Text style={s.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Plan toggle */}
        <View style={s.planRow}>
          <TouchableOpacity
            style={[s.planBtn, plan === 'monthly' && s.planBtnActive]}
            onPress={() => setPlan('monthly')}>
            <Text style={[s.planLabel, plan === 'monthly' && s.planLabelActive]}>Monthly</Text>
            <Text style={[s.planPrice, plan === 'monthly' && s.planPriceActive]}>$9.99/mo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.planBtn, plan === 'yearly' && s.planBtnActive]}
            onPress={() => setPlan('yearly')}>
            <View style={s.saveBadge}><Text style={s.saveBadgeText}>SAVE 40%</Text></View>
            <Text style={[s.planLabel, plan === 'yearly' && s.planLabelActive]}>Yearly</Text>
            <Text style={[s.planPrice, plan === 'yearly' && s.planPriceActive]}>$5.99/mo</Text>
            <Text style={[s.planSub, plan === 'yearly' && { color: C.td }]}>Billed $71.88/yr</Text>
          </TouchableOpacity>
        </View>

        {/* CTA */}
        <TouchableOpacity style={[s.cta, loading && { opacity: 0.6 }]} onPress={subscribe} disabled={loading}>
          <Text style={s.ctaText}>{loading ? 'Opening…' : 'Start Free 7-Day Trial →'}</Text>
        </TouchableOpacity>

        <Text style={s.trialNote}>No charge today · Cancel anytime before trial ends</Text>
        <Text style={s.fine}>Billed via Stripe · No hidden fees · Not legal advice</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: C.bg },
  scroll:         { padding: 24, paddingBottom: 48 },
  closeBtn:       { alignSelf: 'flex-end', padding: 4 },
  closeBtnText:   { fontSize: 18, color: C.td },
  hero:           { alignItems: 'center', marginBottom: 20 },
  heroIcon:       { width: 80, height: 80, marginBottom: 16 },
  heroTitle:      { fontSize: 28, fontWeight: '800', color: C.t, marginBottom: 8 },
  heroSub:        { fontSize: 14, color: C.tm, textAlign: 'center', lineHeight: 22, maxWidth: 320 },
  socialProof:    { alignItems: 'center', marginBottom: 16 },
  socialStat:     { fontSize: 13, color: C.gold, fontWeight: '600' },
  reviewBox:      { backgroundColor: C.surf, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', minHeight: 100 },
  reviewText:     { fontSize: 13, color: C.t, fontStyle: 'italic', lineHeight: 20, marginBottom: 8 },
  reviewAuthor:   { fontSize: 11, color: C.td },
  reviewDots:     { flexDirection: 'row', gap: 4, marginTop: 10 },
  dot:            { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)' },
  dotActive:      { backgroundColor: C.gold },
  featuresBox:    { backgroundColor: C.surf, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  featureRow:     { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  featureText:    { fontSize: 14, color: C.t, lineHeight: 20 },
  planRow:        { flexDirection: 'row', gap: 10, marginBottom: 20 },
  planBtn:        { flex: 1, backgroundColor: C.surf, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.07)', position: 'relative' },
  planBtnActive:  { borderColor: C.gold, backgroundColor: 'rgba(201,168,76,0.08)' },
  planLabel:      { fontSize: 12, color: C.td, marginBottom: 4 },
  planLabelActive:{ color: C.gold },
  planPrice:      { fontSize: 20, fontWeight: '800', color: C.tm },
  planPriceActive:{ color: C.t },
  planSub:        { fontSize: 10, color: 'transparent', marginTop: 2 },
  saveBadge:      { position: 'absolute', top: -10, backgroundColor: C.green, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  saveBadgeText:  { fontSize: 9, fontWeight: '700', color: '#0b0d12', letterSpacing: 0.8 },
  cta:            { backgroundColor: C.gold, borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 10 },
  ctaText:        { fontSize: 16, fontWeight: '700', color: '#0b0d12', letterSpacing: 0.3 },
  trialNote:      { textAlign: 'center', fontSize: 12, color: C.tm, marginBottom: 6 },
  fine:           { textAlign: 'center', fontSize: 10, color: C.td, lineHeight: 16 },
});
