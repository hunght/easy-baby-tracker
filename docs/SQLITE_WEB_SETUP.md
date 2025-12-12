# SQLite Web Setup for BabyEase NativeWind

This document explains the SQLite web compatibility setup for the BabyEase NativeWind project.

## Overview

The project uses `expo-sqlite` with Drizzle ORM for database management, configured to work seamlessly across iOS, Android, and Web platforms.

## Configuration Files

### 1. Metro Config (`metro.config.js`)

```javascript
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
```

**Key Points:**
- WASM asset support enables expo-sqlite to load WebAssembly on web
- Cross-Origin headers are required for SharedArrayBuffer (used by SQLite WASM)
- SQL file extension support is for Drizzle migration files

### 2. App Config (`app.json`)

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-web-browser",
      "expo-sqlite"
    ]
  }
}
```

**Key Points:**
- The `expo-sqlite` plugin must be registered for proper native configuration
- This enables SQLite functionality on iOS and Android

### 3. Database Service (`database/db.ts`)

```typescript
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { Platform } from 'react-native';

export const DATABASE_NAME = 'babyease.db';

/**
 * Open database with web-specific options
 * On web, disable change listener as it's not needed and can cause issues
 */
const openDatabaseOptions = Platform.select({
  web: {
    enableChangeListener: false,
  },
  default: {
    enableChangeListener: false,
  },
});

export const expoDb = openDatabaseSync(DATABASE_NAME, openDatabaseOptions);
export const db = drizzle(expoDb);
```

**Key Points:**
- Uses `openDatabaseSync` for synchronous database initialization
- Change listener is disabled across all platforms (as per Expo's modern SQLite recommendations)
- Platform-specific options can be added if needed

### 4. Migration Handler (`app/_layout.tsx`)

The app automatically runs migrations on startup:

```typescript
function MigrationHandler({ children }: { children: React.ReactNode }) {
  useDrizzleStudio(expoDb);

  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return <View><Text>Migration error: {error.message}</Text></View>;
  }

  if (!success) {
    return <View><Text>Migration is in progress...</Text></View>;
  }

  return <MigrationCompleteHandler>{children}</MigrationCompleteHandler>;
}
```

## Web-Specific Considerations

### SharedArrayBuffer Requirements

On web, expo-sqlite uses WebAssembly with SharedArrayBuffer for performance. This requires specific HTTP headers:

- `Cross-Origin-Embedder-Policy: credentialless`
- `Cross-Origin-Opener-Policy: same-origin`

These headers are set in the Metro config's middleware.

### WASM Loading

The `.wasm` file extension is added to Metro's asset extensions, allowing the SQLite WebAssembly module to be properly bundled and loaded on web.

### Development Server

When running `npm run web`, Metro's development server automatically applies the required headers. For production web deployments, ensure your web server sends these headers.

## Testing Web Compatibility

1. Start the development server:
   ```bash
   npm run web
   ```

2. Open the app in your browser

3. Test database operations:
   - Create records
   - Query data
   - Update records
   - Delete records

4. Check browser console for any SQLite-related errors

## Production Web Deployment

For production web builds, ensure your web server (Netlify, Vercel, etc.) is configured to send the required Cross-Origin headers. See the main README for deployment configuration details.

## Troubleshooting

### Database doesn't initialize on web
- Check browser console for WASM loading errors
- Verify Metro config includes WASM asset support
- Ensure Cross-Origin headers are present in Network tab

### "SharedArrayBuffer is not defined"
- Verify Cross-Origin headers are set correctly
- Check that both COOP and COEP headers are present
- Try restarting the Metro server with cache clear: `npm start -- --clear`

### Migrations fail on web
- Check that migration files are generated correctly
- Verify SQL file extension is added to Metro sourceExts
- Test migrations on native platforms first

## Additional Resources

- [Expo SQLite Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [SharedArrayBuffer MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)
