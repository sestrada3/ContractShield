import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Share, Animated
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useStore, Clause, KeyDate } from '../services/store';
import { C } from '../theme';
const RISK  = { high:{c:C.red,bg:'rgba(224,82,82,0.11)',l:'HIGH RISK'}, medium:{c:C.amber,bg:'rgba(224,153,58,0.11)',l:'CAUTION'}, low:{c:C.green,bg:'rgba(76,175,125,0.10)',l:'FAVORABLE'} };
const BENCH = { aggressive:{c:C.red,i:'⚠',l:'Aggressive'}, unusual:{c:C.amber,i:'◈',l:'Unusual'}, standard:{c:C.tm,i:'◇',l:'Standard'}, favorable:{c:C.green,i:'✦',l:'Favorable'} };
const riskOf  = (r: string) => RISK[r as keyof typeof RISK]  || RISK.medium;
const benchOf = (b: string) => BENCH[b as keyof typeof BENCH] || BENCH.standard;
const urgCol  = (u: string) => ({high:C.red,medium:C.amber,low:C.green})[u as keyof object] || C.tm;

const SCORE_CONTEXT: Record<string, string> = {
  'employment':      'Most employment contracts score 5–7',
  'nda':             'Most NDAs score 4–6',
  'lease':           'Most leases score 4–7',
  'rental':          'Most rentals score 4–7',
  'hoa':             'Most HOA agreements score 3–6',
  'freelance':       'Most freelance contracts score 5–8',
  'service':         'Most service agreements score 5–7',
};
const scoreContext = (type: string, score: number) => {
  const key = Object.keys(SCORE_CONTEXT).find(k => type.toLowerCase().includes(k));
  if (key) return SCORE_CONTEXT[key];
  return score >= 7 ? 'This contract is above average' : score >= 4 ? 'This contract is typical' : 'This contract has unusual terms';
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function ScoreRing({ score, type }: { score: number; type: string }) {
  const s    = Math.max(0, Math.min(10, score));
  const r    = 68;
  const circ = 2 * Math.PI * r;
  const col  = s >= 7 ? C.green : s >= 4 ? C.amber : C.red;
  const lbl  = s >= 8 ? 'Very Fair' : s >= 6 ? 'Moderate' : s >= 4 ? 'Concerning' : 'Risky';

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 1400,
      useNativeDriver: false,
    }).start();
  }, []);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circ, circ * (1 - s / 10)],
  });

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: 160, height: 160 }}>
        <Svg width="160" height="160" style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
          <AnimatedCircle
            cx="80" cy="80" r={r}
            fill="none" stroke={col} strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 44, fontWeight: '800', color: col, lineHeight: 50 }}>{s}</Text>
          <Text style={{ fontSize: 10, color: C.td, letterSpacing: 1.2, textTransform: 'uppercase' }}>{lbl}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 11, color: C.td, marginTop: 8, fontStyle: 'italic' }}>{scoreContext(type, s)}</Text>
    </View>
  );
}

function ClauseCard({ item, idx, startOpen }: { item: Clause; idx: number; startOpen: boolean }) {
  const [open, setOpen]     = useState(startOpen);
  const [copied, setCopied] = useState(false);
  const r = riskOf(item.risk);
  const b = benchOf(item.standard || 'standard');

  const copyScript = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(item.script || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={[cs.card, { borderLeftColor: r.c }]}>
      <TouchableOpacity style={cs.cardHeader} onPress={() => { setOpen(o => !o); Haptics.selectionAsync(); }}>
        <Text style={cs.cardNum}>#{String(idx+1).padStart(2,'0')}</Text>
        <Text style={cs.cardTitle} numberOfLines={open ? 0 : 1}>{item.title || 'Clause'}</Text>
        <View style={[cs.pill, { backgroundColor: r.bg }]}>
          <Text style={[cs.pillText, { color: r.c }]}>{r.l}</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={C.td}/>
      </TouchableOpacity>
      {open && (
        <View style={cs.cardBody}>
          {/* WHAT TO SAY first — it's the most valuable thing */}
          {item.script && (
            <View style={cs.scriptBox}>
              <View style={cs.scriptHeader}>
                <Text style={[cs.label, { color: C.gold }]}>WHAT TO SAY</Text>
                <TouchableOpacity style={[cs.copyBtn, copied && cs.copyBtnDone]} onPress={copyScript}>
                  <Text style={[cs.copyBtnText, { color: copied ? C.green : C.gold }]}>{copied ? '✓ Copied' : 'Copy'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={cs.scriptText}>"{item.script}"</Text>
            </View>
          )}
          {item.plain && (
            <View style={{ marginTop: 12 }}>
              <Text style={cs.label}>PLAIN ENGLISH</Text>
              <Text style={cs.bodyText}>{item.plain}</Text>
            </View>
          )}
          {item.benchmark && (
            <View style={[cs.box, { backgroundColor: b.c+'0d', borderColor: b.c+'22', marginTop: 10 }]}>
              <Text style={[cs.label, { color: b.c }]}>{b.i} BENCHMARK</Text>
              <Text style={cs.bodyText}>{item.benchmark}</Text>
            </View>
          )}
          {item.excerpt && (
            <View style={[cs.box, { backgroundColor: 'rgba(0,0,0,0.3)', marginTop: 10 }]}>
              <Text style={cs.label}>ORIGINAL TEXT</Text>
              <Text style={cs.mono}>"{item.excerpt}"</Text>
            </View>
          )}
          {item.action && <Text style={[cs.action, { color: r.c }]}>→ {item.action}</Text>}
        </View>
      )}
    </View>
  );
}

function DateCard({ item }: { item: KeyDate }) {
  return (
    <View style={[ds.card, { borderLeftColor: urgCol(item.urgency) }]}>
      <Text style={ds.label}>{item.label || 'Deadline'}</Text>
      <Text style={[ds.date, { color: urgCol(item.urgency) }]}>{item.date || '—'}</Text>
      {item.action && <Text style={ds.action}>{item.action}</Text>}
    </View>
  );
}

export default function ResultsScreen() {
  const navigation = useNavigation<any>();
  const { currentResult, clearResult } = useStore();
  const R = currentResult;

  if (!R) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.tm }}>No results yet.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: C.gold }}>← Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const score     = Math.max(0, Math.min(10, parseFloat(String(R.score)) || 0));
  const clauses   = Array.isArray(R.clauses)   ? R.clauses   : [];
  const dates     = Array.isArray(R.dates)     ? R.dates     : [];
  const positives = Array.isArray(R.positives) ? R.positives : [];
  const redFlags  = clauses.filter(c => c?.risk === 'high').length;

  // Index of the first high-risk clause — pre-expand it
  const firstHighRiskIdx = clauses.findIndex(c => c?.risk === 'high');

  const shareResult = async () => {
    await Share.share({
      title: 'ContractShield Analysis',
      message: `ContractShield Analysis\n\n${R.type}\nScore: ${Math.round(score)}/10\n\n${R.verdict}\n\n${R.summary}\n\nAnalyze your own contracts free at ContractShield.`,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 48 }}>

        {/* Top bar */}
        <View style={rs.topBar}>
          <TouchableOpacity style={rs.backBtnWrap} onPress={() => { clearResult(); navigation.goBack(); }}>
            <Ionicons name="chevron-back" size={18} color={C.tm}/>
            <Text style={rs.backBtn}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={rs.shareWrap} onPress={shareResult}>
            <Ionicons name="share-outline" size={18} color={C.gold}/>
            <Text style={rs.shareBtn}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Type badge */}
        <View style={rs.typeBadge}>
          <Text style={rs.typeText}>{R.type || 'Document Analysis'}</Text>
        </View>

        {/* Score card */}
        <View style={rs.scoreCard}>
          <ScoreRing score={score} type={R.type || ''}/>
          <Text style={rs.verdict}>"{R.verdict || 'Analysis complete.'}"</Text>
          <Text style={rs.summary}>{R.summary || ''}</Text>
          <View style={rs.statsRow}>
            {([[redFlags,'Red Flags',C.red],[clauses.length,'Clauses',C.gold],[dates.length,'Key Dates',C.blue],[positives.length,'Positives',C.green]] as [any,string,string][]).map(([v,l,c], i, a) => (
              <View key={l} style={[rs.stat, i < a.length-1 && rs.statBorder]}>
                <Text style={[rs.statVal, { color: c }]}>{v}</Text>
                <Text style={rs.statLabel}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Positives — shown first to set a balanced tone before risks */}
        {positives.length > 0 && (
          <View style={[rs.section, rs.positivesBox]}>
            <View style={rs.sectionHeader}>
              <Ionicons name="checkmark-circle-outline" size={13} color={C.green}/>
              <Text style={[rs.sectionTitle, { color: C.green }]}>WORKS IN YOUR FAVOR</Text>
            </View>
            {positives.map((p, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                <Text style={{ color: C.green, fontSize: 12, marginTop: 2 }}>•</Text>
                <Text style={{ fontSize: 13, color: C.tm, lineHeight: 20, flex: 1 }}>{String(p)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Key dates */}
        {dates.length > 0 && (
          <View style={rs.section}>
            <View style={rs.sectionHeader}>
              <Ionicons name="calendar-outline" size={13} color={C.td}/>
              <Text style={rs.sectionTitle}>KEY DATES</Text>
            </View>
            {dates.map((d, i) => <DateCard key={i} item={d}/>)}
          </View>
        )}

        {/* Clauses */}
        {clauses.length > 0 && (
          <View style={rs.section}>
            <View style={[rs.sectionHeader, { justifyContent: 'space-between' }]}>
              <View style={rs.sectionHeader}>
                <Ionicons name="document-text-outline" size={13} color={C.td}/>
                <Text style={rs.sectionTitle}>CLAUSE ANALYSIS</Text>
              </View>
              <Text style={{ fontSize: 10, color: C.td }}>Tap to expand</Text>
            </View>
            {clauses.map((c, i) => (
              <ClauseCard
                key={i} item={c} idx={i}
                startOpen={i === firstHighRiskIdx}
              />
            ))}
          </View>
        )}

        {/* Bottom CTA */}
        <TouchableOpacity
          style={rs.analyzeAnotherBtn}
          onPress={() => { clearResult(); navigation.goBack(); }}
        >
          <Ionicons name="add-circle-outline" size={16} color={C.gold}/>
          <Text style={rs.analyzeAnotherText}>Analyze Another Document</Text>
        </TouchableOpacity>

        <Text style={rs.disclaimer}>Informational only · Not legal advice</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const cs = StyleSheet.create({
  card:        { borderLeftWidth: 3, borderRadius: 10, marginBottom: 8, backgroundColor: C.surf, overflow: 'hidden' },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 },
  cardNum:     { fontSize: 10, color: C.td, fontFamily: 'monospace', minWidth: 22 },
  cardTitle:   { flex: 1, fontSize: 13, fontWeight: '600', color: C.t, lineHeight: 18 },
  pill:        { borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  pillText:    { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  cardBody:    { paddingHorizontal: 14, paddingBottom: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)' },
  label:       { fontSize: 9, color: C.td, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6, marginTop: 14 },
  bodyText:    { fontSize: 13, color: C.tm, lineHeight: 20 },
  box:         { borderRadius: 8, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  mono:        { fontSize: 11, color: C.td, fontFamily: 'monospace', lineHeight: 18, fontStyle: 'italic' },
  scriptBox:   { backgroundColor: 'rgba(201,168,76,0.08)', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)', marginTop: 14 },
  scriptHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  scriptText:  { fontSize: 13, color: '#d4b86a', lineHeight: 21 },
  copyBtn:     { borderRadius: 4, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(201,168,76,0.35)' },
  copyBtnDone: { borderColor: 'rgba(76,175,125,0.35)', backgroundColor: 'rgba(76,175,125,0.1)' },
  copyBtnText: { fontSize: 11, fontWeight: '600' },
  action:      { fontSize: 12, lineHeight: 18, marginTop: 12 },
});
const ds = StyleSheet.create({
  card:   { padding: 12, backgroundColor: C.hi, borderRadius: 8, borderLeftWidth: 3, marginBottom: 8 },
  label:  { fontSize: 12, fontWeight: '700', color: C.t, marginBottom: 2 },
  date:   { fontSize: 12, fontFamily: 'monospace', marginBottom: 2 },
  action: { fontSize: 12, color: C.tm, lineHeight: 18 },
});
const rs = StyleSheet.create({
  topBar:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  backBtnWrap:  { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backBtn:      { fontSize: 15, color: C.tm },
  shareWrap:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shareBtn:     { fontSize: 15, color: C.gold, fontWeight: '600' },
  typeBadge:    { alignSelf: 'center', backgroundColor: C.surf, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: 18 },
  typeText:     { fontSize: 10, color: C.td, letterSpacing: 2, textTransform: 'uppercase' },
  scoreCard:    { backgroundColor: C.surf, borderRadius: 18, padding: 28, marginBottom: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  verdict:      { fontSize: 16, fontWeight: '700', color: C.t, textAlign: 'center', marginTop: 14, marginBottom: 8, lineHeight: 24 },
  summary:      { fontSize: 13, color: C.tm, textAlign: 'center', lineHeight: 20, maxWidth: 420 },
  statsRow:     { flexDirection: 'row', marginTop: 20, paddingTop: 18, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', width: '100%' },
  stat:         { flex: 1, alignItems: 'center' },
  statBorder:   { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.07)' },
  statVal:      { fontSize: 24, fontWeight: '800' },
  statLabel:    { fontSize: 9, color: C.td, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  section:      { marginBottom: 18 },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 10, color: C.td, letterSpacing: 2, textTransform: 'uppercase' },
  positivesBox:       { backgroundColor: 'rgba(76,175,125,0.07)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(76,175,125,0.18)' },
  analyzeAnotherBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, marginBottom: 4, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)', backgroundColor: 'rgba(201,168,76,0.07)' },
  analyzeAnotherText: { fontSize: 14, fontWeight: '700', color: C.gold },
  disclaimer:         { textAlign: 'center', fontSize: 10, color: C.td, lineHeight: 16, marginTop: 12 },
});
