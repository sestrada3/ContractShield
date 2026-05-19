import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { supabase } from '../lib/supabase';
import { getUsage, getBillingPortal, deleteAccount, ApiError, UsageData } from '../lib/api';
import { RootStackParamList } from '../navigation';

const COLORS = {
  background: '#0b0d12',
  card: '#13161e',
  border: 'rgba(255,255,255,0.07)',
  gold: '#c9a84c',
  textPrimary: 'rgba(255,255,255,0.92)',
  textMuted: 'rgba(255,255,255,0.45)',
  green: '#4caf7d',
  red: '#e05252',
};

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface MenuRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  rightElement?: React.ReactNode;
}

function MenuRow({ icon, label, onPress, destructive, disabled, rightElement }: MenuRowProps) {
  const labelColor = destructive ? COLORS.red : COLORS.textPrimary;
  const iconColor = destructive ? COLORS.red : COLORS.textMuted;
  return (
    <TouchableOpacity
      style={styles.menuRow}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, destructive && styles.menuIconDestructive]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[styles.menuLabel, { color: labelColor }, disabled && styles.menuLabelDisabled]}>
        {label}
      </Text>
      {rightElement ?? (
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      )}
    </TouchableOpacity>
  );
}

export default function AccountScreen() {
  const navigation = useNavigation<NavProp>();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsage = useCallback(async () => {
    try {
      const data = await getUsage();
      setUsage(data);
    } catch {
      // Non-critical — will show fallback
    } finally {
      setUsageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          // App.tsx auth listener will handle navigation
        },
      },
    ]);
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { url } = await getBillingPortal();
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: '#0b0d12',
        controlsColor: '#c9a84c',
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to open billing portal.';
      Alert.alert('Error', message);
    } finally {
      setPortalLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: async () => {
            setDeleteLoading(true);
            try {
              await deleteAccount();
              await supabase.auth.signOut();
            } catch (err) {
              const message = err instanceof ApiError ? err.message : 'Failed to delete account.';
              Alert.alert('Error', message);
            } finally {
              setDeleteLoading(false);
            }
          },
        },
      ],
    );
  };

  const isPro = usage?.plan === 'pro';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={28} color={COLORS.gold} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.emailText} numberOfLines={1}>
              {usage?.email ?? '—'}
            </Text>
            <View style={[styles.planBadge, isPro ? styles.planBadgePro : styles.planBadgeFree]}>
              {isPro && <Ionicons name="star" size={11} color={COLORS.gold} />}
              <Text style={[styles.planBadgeText, isPro ? styles.planBadgeTextPro : styles.planBadgeTextFree]}>
                {isPro ? 'Pro' : 'Free'}
              </Text>
            </View>
          </View>
        </View>

        {/* Usage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>USAGE THIS MONTH</Text>
          <View style={styles.usageCard}>
            {usageLoading ? (
              <ActivityIndicator color={COLORS.gold} />
            ) : isPro ? (
              <View style={styles.usageRow}>
                <Ionicons name="infinite-outline" size={20} color={COLORS.green} />
                <Text style={styles.usageText}>Unlimited analyses</Text>
              </View>
            ) : (
              <>
                <View style={styles.usageRow}>
                  <Text style={styles.usageCount}>
                    <Text style={styles.usageUsed}>{usage?.used ?? 0}</Text>
                    <Text style={styles.usageSeparator}> / </Text>
                    <Text style={styles.usageLimit}>{usage?.limit ?? 3}</Text>
                  </Text>
                  <Text style={styles.usageLabel}>analyses used</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(((usage?.used ?? 0) / (usage?.limit ?? 3)) * 100, 100)}%`,
                        backgroundColor:
                          (usage?.used ?? 0) >= (usage?.limit ?? 3) ? COLORS.red : COLORS.gold,
                      },
                    ]}
                  />
                </View>
                {(usage?.used ?? 0) >= (usage?.limit ?? 3) && (
                  <Text style={styles.limitReachedText}>Monthly limit reached — upgrade for unlimited.</Text>
                )}
              </>
            )}
          </View>
        </View>

        {/* Subscription Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUBSCRIPTION</Text>
          <View style={styles.menuCard}>
            {isPro ? (
              <MenuRow
                icon="card-outline"
                label="Manage Subscription"
                onPress={handleManageSubscription}
                disabled={portalLoading}
                rightElement={
                  portalLoading ? (
                    <ActivityIndicator size="small" color={COLORS.gold} />
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                  )
                }
              />
            ) : (
              <MenuRow
                icon="star-outline"
                label="Upgrade to Pro"
                onPress={() => navigation.navigate('Paywall')}
              />
            )}
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.menuCard}>
            <MenuRow
              icon="log-out-outline"
              label="Sign Out"
              onPress={handleSignOut}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="trash-outline"
              label={deleteLoading ? 'Deleting…' : 'Delete Account'}
              onPress={handleDeleteAccount}
              destructive
              disabled={deleteLoading}
              rightElement={
                deleteLoading ? (
                  <ActivityIndicator size="small" color={COLORS.red} />
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={COLORS.red} />
                )
              }
            />
          </View>
        </View>

        <Text style={styles.versionText}>ContractShield v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 16,
    marginBottom: 24,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(201,168,76,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
  },
  profileInfo: {
    flex: 1,
    gap: 6,
  },
  emailText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  planBadgePro: {
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
  },
  planBadgeFree: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  planBadgeTextPro: {
    color: COLORS.gold,
  },
  planBadgeTextFree: {
    color: COLORS.textMuted,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  usageCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  usageCount: {
    fontSize: 20,
  },
  usageUsed: {
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontSize: 20,
  },
  usageSeparator: {
    color: COLORS.textMuted,
    fontSize: 20,
  },
  usageLimit: {
    color: COLORS.textMuted,
    fontSize: 20,
  },
  usageLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  usageText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  limitReachedText: {
    fontSize: 12,
    color: COLORS.red,
    marginTop: 8,
  },
  menuCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDestructive: {
    backgroundColor: 'rgba(224,82,82,0.1)',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  menuLabelDisabled: {
    opacity: 0.5,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 64,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.2)',
    paddingBottom: 32,
  },
});
