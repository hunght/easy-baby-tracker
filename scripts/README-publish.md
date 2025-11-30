# Publish Script

Automated script to increment version numbers and publish your app to both Google Play Store and Apple App Store using EAS.

## Features

- ✅ Auto-increments version numbers (version, iOS buildNumber, Android versionCode)
- ✅ Builds for both Android and iOS
- ✅ Submits to both stores automatically
- ✅ Flexible options for platform-specific builds

## Usage

### Full Publish (Both Platforms)

```bash
npm run publish
# or
node scripts/publish.js
```

This will:

1. Increment version numbers in `app.json` and `package.json`
2. Build Android app bundle
3. Build iOS app
4. Submit Android to Google Play Store
5. Submit iOS to App Store

### Android Only

```bash
npm run publish:android
# or
node scripts/publish.js --android-only
```

### iOS Only

```bash
npm run publish:ios
# or
node scripts/publish.js --ios-only
```

### Build Only (No Submission)

```bash
npm run publish:build-only
# or
node scripts/publish.js --skip-submit
```

### Submit Only (Skip Build)

```bash
npm run publish:submit-only
# or
node scripts/publish.js --skip-build
```

## Command Line Options

- `--skip-build`: Skip the build step (only submit existing builds)
- `--skip-submit`: Skip the submit step (only build, don't submit)
- `--android-only`: Only build/submit Android
- `--ios-only`: Only build/submit iOS

## Version Numbering

The script increments:

- **Version** (e.g., `1.0.0` → `1.0.1`): Patch version in `app.json` and `package.json`
- **iOS Build Number** (e.g., `2` → `3`): Incremented in `app.json.expo.ios.buildNumber`
- **Android Version Code** (e.g., `2` → `3`): Incremented in `app.json.expo.android.versionCode`

## Prerequisites

1. **EAS CLI installed and logged in**

   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **EAS project configured**
   - `eas.json` with production profiles
   - Google Play service account key (`google-play-key.json`)
   - Apple credentials configured

3. **Google Play Console**
   - App created in Google Play Console
   - Service account with proper permissions

4. **App Store Connect**
   - App created in App Store Connect
   - Apple ID and Team ID configured in `eas.json`

## Example Workflow

```bash
# Make your code changes
git add .
git commit -m "feat: new feature"

# Publish to both stores
npm run publish

# Or publish just Android
npm run publish:android
```

## Notes

- The script will exit with an error if any build fails
- Submissions use the `--latest` flag to submit the most recent build
- Version numbers are automatically updated before building
- All changes are written to `app.json` and `package.json` files

## Troubleshooting

### Build Fails

- Check EAS build logs: https://expo.dev/accounts/[your-account]/projects/[your-project]/builds
- Verify credentials are properly configured
- Ensure all dependencies are installed

### Submit Fails

- Verify service account key has proper permissions
- Check that the app exists in Google Play Console / App Store Connect
- Ensure previous version was successfully submitted

### Version Already Exists

- The script increments versions automatically
- If you get "version already exists" error, the script has already incremented it
- Just run the script again
