import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UpdateBlocker({ storeUrl }: { storeUrl: string }) {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.body}>
        <View style={s.iconWrap}>
          <Text style={s.icon}>⬆️</Text>
        </View>
        <Text style={s.title}>Update Required</Text>
        <Text style={s.sub}>
          A new version of ContractShield is available and required to continue. Please update the app to keep using it.
        </Text>
        {!!storeUrl && (
          <TouchableOpacity style={s.btn} onPress={() => Linking.openURL(storeUrl)}>
            <Text style={s.btnText}>Update Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: '#0b0d12' },
  body:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  iconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(201,168,76,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  icon:     { fontSize: 36 },
  title:    { fontSize: 26, fontWeight: '800', color: '#ffffff', marginBottom: 14, textAlign: 'center' },
  sub:      { fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 24, textAlign: 'center', marginBottom: 36 },
  btn:      { backgroundColor: '#c9a84c', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 48 },
  btnText:  { fontSize: 16, fontWeight: '700', color: '#0b0d12' },
});
