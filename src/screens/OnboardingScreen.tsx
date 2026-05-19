import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';

const { width: W } = Dimensions.get('window');

const C = {
  bg: '#0d0f15', surf: '#171b26', hi: '#1e2333',
  gold: '#c9a84c', green: '#4caf7d', blue: '#4a9eff',
  t: 'rgba(255,255,255,0.92)', tm: 'rgba(255,255,255,0.55)', td: 'rgba(255,255,255,0.28)',
};

const SLIDES = [
  {
    icon:    'shield-checkmark' as const,
    iconColor: C.gold,
    iconBg:  'rgba(201,168,76,0.12)',
    tag:     'WHY IT MATTERS',
    title:   'Know What You\'re\nActually Signing.',
    body:    'Most people sign contracts without fully understanding them. ContractShield reads every clause so you don\'t have to.',
    detail: [
      { icon: 'checkmark-circle-outline' as const, text: 'Spot hidden fees & auto-renewals' },
      { icon: 'checkmark-circle-outline' as const, text: 'Catch non-compete traps before you sign' },
      { icon: 'checkmark-circle-outline' as const, text: 'Understand your rights in plain English' },
    ],
  },
  {
    icon:    'document-text' as const,
    iconColor: C.blue,
    iconBg:  'rgba(74,158,255,0.12)',
    tag:     'HOW IT WORKS',
    title:   'Upload. Analyze.\nNegotiate.',
    body:    'Three steps. Thirty seconds. Complete clarity.',
    detail: [
      { icon: 'cloud-upload-outline' as const,    text: 'PDF, photo, or paste — any format' },
      { icon: 'flash-outline' as const,           text: 'AI scores every clause in seconds' },
      { icon: 'chatbubble-ellipses-outline' as const, text: 'Word-for-word negotiation scripts' },
    ],
  },
  {
    icon:    'lock-closed' as const,
    iconColor: C.green,
    iconBg:  'rgba(76,175,125,0.12)',
    tag:     'YOUR PRIVACY',
    title:   'Analyzed.\nNever Stored.',
    body:    'Your contract is processed and immediately discarded. Only your results are saved — nothing else.',
    detail: [
      { icon: 'shield-outline' as const,    text: 'Encrypted in transit' },
      { icon: 'eye-off-outline' as const,   text: 'PII automatically stripped' },
      { icon: 'people-outline' as const,    text: 'Trusted by 12,000+ users · ⭐ 4.9' },
    ],
  },
];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollX   = useRef(new Animated.Value(0)).current;
  const [idx, setIdx] = useState(0);

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * W, animated: true });
    setIdx(i);
  };

  const finish = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try { await SecureStore.setItemAsync('onboarding_done', '1'); } catch {}
    onDone();
  };

  const handleNext = () => {
    Haptics.selectionAsync();
    if (idx < SLIDES.length - 1) goTo(idx + 1);
    else finish();
  };

  const handleSkip = () => {
    finish();
  };

  const slide = SLIDES[idx];

  return (
    <SafeAreaView style={s.safe}>
      {/* Skip */}
      <TouchableOpacity style={s.skip} onPress={handleSkip}>
        <Text style={s.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <Animated.ScrollView
        ref={scrollRef as any}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={e => setIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
        style={{ flex: 1 }}
      >
        {SLIDES.map((sl, i) => (
          <View key={i} style={s.slide}>
            {/* Icon hero */}
            <View style={[s.iconWrap, { backgroundColor: sl.iconBg }]}>
              <Ionicons name={sl.icon} size={72} color={sl.iconColor}/>
            </View>

            {/* Tag */}
            <Text style={[s.tag, { color: sl.iconColor }]}>{sl.tag}</Text>

            {/* Title */}
            <Text style={s.title}>{sl.title}</Text>

            {/* Body */}
            <Text style={s.body}>{sl.body}</Text>

            {/* Detail list */}
            <View style={s.detailList}>
              {sl.detail.map((d, j) => (
                <View key={j} style={s.detailRow}>
                  <View style={[s.detailIconWrap, { backgroundColor: sl.iconBg }]}>
                    <Ionicons name={d.icon} size={16} color={sl.iconColor}/>
                  </View>
                  <Text style={s.detailText}>{d.text}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </Animated.ScrollView>

      {/* Bottom bar */}
      <View style={s.bottom}>
        {/* Dots */}
        <View style={s.dots}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * W, i * W, (i + 1) * W];
            const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 22, 8], extrapolate: 'clamp' });
            const opacity  = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
            return (
              <Animated.View
                key={i}
                style={[s.dot, { width: dotWidth, opacity, backgroundColor: slide.iconColor }]}
              />
            );
          })}
        </View>

        {/* CTA button */}
        <TouchableOpacity
          style={[s.btn, { backgroundColor: slide.iconColor }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={s.btnText}>
            {idx < SLIDES.length - 1 ? 'Next →' : 'Get Started →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.bg },
  skip:          { alignSelf: 'flex-end', padding: 20, paddingBottom: 4 },
  skipText:      { fontSize: 14, color: C.td },
  slide:         { width: W, flex: 1, paddingHorizontal: 32, paddingTop: 12, alignItems: 'center' },
  iconWrap:      { width: 140, height: 140, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  tag:           { fontSize: 10, fontWeight: '700', letterSpacing: 2.5, marginBottom: 12 },
  title:         { fontSize: 30, fontWeight: '800', color: C.t, textAlign: 'center', lineHeight: 38, marginBottom: 14 },
  body:          { fontSize: 14, color: C.tm, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  detailList:    { width: '100%', gap: 10 },
  detailRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailIconWrap:{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  detailText:    { fontSize: 14, color: C.t, flex: 1, lineHeight: 20 },
  bottom:        { paddingHorizontal: 28, paddingBottom: 12, gap: 20 },
  dots:          { flexDirection: 'row', justifyContent: 'center', gap: 6, alignItems: 'center' },
  dot:           { height: 8, borderRadius: 4 },
  btn:           { borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  btnText:       { fontSize: 16, fontWeight: '700', color: '#0b0d12', letterSpacing: 0.3 },
});
