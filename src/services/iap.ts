import { Platform } from 'react-native';
import {
  initConnection,
  endConnection,
  requestPurchase,
  requestSubscription,
  finishTransaction,
  getAvailablePurchases,
  type Purchase,
} from 'react-native-iap';
import { supabase } from './auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

export const APPLE_IDS = {
  creditSingle: 'com.contractshield.app.credit.single',
  creditPack10: 'com.contractshield.app.credit.pack10',
  monthly:      'com.contractshield.app.pro.monthly',
  yearly:       'com.contractshield.app.pro.yearly',
} as const;

export type AppleProductId = typeof APPLE_IDS[keyof typeof APPLE_IDS];

export async function connectIAP(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  await initConnection();
}

export async function disconnectIAP(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  await endConnection();
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

async function verifyWithServer(purchase: Purchase): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/api/apple/verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      receipt:   purchase.transactionReceipt,
      productId: purchase.productId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Receipt verification failed');
  }
}

export async function iapBuySubscription(productId: AppleProductId): Promise<void> {
  const purchase = await requestSubscription({ sku: productId });
  if (!purchase) throw new Error('Purchase cancelled');
  await verifyWithServer(purchase as Purchase);
  await finishTransaction({ purchase: purchase as Purchase, isConsumable: false });
}

export async function iapBuyCredit(productId: AppleProductId): Promise<void> {
  const purchase = await requestPurchase({ sku: productId });
  if (!purchase) throw new Error('Purchase cancelled');
  const p = Array.isArray(purchase) ? purchase[0] : purchase;
  await verifyWithServer(p);
  await finishTransaction({ purchase: p, isConsumable: true });
}

// Apple requires a visible Restore Purchases button
export async function iapRestore(): Promise<boolean> {
  const purchases = await getAvailablePurchases();
  if (!purchases.length) return false;
  // Verify each past purchase so server can reinstate access
  const results = await Promise.allSettled(purchases.map(p => verifyWithServer(p)));
  return results.some(r => r.status === 'fulfilled');
}
