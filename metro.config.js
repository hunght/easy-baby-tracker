const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add SQL file support for Drizzle migrations
config.resolver.sourceExts.push('sql');

// Add wasm extension support for expo-sqlite web
// This enables WebAssembly file support required by expo-sqlite on web
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

// Add HTTP headers for SharedArrayBuffer support (required for expo-sqlite on web)
config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Set required headers for SharedArrayBuffer
      res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      return middleware(req, res, next);
    };
  },
};

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
