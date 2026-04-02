import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.ohmee.store',
  appName: 'Ohmee 巡店',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    Camera: {
      // CameraSource.Camera 强制调用相机，不允许从相册选取
    },
    Geolocation: {
      // iOS 需要在 Info.plist 声明 NSLocationWhenInUseUsageDescription
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: 'automatic',
  },
}

export default config
