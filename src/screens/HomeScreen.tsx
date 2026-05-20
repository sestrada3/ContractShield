import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert, Image, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { analyzeDocument, getUsage } from '../services/api';
import { useStore } from '../services/store';
import { C } from '../theme';

const LOADING_STEPS = [
  'Reading your document…',
  'Identifying clauses…',
  'Scoring risk level…',
  'Checking benchmarks…',
  'Generating your analysis…',
];

function LoadingOverlay({ onCancel }: { onCancel: () => void }) {
  const [stepIdx, setStepIdx] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const cycle = () => {
      Animated.sequence([
        Animated.timing(fade, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setStepIdx(i => (i + 1) % LOADING_STEPS.length);
        Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    };
    const t = setInterval(cycle, 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={ls.wrap}>
      <ActivityIndicator color={C.gold} size="large" style={{ marginBottom: 20 }}/>
      <Animated.Text style={[ls.step, { opacity: fade }]}>{LOADING_STEPS[stepIdx]}</Animated.Text>
      <Text style={ls.sub}>This takes 15–30 seconds</Text>
      <TouchableOpacity onPress={onCancel} style={ls.cancelBtn}>
        <Text style={ls.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { setResult, setAnalyzing, setError, setIsPro, setUsage, isAnalyzing, isPro, freeUsed, freeLimit } = useStore();

  const [text, setText]           = useState('');
  const [fileName, setFileName]   = useState('');
  const [imageData, setImageData] = useState<{base64: string; type: string} | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const cancelled = useRef(false);

  // Sync usage every time this screen comes into focus (catches upgrades from Paywall)
  useFocusEffect(
    useCallback(() => {
      getUsage()
        .then(u => { setIsPro(u.isPro); setUsage(u.used, u.limit); })
        .catch(() => {});
    }, [])
  );

  const canAnalyze = isPro || freeUsed < freeLimit;
  const hasInput   = text.trim().length > 0 || !!imageData || !!pdfBase64;

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'text/markdown'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      setFileName(file.name);
      if (file.mimeType === 'text/plain') {
        const content = await fetch(file.uri).then(r => r.text());
        setText(content.slice(0, 3000));
        setPdfBase64(null);
      } else if (file.mimeType === 'application/pdf') {
        const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' as any });
        if (base64.length > 2 * 1024 * 1024) {
          Alert.alert('PDF too large', 'Please use a PDF under 1.5 MB, or paste the text manually.');
          return;
        }
        setPdfBase64(base64);
        setText('');
      } else {
        Alert.alert('Unsupported file', 'Please upload a PDF or text file.');
      }
    } catch {
      Alert.alert('Could not open file', 'Please try again or paste the text manually.');
    }
  };

  const pickImage = async (useCamera: boolean) => {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Please allow access in Settings.'); return; }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ base64: false, quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({ base64: false, quality: 1, mediaTypes: ImagePicker.MediaTypeOptions.Images });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];

    const manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    if (!manipulated.base64) { Alert.alert('Could not read image', 'Please try again.'); return; }
    setImageData({ base64: manipulated.base64, type: 'image/jpeg' });
    setPdfBase64(null);
    setFileName(useCamera ? 'Camera photo' : 'Photo from library');
    setText('');
  };

  const handleCancel = () => {
    cancelled.current = true;
    setAnalyzing(false);
  };

  const run = async () => {
    if (!hasInput) return;
    if (!canAnalyze) { navigation.navigate('Paywall'); return; }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    cancelled.current = false;
    setAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeDocument({
        text: text || undefined,
        imageBase64: imageData?.base64,
        imageType: imageData?.type,
        pdfBase64: pdfBase64 || undefined,
      });
      if (cancelled.current) return;
      setResult(result);
      // Optimistically decrement so the badge updates instantly (server confirms on next focus)
      if (!isPro) setUsage(freeUsed + 1, freeLimit);
      getUsage().then(u => { setIsPro(u.isPro); setUsage(u.used, u.limit); }).catch(() => {});
      setText('');
      setImageData(null);
      setPdfBase64(null);
      setFileName('');
      navigation.navigate('Results');
    } catch (e: any) {
      if (cancelled.current) return;
      const status = e?.response?.status;
      if (status === 402) { navigation.navigate('Paywall'); return; }
      if (status === 429) { Alert.alert('Slow down', 'Too many requests. Please wait a moment.'); return; }
      if (status === 400) { Alert.alert('Could not analyze', e?.response?.data?.error || 'Invalid request.'); return; }
      setError('Analysis failed');
      Alert.alert('Analysis Failed', e?.response?.data?.error || e?.message || 'Something went wrong. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (isAnalyzing) return <LoadingOverlay onCancel={handleCancel}/>;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.header}>
          <Image source={require('../../assets/logo.png')} style={s.logo} resizeMode="contain"/>
          <View style={{ flex: 1 }}>
            <Text style={s.appName}>ContractShield</Text>
            <Text style={s.appSub}>AI LEGAL DOCUMENT REVIEW</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Account')} style={s.accountBtn}>
            <Ionicons name="person-circle-outline" size={28} color={C.tm}/>
          </TouchableOpacity>
        </View>

        {/* Security bar */}
        <View style={s.secBar}>
          {[
            { icon: 'lock-closed-outline' as const, label: 'Encrypted transit' },
            { icon: 'shield-checkmark-outline' as const, label: 'PII stripped' },
            { icon: 'eye-off-outline' as const, label: 'Never stored' },
          ].map(({ icon, label }) => (
            <View key={label} style={s.secItem}>
              <Ionicons name={icon} size={15} color="#4a9eff"/>
              <Text style={s.secText}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Usage badge */}
        {!isPro && (
          <View style={s.usageBadge}>
            <Text style={s.usageText}>
              {Math.max(0, freeLimit - freeUsed)} free {freeLimit - freeUsed === 1 ? 'analysis' : 'analyses'} remaining
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Paywall')}>
              <Text style={s.upgradeLink}>Upgrade →</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={s.body}>
          <Text style={s.tagline}>Instant · Private · Accurate</Text>
          <Text style={s.headline}>Know what you're{'\n'}<Text style={s.headlineGold}>actually signing.</Text></Text>
          <Text style={s.sub}>Upload any contract, NDA, lease, or job offer and get instant plain-English analysis with negotiation scripts.</Text>

          {/* Primary upload buttons */}
          <View style={s.primaryRow}>
            <TouchableOpacity style={s.primaryBtn} onPress={pickDocument}>
              <Ionicons name="document-text-outline" size={26} color={C.gold}/>
              <Text style={s.primaryBtnText}>Browse Files</Text>
              <Text style={s.primaryBtnSub}>PDF or text</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.primaryBtn, s.primaryBtnBlue]} onPress={() => pickImage(true)}>
              <Ionicons name="camera-outline" size={26} color={C.blue}/>
              <Text style={[s.primaryBtnText, { color: C.blue }]}>Camera</Text>
              <Text style={s.primaryBtnSub}>Photo a contract</Text>
            </TouchableOpacity>
          </View>

          {/* Secondary: photo library */}
          <TouchableOpacity style={s.secondaryBtn} onPress={() => pickImage(false)}>
            <Ionicons name="images-outline" size={16} color={C.tm}/>
            <Text style={s.secondaryBtnText}>Choose from Photo Library</Text>
          </TouchableOpacity>

          {fileName ? (
            <View style={s.fileChip}>
              <Ionicons name="checkmark-circle" size={16} color={C.green}/>
              <Text style={s.fileChipText} numberOfLines={1}>{fileName}</Text>
              <TouchableOpacity onPress={() => { setFileName(''); setImageData(null); setText(''); setPdfBase64(null); }}>
                <Ionicons name="close-circle" size={18} color={C.td}/>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Divider */}
          <View style={s.dividerRow}>
            <View style={s.dividerLine}/>
            <Text style={s.dividerText}>or paste text</Text>
            <View style={s.dividerLine}/>
          </View>

          <TextInput
            style={s.textInput}
            value={text}
            onChangeText={t => { setText(t); if (fileName && !imageData) setFileName(''); }}
            placeholder="Paste contract or document text here…"
            placeholderTextColor={C.td}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[s.analyzeBtn, (!hasInput || isAnalyzing) && s.analyzeBtnDisabled]}
            onPress={run}
            disabled={!hasInput || isAnalyzing}
          >
            <Text style={s.analyzeBtnText}>
              {canAnalyze ? 'Analyze My Document →' : 'Upgrade to Analyze →'}
            </Text>
          </TouchableOpacity>

          <Text style={s.disclaimer}>Your document is analyzed and immediately discarded. Only your results are saved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ls = StyleSheet.create({
  wrap:       { flex: 1, backgroundColor: '#0d0f15', alignItems: 'center', justifyContent: 'center', padding: 40 },
  step:       { fontSize: 17, fontWeight: '600', color: 'rgba(255,255,255,0.88)', marginBottom: 10, textAlign: 'center' },
  sub:        { fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginBottom: 32 },
  cancelBtn:  { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  cancelText: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
});

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: C.bg },
  scroll:          { flex: 1 },
  header:          { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  logo:            { width: 36, height: 36 },
  appName:         { fontSize: 16, fontWeight: '700', color: C.t },
  appSub:          { fontSize: 9, color: C.td, letterSpacing: 1.5 },
  accountBtn:      { padding: 4 },
  secBar:          { flexDirection: 'row', justifyContent: 'center', gap: 20, backgroundColor: 'rgba(74,158,255,0.07)', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(74,158,255,0.18)' },
  secItem:         { flexDirection: 'row', alignItems: 'center', gap: 5 },
  secText:         { fontSize: 12, color: '#4a9eff', fontWeight: '600' },
  usageBadge:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', margin: 16, marginBottom: 0, padding: 10, backgroundColor: 'rgba(201,168,76,0.08)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  usageText:       { fontSize: 12, color: C.gold },
  upgradeLink:     { fontSize: 12, color: C.gold, fontWeight: '700' },
  body:            { padding: 20 },
  tagline:         { textAlign: 'center', fontSize: 10, color: C.gold, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 10 },
  headline:        { textAlign: 'center', fontSize: 32, fontWeight: '800', color: C.t, lineHeight: 40, marginBottom: 12 },
  headlineGold:    { color: C.gold },
  sub:             { textAlign: 'center', fontSize: 14, color: C.tm, lineHeight: 22, marginBottom: 28 },
  primaryRow:      { flexDirection: 'row', gap: 10, marginBottom: 10 },
  primaryBtn:      { flex: 1, backgroundColor: 'rgba(201,168,76,0.1)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)', borderRadius: 14, padding: 18, alignItems: 'center', gap: 6 },
  primaryBtnBlue:  { backgroundColor: 'rgba(74,158,255,0.08)', borderColor: 'rgba(74,158,255,0.28)' },
  primaryBtnText:  { fontSize: 13, fontWeight: '700', color: C.gold },
  primaryBtnSub:   { fontSize: 10, color: C.td },
  secondaryBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginBottom: 14, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: C.surf },
  secondaryBtnText:{ fontSize: 13, color: C.tm },
  fileChip:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(76,175,125,0.1)', borderRadius: 8, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(76,175,125,0.2)' },
  fileChipText:    { fontSize: 12, color: '#4caf7d', flex: 1 },
  dividerRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  dividerLine:     { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  dividerText:     { fontSize: 11, color: C.td },
  textInput:       { backgroundColor: C.surf, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, color: C.t, fontSize: 13, lineHeight: 20, minHeight: 140, marginBottom: 16 },
  analyzeBtn:      { backgroundColor: C.gold, borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 12 },
  analyzeBtnDisabled: { opacity: 0.4 },
  analyzeBtnText:  { fontSize: 15, fontWeight: '700', color: '#0b0d12', letterSpacing: 0.3 },
  disclaimer:      { textAlign: 'center', fontSize: 11, color: C.td, lineHeight: 17 },
});
