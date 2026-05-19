import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ScoreRing from '../components/ScoreRing';
import { AnalysisClause, KeyDate } from '../lib/api';
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
  amber: '#e0993a',
  blue: '#4a9eff',
};

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Results'>;
type RoutePropType = RouteProp<RootStackParamList, 'Results'>;

function getRiskColor(risk: 'high' | 'medium' | 'low'): string {
  if (risk === 'high') return COLORS.red;
  if (risk === 'medium') return COLORS.amber;
  return COLORS.green;
}

function getRiskLabel(risk: 'high' | 'medium' | 'low'): string {
  if (risk === 'high') return 'High Risk';
  if (risk === 'medium') return 'Medium Risk';
  return 'Low Risk';
}

interface ClauseCardProps {
  clause: AnalysisClause;
  index: number;
}

function ClauseCard({ clause, index }: ClauseCardProps) {
  const color = getRiskColor(clause.risk);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    if (!clause.negotiation_script) return;
    await Clipboard.setStringAsync(clause.negotiation_script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.clauseCard}>
      <View style={styles.clauseHeader}>
        <View style={[styles.riskDot, { backgroundColor: color }]} />
        <View style={styles.clauseTitleRow}>
          <Text style={styles.clauseName}>{clause.name}</Text>
          <View style={[styles.riskBadge, { backgroundColor: `${color}20` }]}>
            <Text style={[styles.riskBadgeText, { color }]}>{getRiskLabel(clause.risk)}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.clauseDescription}>{clause.description}</Text>

      {(clause.risk === 'high' || clause.risk === 'medium') && clause.negotiation_script && (
        <View style={styles.scriptBox}>
          <View style={styles.scriptHeader}>
            <Ionicons name="chatbubble-ellipses" size={14} color={COLORS.blue} />
            <Text style={styles.scriptLabel}>WHAT TO SAY</Text>
          </View>
          <Text style={styles.scriptText}>{clause.negotiation_script}</Text>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopy} activeOpacity={0.7}>
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy-outline'}
              size={16}
              color={copied ? COLORS.green : COLORS.gold}
            />
            <Text style={[styles.copyButtonText, { color: copied ? COLORS.green : COLORS.gold }]}>
              {copied ? 'Copied!' : 'Copy Script'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

interface KeyDatesProps {
  dates: KeyDate[];
}

function KeyDatesSection({ dates }: KeyDatesProps) {
  if (!dates || dates.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>KEY DATES</Text>
      <View style={styles.card}>
        {dates.map((d, i) => (
          <View key={i} style={[styles.dateRow, i < dates.length - 1 && styles.dateRowBorder]}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.blue} />
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>{d.label}</Text>
              <Text style={styles.dateValue}>{d.date}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ResultsScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { result } = route.params;

  const highRiskCount = result.clauses.filter((c) => c.risk === 'high').length;
  const mediumRiskCount = result.clauses.filter((c) => c.risk === 'medium').length;
  const lowRiskCount = result.clauses.filter((c) => c.risk === 'low').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{result.filename}</Text>
        <View style={styles.navRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Score Section */}
        <View style={styles.scoreSection}>
          <ScoreRing score={result.score} size={180} />
          {result.market_context ? (
            <View style={styles.marketContextBox}>
              <Ionicons name="information-circle-outline" size={15} color={COLORS.textMuted} />
              <Text style={styles.marketContextText}>{result.market_context}</Text>
            </View>
          ) : null}
        </View>

        {/* Risk Summary */}
        <View style={styles.riskSummary}>
          <View style={styles.riskStat}>
            <Text style={[styles.riskCount, { color: COLORS.red }]}>{highRiskCount}</Text>
            <Text style={styles.riskStatLabel}>High Risk</Text>
          </View>
          <View style={styles.riskDivider} />
          <View style={styles.riskStat}>
            <Text style={[styles.riskCount, { color: COLORS.amber }]}>{mediumRiskCount}</Text>
            <Text style={styles.riskStatLabel}>Medium Risk</Text>
          </View>
          <View style={styles.riskDivider} />
          <View style={styles.riskStat}>
            <Text style={[styles.riskCount, { color: COLORS.green }]}>{lowRiskCount}</Text>
            <Text style={styles.riskStatLabel}>Low Risk</Text>
          </View>
        </View>

        {/* Clauses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CLAUSE BREAKDOWN</Text>
          {result.clauses.map((clause, index) => (
            <ClauseCard key={index} clause={clause} index={index} />
          ))}
        </View>

        {/* Key Dates */}
        {result.key_dates && result.key_dates.length > 0 && (
          <KeyDatesSection dates={result.key_dates} />
        )}

        {/* New Analysis Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.newAnalysisButton}
            onPress={() => navigation.navigate('Main')}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={20} color="#000" />
            <Text style={styles.newAnalysisText}>New Analysis</Text>
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  navTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  navRight: {
    width: 30,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  scoreSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 8,
  },
  marketContextBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  marketContextText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  riskSummary: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  riskStat: {
    flex: 1,
    alignItems: 'center',
  },
  riskCount: {
    fontSize: 28,
    fontWeight: '700',
  },
  riskStatLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  riskDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  clauseCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clauseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  riskDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    flexShrink: 0,
  },
  clauseTitleRow: {
    flex: 1,
    gap: 6,
  },
  clauseName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  clauseDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginLeft: 20,
  },
  scriptBox: {
    marginTop: 12,
    backgroundColor: 'rgba(74,158,255,0.07)',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(74,158,255,0.2)',
  },
  scriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  scriptLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.blue,
    letterSpacing: 1.5,
  },
  scriptText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(201,168,76,0.1)',
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  dateRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  dateValue: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  newAnalysisButton: {
    backgroundColor: COLORS.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  newAnalysisText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
