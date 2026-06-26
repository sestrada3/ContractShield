import Constants from 'expo-constants';

export interface RemoteConfig {
  analysisEnabled: boolean;
  pdfEnabled: boolean;
  imageEnabled: boolean;
  minBuild: number;
  storeUrl: string;
}

const DEFAULTS: RemoteConfig = {
  analysisEnabled: true,
  pdfEnabled: true,
  imageEnabled: true,
  minBuild: 0,
  storeUrl: '',
};

let _config: RemoteConfig = { ...DEFAULTS };

export async function fetchRemoteConfig(): Promise<RemoteConfig> {
  try {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL!;
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${baseUrl}/api/config`, { signal: controller.signal });
    clearTimeout(tid);
    if (res.ok) _config = await res.json();
  } catch {
    // network error — keep defaults or last cached value
  }
  return _config;
}

export function getRemoteConfig(): RemoteConfig {
  return _config;
}

export function needsUpdate(): boolean {
  const build = parseInt(Constants.expoConfig?.ios?.buildNumber ?? '0', 10);
  return _config.minBuild > 0 && build < _config.minBuild;
}
