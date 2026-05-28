import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Animated, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Purchases from 'react-native-purchases';
import { useStore } from '../services/store';
import { getHistory, deleteAccount, getUsage, setAuthToken, deleteAnalysis } from '../services/api';
import * as LocalAuthentication from 'expo-local-authentication';
import { signOut } from '../services/auth';
import { C } from '../theme';

function SkeletonRow() {
  const anim = React.useRef(new Animated.Value(0.4)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={sk.row}>
      <View style={{ flex: 1, gap: 6 }}>
        <Animated.View style={[sk.line, { width: '60%', opacity: anim }]}/>
        <Animated.View style={[sk.line, { width: '35%', opacity: anim }]}/>
      </View>
      <Animated.View style={[sk.chip, { opacity: anim }]}/>
    </View>
  );
}

const scoreStyle = (score?: number) => {
  if (score === undefined || score === null) return s.scoreNeutral;
  if (score >= 7) return s.scoreGood;
  if (score >= 4) return s.scoreMid;
  return s.scoreBad;
};

export default function AccountScreen() {
  const navigation = useNavigation<any>();
  const { user, isPro, freeUsed, freeLimit, credits, setUser, setIsPro, setUsage, setResult } = useStore();

  const [history, setHistory]               = useState<{ id: string; result: any; created_at: string }[]>([]);
  const [loadingHistory, setLoadingHistory]   = useState(false);
  const [loadingDelete, setLoadingDelete]     = useState(false);
  const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'yearly' | null>(null);
  const [renewalDate, setRenewalDate]         = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled]     = useState(false);

  const email       = user?.email ?? '';
  const initials    = email.slice(0, 2).toUpperCase();
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  useFocusEffect(
    useCallback(() => {
      getUsage()
        .then(u => { setIsPro(u.isPro); setUsage(u.used, u.limit, u.credits); })
        .catch(() => {});
      Purchases.getCustomerInfo()
        .then(info => {
          const entitlement = info.entitlements.active['ContractShield AI Pro'];
          if (entitlement) {
            const id = entitlement.productIdentifier.toLowerCase();
            setSubscriptionType(
              id.includes('annual') || id.includes('yearly') || id.includes('year') ? 'yearly' : 'monthly'
            );
            if (entitlement.expirationDate) {
              setRenewalDate(new Date(entitlement.expirationDate).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              }));
            }
          } else {
            setSubscriptionType(null);
            setRenewalDate(null);
          }
        })
        .catch(() => {});
      LocalAuthentication.hasHardwareAsync().then(async has => {
        if (has) {
          setBiometricAvailable(true);
          const val = await SecureStore.getItemAsync('biometricEnabled').catch(() => null);
          setBiometricEnabled(val === '1');
        }
      });
      getHistory()
        .then(setHistory)
        .catch(() => {});
    }, [])
  );

  // Computed usage stats from history
  const validScores = history
    .filter(h => h.result?.score != null)
    .map(h => parseFloat(String(h.result.score)));
  const avgScore = validScores.length > 0
    ? (validScores.reduce((sum, n) => sum + n, 0) / validScores.length).toFixed(1)
    : null;
  const avgScoreNum = avgScore ? parseFloat(avgScore) : null;
  const avgScoreColor = avgScoreNum == null ? C.td : avgScoreNum >= 7 ? C.green : avgScoreNum >= 4 ? C.amber : C.red;

  const openHistoryResult = (item: { id: string; result: any; created_at: string }) => {
    if (!item.result) return;
    Haptics.selectionAsync();
    setResult(item.result);
    navigation.navigate('Results');
  };

  const handleManageSubscription = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('https://apps.apple.com/account/subscriptions');
  };

  const handleSignOut = async () => {
    try { await signOut(); } catch {}
    setAuthToken(null);
    setUser(null);
  };

  const handleBiometricToggle = async () => {
    if (biometricEnabled) {
      await SecureStore.setItemAsync('biometricEnabled', '0');
      setBiometricEnabled(false);
    } else {
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Authenticate to enable Face ID unlock' });
      if (result.success) {
        await SecureStore.setItemAsync('biometricEnabled', '1');
        setBiometricEnabled(true);
      }
    }
  };

  const confirmDeleteAnalysis = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Delete Analysis', 'Remove this analysis from your history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteAnalysis(id);
            setHistory(h => h.filter(item => item.id !== id));
          } catch {
            Alert.alert('Error', 'Could not delete analysis.');
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This permanently deletes your account and all analysis history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            setLoadingDelete(true);
            try {
              await deleteAccount();
              setAuthToken(null);
              setUser(null);
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.error || e.message);
              setLoadingDelete(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Nav */}
        <View style={s.nav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
            <Ionicons name="chevron-back" size={18} color={C.gold}/>
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={s.navTitle}>Account</Text>
          <View style={s.navSpacer}/>
        </View>

        {/* Profile card */}
        <View style={s.card}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.email}>{email}</Text>
          {!!memberSince && <Text style={s.meta}>Member since {memberSince}</Text>}
        </View>

        {/* Subscription */}
        <Text style={s.sectionLabel}>SUBSCRIPTION</Text>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.rowLabel}>Plan</Text>
            <View style={[s.badge, isPro ? s.badgePro : s.badgeFree]}>
              <Text style={[s.badgeText, isPro ? s.badgeTextPro : s.badgeTextFree]}>
                {isPro
                  ? `✦  PRO${subscriptionType ? ` · ${subscriptionType.toUpperCase()}` : ''}`
                  : 'FREE'}
              </Text>
            </View>
          </View>

          {isPro ? (
            <>
              {renewalDate && (
                <View style={s.row}>
                  <Text style={s.rowLabel}>Renews</Text>
                  <Text style={s.rowValue}>{renewalDate}</Text>
                </View>
              )}
              <View style={s.row}>
                <Text style={s.rowLabel}>Analyses</Text>
                <Text style={s.rowValue}>
                  {subscriptionType ? `Unlimited / ${subscriptionType === 'yearly' ? 'year' : 'month'}` : 'Unlimited'}
                </Text>
              </View>
              {credits > 0 && (
                <View style={s.row}>
                  <Text style={s.rowLabel}>Banked credits</Text>
                  <Text style={[s.rowValue, { color: C.gold }]}>{credits} saved · active after Pro</Text>
                </View>
              )}
            </>
          ) : (
            <>
              {credits > 0 && (
                <View style={s.row}>
                  <Text style={s.rowLabel}>Paid credits</Text>
                  <Text style={[s.rowValue, { color: C.gold }]}>{credits} remaining</Text>
                </View>
              )}
              <View style={s.row}>
                <Text style={s.rowLabel}>Free analyses</Text>
                <Text style={s.rowValue}>{Math.max(0, freeLimit - freeUsed)} of {freeLimit} remaining</Text>
              </View>
            </>
          )}

          <View style={s.divider}/>

          {isPro ? (
            <TouchableOpacity style={s.outlineBtn} onPress={handleManageSubscription}>
              <Text style={s.outlineBtnText}>Manage Subscription →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.goldBtn} onPress={() => navigation.navigate('Paywall')}>
              <Text style={s.goldBtnText}>Upgrade to Pro →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Usage stats */}
        <Text style={s.sectionLabel}>USAGE</Text>
        <View style={s.card}>
          {loadingHistory ? (
            <View style={s.statsRow}>
              {[0, 1, 2].map(i => (
                <View key={i} style={[s.statBox, i > 0 && s.statBorderLeft]}>
                  <View style={{ width: 40, height: 28, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 6, marginBottom: 6 }}/>
                  <View style={{ width: 56, height: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 4 }}/>
                </View>
              ))}
            </View>
          ) : (
            <View style={s.statsRow}>
              <View style={s.statBox}>
                <Text style={s.statVal}>{history.length}</Text>
                <Text style={s.statLabel}>Analyzed</Text>
              </View>
              <View style={[s.statBox, s.statBorderLeft]}>
                <Text style={s.statVal}>{isPro ? '∞' : credits > 0 ? credits : Math.max(0, freeLimit - freeUsed)}</Text>
                <Text style={s.statLabel}>{isPro ? 'Unlimited' : credits > 0 ? 'Paid credits' : 'Remaining'}</Text>
              </View>
              <View style={[s.statBox, s.statBorderLeft]}>
                <Text style={[s.statVal, { color: avgScoreColor }]}>{avgScore ?? '—'}</Text>
                <Text style={s.statLabel}>Avg Score</Text>
              </View>
            </View>
          )}
        </View>

        {/* Security & Privacy */}
        <Text style={s.sectionLabel}>SECURITY & PRIVACY</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>Auto-Delete Contracts</Text>
              <Text style={s.rowMeta}>Uploaded text deleted after analysis</Text>
            </View>
            <TouchableOpacity
              onPress={() => Alert.alert(
                'Always On',
                'ContractShield never stores your contracts — uploaded text is permanently deleted after analysis. This cannot be disabled.',
                [{ text: 'Got it' }]
              )}
              activeOpacity={0.8}
            >
              <View style={s.toggle}>
                <View style={s.toggleKnob}/>
              </View>
            </TouchableOpacity>
          </View>
          {biometricAvailable && (
            <>
              <View style={s.divider}/>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowLabel}>Face ID Unlock</Text>
                  <Text style={s.rowMeta}>Require Face ID to open the app</Text>
                </View>
                <TouchableOpacity onPress={handleBiometricToggle} activeOpacity={0.8}>
                  <View style={[s.toggle, { backgroundColor: biometricEnabled ? C.green : 'rgba(255,255,255,0.15)' }]}>
                    <View style={[s.toggleKnob, { alignSelf: biometricEnabled ? 'flex-end' : 'flex-start' }]}/>
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}
          <View style={s.divider}/>
          <TouchableOpacity
            style={s.row}
            onPress={() => WebBrowser.openBrowserAsync('https://getcontractshield.app/privacy.html')}
          >
            <Text style={s.rowLabel}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={14} color={C.td}/>
          </TouchableOpacity>
        </View>

        {/* Analysis history */}
        <Text style={s.sectionLabel}>RECENT ANALYSES</Text>
        <View style={s.card}>
          {loadingHistory ? (
            <>
              <SkeletonRow/>
              <SkeletonRow/>
              <SkeletonRow/>
            </>
          ) : history.length === 0 ? (
            <Text style={s.emptyText}>No analyses yet. Upload a contract to get started.</Text>
          ) : (
            history.map((item, i) => (
              <View key={item.id} style={[s.histRow, i < history.length - 1 && s.histBorder]}>
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => openHistoryResult(item)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={s.histType}>{item.result?.type ?? 'Document'}</Text>
                    <Text style={s.histDate}>
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[s.scoreChip, scoreStyle(item.result?.score)]}>
                      <Text style={s.scoreChipText}>{item.result?.score ?? '?'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={C.td}/>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmDeleteAnalysis(item.id)} style={s.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={16} color={C.red}/>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Account actions */}
        <Text style={s.sectionLabel}>ACCOUNT</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.row} onPress={handleSignOut}>
            <Text style={s.rowLabel}>Sign Out</Text>
            <Ionicons name="log-out-outline" size={18} color={C.td}/>
          </TouchableOpacity>
          <View style={s.divider}/>
          <TouchableOpacity
            style={[s.row, loadingDelete && s.btnDisabled]}
            onPress={handleDeleteAccount}
            disabled={loadingDelete}
          >
            {loadingDelete ? (
              <ActivityIndicator color={C.red} size="small"/>
            ) : (
              <>
                <Text style={[s.rowLabel, { color: C.red }]}>Delete Account & Data</Text>
                <Ionicons name="trash-outline" size={18} color={C.red}/>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Legal & Support */}
        <Text style={s.sectionLabel}>SUPPORT & LEGAL</Text>
        <View style={s.card}>
          <TouchableOpacity
            style={s.row}
            onPress={() => Linking.openURL('mailto:support@getcontractshield.app')}
          >
            <Text style={s.rowLabel}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={14} color={C.td}/>
          </TouchableOpacity>
          <View style={s.divider}/>
          <TouchableOpacity
            style={s.row}
            onPress={() => WebBrowser.openBrowserAsync('https://getcontractshield.app/terms.html')}
          >
            <Text style={s.rowLabel}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={14} color={C.td}/>
          </TouchableOpacity>
        </View>

        <Text style={s.legal}>ContractShield · Not legal advice · For informational purposes only</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const sk = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  line: { height: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 5 },
  chip: { width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)' },
});

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: C.bg },
  scroll:         { padding: 20, paddingBottom: 48 },
  nav:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  back:           { flexDirection: 'row', alignItems: 'center', gap: 2, minWidth: 64 },
  backText:       { fontSize: 15, color: C.gold, fontWeight: '600' },
  navTitle:       { fontSize: 17, fontWeight: '700', color: C.t },
  navSpacer:      { minWidth: 64 },
  card:           { backgroundColor: C.surf, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: 8 },
  avatar:         { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(201,168,76,0.1)', borderWidth: 2, borderColor: C.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 12, alignSelf: 'center' },
  avatarText:     { fontSize: 26, fontWeight: '800', color: C.gold },
  email:          { fontSize: 15, fontWeight: '600', color: C.t, textAlign: 'center', marginBottom: 4 },
  meta:           { fontSize: 12, color: C.td, textAlign: 'center' },
  sectionLabel:   { fontSize: 10, color: C.td, letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginLeft: 4 },
  row:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel:       { fontSize: 14, color: C.t },
  rowValue:       { fontSize: 14, color: C.tm, fontWeight: '600' },
  rowMeta:        { fontSize: 11, color: C.td, marginTop: 2 },
  divider:        { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 8 },
  badge:          { borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1 },
  badgePro:       { backgroundColor: 'rgba(201,168,76,0.12)', borderColor: 'rgba(201,168,76,0.35)' },
  badgeFree:      { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)' },
  badgeText:      { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  badgeTextPro:   { color: C.gold },
  badgeTextFree:  { color: C.td },
  outlineBtn:     { marginTop: 4, padding: 13, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)', alignItems: 'center' },
  outlineBtnText: { fontSize: 14, color: C.gold, fontWeight: '600' },
  goldBtn:        { marginTop: 4, backgroundColor: C.gold, borderRadius: 10, padding: 14, alignItems: 'center' },
  goldBtnText:    { fontSize: 14, fontWeight: '700', color: '#0b0d12' },
  btnDisabled:    { opacity: 0.5 },
  // Usage stats
  statsRow:       { flexDirection: 'row', paddingVertical: 4 },
  statBox:        { flex: 1, alignItems: 'center', paddingVertical: 8 },
  statBorderLeft: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.07)' },
  statVal:        { fontSize: 28, fontWeight: '800', color: C.t },
  statLabel:      { fontSize: 10, color: C.td, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 3 },
  // Security toggle
  toggle:         { width: 46, height: 26, borderRadius: 13, backgroundColor: C.green, justifyContent: 'center', paddingHorizontal: 2 },
  toggleKnob:     { width: 22, height: 22, borderRadius: 11, backgroundColor: 'white', alignSelf: 'flex-end' },
  // (legacy badge kept for reference)
  onBadge:        { backgroundColor: 'rgba(76,175,125,0.15)', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(76,175,125,0.3)' },
  onBadgeText:    { fontSize: 10, fontWeight: '700', color: C.green, letterSpacing: 0.8 },
  // History
  histRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  histBorder:     { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  histType:       { fontSize: 13, color: C.t, fontWeight: '600', marginBottom: 3 },
  histDate:       { fontSize: 11, color: C.td },
  scoreChip:      { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  scoreChipText:  { fontSize: 13, fontWeight: '700', color: C.t },
  scoreGood:      { backgroundColor: 'rgba(76,175,125,0.2)' },
  scoreMid:       { backgroundColor: 'rgba(201,168,76,0.2)' },
  scoreBad:       { backgroundColor: 'rgba(224,82,82,0.2)' },
  scoreNeutral:   { backgroundColor: 'rgba(255,255,255,0.08)' },
  deleteBtn:      { paddingLeft: 12 },
  emptyText:      { fontSize: 13, color: C.td, textAlign: 'center', paddingVertical: 16, lineHeight: 20 },
  legal:          { textAlign: 'center', fontSize: 10, color: C.td, marginTop: 24, lineHeight: 16 },
});
