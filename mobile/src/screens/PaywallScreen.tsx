import React, { useState } from 'react';
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

import { createCheckout, ApiError } from '../lib/api';
import { RootStackParamList } from '../navigation';

const COLORS = {
  background: '#0b0d12',
  card: '#13161e',
  border: 'rgba(255,255,255,0.07)',
  gold: '#c9a84c',
  textPrimary: 'rgba(255,255,255,0.92)',
  textMuted: 'rgba(255,255,255,0.45)',
  green: '#4caf7d',
};

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Paywall'>;

const FEATURES = [
  'Unlimited contract analyses',
  'Full AI clause breakdown',
  'Word-for-word negotiation scripts',
  'Key dates extraction',
  'Priority analysis speed',
  'Export reports as PDF',
];

export default function PaywallScreen() {
  const navigation = useNavigation<NavProp>();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { url } = await createCheckout(selectedPlan);
      const result = await WebBrowser.openBrowserAsync(url, {
        toolbarColor: '#0b0d12',
        controlsColor: '#c9a84c',
      });
      // After returning from browser, navigate back
      if (result.type === 'cancel' || result.type === 'dismiss') {
        // User closed browser — nothing to do
      }
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : 'Unable to start checkout. Please try again.';
      Alert.alert('Checkout Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Close / Back */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name="star" size={12} color={COLORS.gold} />
              <Text style={styles.badgeText}>PRO</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Protect Every Contract</Text>
          <Text style={styles.heroSubtitle}>
            Get unlimited AI analyses, negotiation scripts, and full clause breakdowns for every contract you sign.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featureList}>
          {FEATURES.map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureCheck}>
                <Ionicons name="checkmark" size={14} color={COLORS.green} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Plan Toggle */}
        <View style={styles.plansContainer}>
          {/* Yearly Plan */}
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('yearly')}
            activeOpacity={0.8}
          >
            {selectedPlan === 'yearly' && (
              <View style={styles.planSelectedIndicator}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.gold} />
              </View>
            )}
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>SAVE 40%</Text>
            </View>
            <Text style={styles.planName}>Yearly</Text>
            <View style={styles.planPriceRow}>
              <Text style={styles.planPrice}>$5.99</Text>
              <Text style={styles.planPeriod}>/mo</Text>
            </View>
            <Text style={styles.planSubtext}>Billed $71.88/year</Text>
          </TouchableOpacity>

          {/* Monthly Plan */}
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.8}
          >
            {selectedPlan === 'monthly' && (
              <View style={styles.planSelectedIndicator}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.gold} />
              </View>
            )}
            <Text style={styles.planName}>Monthly</Text>
            <View style={styles.planPriceRow}>
              <Text style={styles.planPrice}>$9.99</Text>
              <Text style={styles.planPeriod}>/mo</Text>
            </View>
            <Text style={styles.planSubtext}>Billed monthly</Text>
          </TouchableOpacity>
        </View>

        {/* Trial CTA */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={[styles.ctaButton, loading && styles.ctaButtonDisabled]}
            onPress={handleSubscribe}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={20} color="#000" />
                <Text style={styles.ctaButtonText}>Start Free 7-Day Trial</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.trialNote}>
            Cancel anytime • No charge for 7 days
          </Text>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.maybeLaterButton}>
            <Text style={styles.maybeLaterText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <Text style={styles.legalText}>
          Payment will be charged to your Apple ID / Google Play account. Subscription automatically renews unless canceled at least 24 hours before the end of the current period.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 32,
  },
  badgeRow: {
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gold,
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 38,
  },
  heroSubtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  featureList: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(76,175,125,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    flex: 1,
  },
  plansContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  planCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    position: 'relative',
    minHeight: 140,
    justifyContent: 'center',
  },
  planCardSelected: {
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(201,168,76,0.05)',
  },
  planSelectedIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  saveBadge: {
    backgroundColor: COLORS.gold,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 10,
  },
  saveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 1,
  },
  planName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  planPeriod: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  planSubtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  ctaContainer: {
    gap: 12,
    alignItems: 'center',
  },
  ctaButton: {
    backgroundColor: COLORS.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 14,
    gap: 10,
    width: '100%',
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaButtonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '700',
  },
  trialNote: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  maybeLaterButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  maybeLaterText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
  },
  legalText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 24,
  },
});
