import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Animated, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useStore } from '../services/store';
import { getPortalUrl, getHistory, deleteAccount, getUsage, setAuthToken } from '../services/api';
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

  const [history, setHistory]           = useState<{ id: string; result: any; created_at: string }[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingPortal, setLoadingPortal]   = useState(false);
  const [loadingDelete, setLoadingDelete]   = useState(false);

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
      setLoadingHistory(true);
      getHistory()
        .then(setHistory)
        .catch(() => {})
        .finally(() => setLoadingHistory(false));
    }, [])
  );

  const openHistoryResult = (item: { id: string; result: any; created_at: string }) => {
    if (!item.result) return;
    Haptics.selectionAsync();
    setResult(item.result);
    navigation.navigate('Results');
  };

  const handleManageSubscription = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoadingPortal(true);
    try {
      const { url } = await getPortalUrl();
      await WebBrowser.openBrowserAsync(url, {
        dismissButtonStyle: 'done',
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
      });
      const u = await getUsage();
      setIsPro(u.isPro);
      setUsage(u.used, u.limit, u.credits);
    } catch (e: any) {
      const msg = e?.response?.data?.error || e.message;
      if (msg?.includes('No active subscription')) {
        Alert.alert('No subscription found', 'Complete a checkout first, then manage it here.');
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleSignOut = async () => {
    try { await signOut(); } catch {}
    setAuthToken(null);
    setUser(null);
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
                {isPro ? '✦  PRO' : 'FREE'}
              </Text>
            </View>
          </View>

          {isPro ? (
            <View style={s.row}>
              <Text style={s.rowLabel}>Analyses</Text>
              <Text style={s.rowValue}>Unlimited</Text>
            </View>
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
                <Text style={s.rowValue}>{Math.max(0, freeLimit - freeUsed)} of {freeLimit} used</Text>
              </View>
            </>
          )}

          <View style={s.divider}/>

          {isPro ? (
            <TouchableOpacity
              style={[s.outlineBtn, loadingPortal && s.btnDisabled]}
              onPress={handleManageSubscription}
              disabled={loadingPortal}
            >
              {loadingPortal
                ? <ActivityIndicator color={C.gold} size="small"/>
                : <Text style={s.outlineBtnText}>Manage Subscription →</Text>
              }
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.goldBtn} onPress={() => navigation.navigate('Paywall')}>
              <Text style={s.goldBtnText}>Upgrade to Pro →</Text>
            </TouchableOpacity>
          )}
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
              <TouchableOpacity
                key={item.id}
                style={[s.histRow, i < history.length - 1 && s.histBorder]}
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
            onPress={() => WebBrowser.openBrowserAsync('https://getcontractshield.app/privacy.html')}
          >
            <Text style={s.rowLabel}>Privacy Policy</Text>
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
  emptyText:      { fontSize: 13, color: C.td, textAlign: 'center', paddingVertical: 16, lineHeight: 20 },
  legal:          { textAlign: 'center', fontSize: 10, color: C.td, marginTop: 24, lineHeight: 16 },
});
