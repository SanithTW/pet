require('dotenv').config();

const apiUrl = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();

module.exports = {
  expo: {
    name: "pet-care-mobile",
    slug: "pet-care-mobile",
    version: "1.0.0",
    platforms: [
      "ios",
      "android",
      "web"
    ],
    extra: {
      apiUrl: apiUrl || undefined,
    },
    orientation: "portrait",
    icon: "./assets/1.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true
        }
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      usesCleartextTraffic: true
    },
    updates: {
      enabled: false,
      fallbackToCacheTimeout: 0,
      checkAutomatically: "ON_ERROR_RECOVERY"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "@react-native-community/datetimepicker"
    ]
  }
};
