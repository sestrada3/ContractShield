import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { analyzeContract, getHistory, getAnalysis, ApiError, HistoryItem } from '../lib/api';
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
  inputBorder: 'rgba(255,255,255,0.12)',
};

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

function getScoreColor(score: number): string {
  if (score < 4) return COLORS.red;
  if (score < 7) return COLORS.amber;
  return COLORS.green;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface UploadButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

function UploadButton({ icon, label, onPress, disabled }: UploadButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.uploadButton, disabled && styles.uploadButtonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.uploadIconWrapper}>
        <Ionicons name={icon} size={28} color={COLORS.gold} />
      </View>
      <Text style={styles.uploadLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing contract…');
  const [pasteModalVisible, setPasteModalVisible] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await getHistory();
      setHistory(data);
    } catch {
      // History fetch failure is non-critical
    } finally {
      setHistoryLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const handleAnalysis = async (formData: FormData) => {
    setLoading(true);
    setLoadingMessage('Uploading contract…');
    try {
      setTimeout(() => setLoadingMessage('Analyzing clauses…'), 3000);
      setTimeout(() => setLoadingMessage('Generating risk score…'), 8000);

      const result = await analyzeContract(formData);
      setHistory((prev) => [{ id: result.id, filename: result.filename, score: result.score, created_at: result.created_at }, ...prev]);
      navigation.navigate('Results', { result });
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        navigation.navigate('Paywall');
      } else {
        const message = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
        Alert.alert('Analysis Failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.name ?? 'document.pdf',
        type: asset.mimeType ?? 'application/pdf',
      } as unknown as Blob);

      await handleAnalysis(formData);
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to scan contracts.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      name: 'contract_photo.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);

    await handleAnalysis(formData);
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library permission is needed to select contracts.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      name: 'contract_image.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);

    await handleAnalysis(formData);
  };

  const handlePasteSubmit = async () => {
    if (!pastedText.trim()) {
      Alert.alert('Empty Text', 'Please paste your contract text before submitting.');
      return;
    }
    setPasteModalVisible(false);
    const formData = new FormData();
    formData.append('text', pastedText.trim());
    formData.append('filename', 'pasted_contract.txt');
    setPastedText('');
    await handleAnalysis(formData);
  };

  const handleHistoryItem = async (item: HistoryItem) => {
    setLoading(true);
    setLoadingMessage('Loading analysis…');
    try {
      const result = await getAnalysis(item.id);
      navigation.navigate('Results', { result });
    } catch (err) {
      Alert.alert('Error', 'Could not load this analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.gold} />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
            <Text style={styles.loadingSubtext}>This usually takes 15–30 seconds</Text>
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Ionicons name="shield-checkmark" size={28} color={COLORS.gold} />
            <Text style={styles.logoText}>ContractShield</Text>
          </View>
          <Text style={styles.headerSubtitle}>Upload a contract to analyze</Text>
        </View>

        {/* Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>UPLOAD CONTRACT</Text>
          <View style={styles.uploadGrid}>
            <UploadButton
              icon="document-text"
              label="PDF / Document"
              onPress={handlePickDocument}
              disabled={loading}
            />
            <UploadButton
              icon="camera"
              label="Take Photo"
              onPress={handleTakePhoto}
              disabled={loading}
            />
            <UploadButton
              icon="images"
              label="Photo Library"
              onPress={handlePickPhoto}
              disabled={loading}
            />
            <UploadButton
              icon="clipboard"
              label="Paste Text"
              onPress={() => setPasteModalVisible(true)}
              disabled={loading}
            />
          </View>
        </View>

        {/* Recent Analyses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENT ANALYSES</Text>
          {historyLoading ? (
            <ActivityIndicator color={COLORS.gold} style={styles.historyLoader} />
          ) : history.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No analyses yet</Text>
              <Text style={styles.emptySubtext}>Upload your first contract above to get started.</Text>
            </View>
          ) : (
            history.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyItem}
                onPress={() => handleHistoryItem(item)}
                activeOpacity={0.7}
              >
                <View style={styles.historyIcon}>
                  <Ionicons name="document-text-outline" size={20} color={COLORS.textMuted} />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyFilename} numberOfLines={1}>{item.filename}</Text>
                  <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                </View>
                <View style={[styles.scoreChip, { backgroundColor: `${getScoreColor(item.score)}20` }]}>
                  <Text style={[styles.scoreChipText, { color: getScoreColor(item.score) }]}>
                    {item.score.toFixed(1)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Paste Text Modal */}
      <Modal
        visible={pasteModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPasteModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Paste Contract Text</Text>
              <TouchableOpacity onPress={() => { setPasteModalVisible(false); setPastedText(''); }}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Copy your contract text and paste it below for AI analysis.
            </Text>
            <TextInput
              style={styles.pasteInput}
              placeholder="Paste contract text here…"
              placeholderTextColor={COLORS.textMuted}
              multiline
              textAlignVertical="top"
              value={pastedText}
              onChangeText={setPastedText}
              autoFocus
            />
            <Text style={styles.charCount}>{pastedText.length.toLocaleString()} characters</Text>
            <TouchableOpacity
              style={[styles.primaryButton, !pastedText.trim() && styles.primaryButtonDisabled]}
              onPress={handlePasteSubmit}
              disabled={!pastedText.trim()}
            >
              <Text style={styles.primaryButtonText}>Analyze Contract</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,13,18,0.92)',
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    width: 260,
  },
  loadingText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.gold,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  uploadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  uploadButton: {
    width: '47%',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(201,168,76,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  historyLoader: {
    paddingVertical: 30,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyFilename: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  historyDate: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  scoreChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  scoreChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 16,
    lineHeight: 20,
  },
  pasteInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    color: COLORS.textPrimary,
    fontSize: 14,
    padding: 14,
    height: 220,
    lineHeight: 20,
  },
  charCount: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
