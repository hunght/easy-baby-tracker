# App Store Publishing Workflow

This document outlines the complete workflow for publishing and managing the **Easy Baby Tracker** app on both Google Play Store (Android) and Apple App Store (iOS).

## 📱 App Information

- **App Name:** Easy Baby Tracker
- **Package Name / Bundle ID:** `com.hunght.BabyEase`
- **Current Version:** 1.0.1
- **iOS Team ID:** 111225803 ("Hung Hoang The" team)

---

## 🤖 Android (Google Play Store) Workflow

### Current Status (as of latest update)

- ✅ **Version 1.0.1** is deployed to all tracks:
  - Production: Version Code 3, Release Name 1.0.1
  - Beta: Version Code 3, Release Name 1.0.1
  - Alpha: Version Code 3, Release Name 1.0.1
  - Internal: Version Code 3, Release Name 1.0.1
- ✅ Old version 1.0.0 has been automatically superseded
- ⏳ **Status:** WAITING FOR REVIEWER (Changes in review)
- ⚠️ **Action Required:** Developer account inactivity warning needs to be addressed

### Fastlane Commands for Android

#### Metadata Management

```bash
# Download metadata from Google Play Console
fastlane android download_metadata

# Upload metadata to Google Play Console
fastlane android upload_metadata

# Download screenshots
fastlane android download_screenshots

# Upload screenshots
fastlane android upload_screenshots
```

#### Release Management

```bash
# Check release status across all tracks
fastlane android check_release_status

# Promote version 1.0.1 to production
fastlane android promote_to_production

# Promote version 1.0.1 to beta
fastlane android promote_to_beta

# Promote version 1.0.1 to alpha
fastlane android promote_to_alpha

# Promote to both beta and alpha tracks
fastlane android promote_to_testing_tracks

# Complete cleanup: Promote 1.0.1 to all tracks
fastlane android cleanup_releases
```

#### Using Node Script

```bash
# Check Android release status
node scripts/check-android-release.js
```

### Android Publishing Workflow

#### Initial Setup (One-time)

1. **Google Play Console Setup**
   - Create app in Google Play Console
   - Set up service account and download `google-play-key.json`
   - Configure app details, privacy policy, target audience

2. **Fastlane Configuration**
   - Ensure `google-play-key.json` is in project root
   - Metadata files in `fastlane/metadata/android/`

#### Regular Release Process

1. **Build and Submit (using EAS)**

   ```bash
   # Full publish (builds and submits)
   npm run publish

   # Android only
   npm run publish:android

   # Build only (no submission)
   npm run publish:build-only
   ```

2. **Update Metadata (if needed)**

   ```bash
   # Edit metadata files in fastlane/metadata/android/
   # Then upload
   fastlane android upload_metadata
   ```

3. **Promote Between Tracks**

   ```bash
   # After testing in internal, promote to production
   fastlane android promote_to_production
   ```

4. **Check Status**
   ```bash
   fastlane android check_release_status
   ```

### Android Metadata Structure

```
fastlane/metadata/android/
└── en-US/
    ├── title.txt
    ├── short_description.txt
    ├── full_description.txt
    └── changelogs/
        └── default.txt
```

---

## 🍎 iOS (Apple App Store) Workflow

### Current Status

- ✅ Metadata uploaded to App Store Connect
- ✅ App name updated to "Easy Baby Tracker"
- ✅ App review information configured (contact details)
- ⏳ **Status:** Pending first submission

### Fastlane Commands for iOS

#### Metadata Management

```bash
# Upload metadata to App Store Connect
fastlane ios upload_metadata

# Upload screenshots to App Store Connect
fastlane ios upload_screenshots

# Download metadata (manual process - see notes in Fastfile)
fastlane ios download_metadata
```

### iOS Publishing Workflow

#### Initial Setup (One-time)

1. **App Store Connect Setup**
   - Create app in App Store Connect
   - Configure app information, privacy policy
   - Set up app review information

2. **Fastlane Configuration**
   - Team ID configured: `111225803`
   - App identifier: `com.hunght.BabyEase`
   - Metadata files in `fastlane/metadata/ios/`

#### Regular Release Process

1. **Build and Submit (using EAS)**

   ```bash
   # Full publish (builds and submits)
   npm run publish

   # iOS only
   npm run publish:ios
   ```

2. **Update Metadata (if needed)**

   ```bash
   # Edit metadata files in fastlane/metadata/ios/
   # Then upload
   fastlane ios upload_metadata
   ```

3. **Upload Screenshots**
   ```bash
   fastlane ios upload_screenshots
   ```

### iOS Metadata Structure

```
fastlane/metadata/ios/
└── en-US/
    ├── name.txt
    ├── subtitle.txt
    ├── description.txt
    ├── keywords.txt
    ├── promotional_text.txt
    ├── release_notes.txt
    └── screenshots/
        └── (screenshot files)
```

### iOS App Review Information

Configured in `fastlane/Fastfile`:

- Contact First Name: Hung
- Contact Last Name: Hoang
- Contact Phone: +1 206 555 0100
- Contact Email: hth321@gmail.com

---

## 🚀 Complete Publishing Workflow (Both Platforms)

### Using EAS CLI (Recommended)

The `scripts/publish.js` script automates the entire process:

```bash
# Full publish to both stores
npm run publish

# Platform-specific
npm run publish:android
npm run publish:ios

# Options
npm run publish:build-only    # Build only, no submission
npm run publish:submit-only    # Submit only, skip build
```

**What it does:**

1. Auto-increments version numbers
2. Builds app bundles (AAB for Android, IPA for iOS)
3. Submits to respective stores
4. Updates `app.json` and `package.json`

### Manual Workflow

1. **Update Version Numbers**
   - Edit `app.json`:
     - `version`: e.g., "1.0.1"
     - `expo.ios.buildNumber`: e.g., "3"
     - `expo.android.versionCode`: e.g., 3

2. **Build Apps**

   ```bash
   eas build --platform android --profile production
   eas build --platform ios --profile production
   ```

3. **Submit to Stores**

   ```bash
   eas submit --platform android --latest
   eas submit --platform ios --latest
   ```

4. **Update Metadata (if needed)**
   ```bash
   fastlane android upload_metadata
   fastlane ios upload_metadata
   ```

---

## 📋 Next Steps & Action Items

### Immediate Actions Required

1. **⚠️ URGENT: Address Developer Account Warning**
   - Go to Google Play Console
   - Click "View details" on the inactivity warning
   - Follow Google's instructions to reactivate account
   - This must be resolved to prevent account suspension

2. **Monitor Android Review**
   - Current status: "WAITING FOR REVIEWER"
   - Check Publishing overview page regularly
   - Watch for email notifications
   - Expected review time: 1-3 days

3. **Prepare iOS First Submission**
   - Ensure all metadata is complete
   - Prepare screenshots if not already uploaded
   - Review app review information
   - Submit first build when ready

### Ongoing Maintenance

1. **Regular Metadata Updates**
   - Update descriptions, keywords as needed
   - Keep release notes current
   - Update screenshots for new features

2. **Version Management**
   - Use `npm run publish` for automated versioning
   - Or manually update versions in `app.json`
   - Always increment version codes/numbers

3. **Track Promotion Strategy**
   - Test in Internal track first
   - Promote to Alpha/Beta for wider testing
   - Promote to Production after validation

4. **Monitoring**
   - Check release status regularly: `fastlane android check_release_status`
   - Monitor Google Play Console for reviews, crashes, feedback
   - Monitor App Store Connect for iOS reviews and analytics

---

## 🔧 Troubleshooting

### Android Issues

**Problem:** Cannot connect to Google Play Console

- **Solution:** Verify `google-play-key.json` exists and has correct permissions
- **Check:** Service account has proper roles in Google Play Console

**Problem:** Version already exists

- **Solution:** Increment version code in `app.json`
- **Check:** Current versions with `fastlane android check_release_status`

**Problem:** Promotion fails

- **Solution:** Ensure version exists in source track (usually "internal")
- **Check:** Version codes match between tracks

### iOS Issues

**Problem:** Metadata upload fails

- **Solution:** Verify team ID and app identifier are correct
- **Check:** App exists in App Store Connect

**Problem:** Build fails

- **Solution:** Check EAS build logs
- **Check:** Credentials are properly configured

---

## 📚 Useful Resources

### Documentation

- [Fastlane Documentation](https://docs.fastlane.tools)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)

### Quick Links

- Google Play Console: https://play.google.com/console/developers
- App Store Connect: https://appstoreconnect.apple.com
- EAS Dashboard: https://expo.dev

### Key Files

- `fastlane/Fastfile` - Fastlane configuration
- `fastlane/metadata/` - Store metadata files
- `scripts/publish.js` - Automated publishing script
- `scripts/check-android-release.js` - Android status checker
- `app.json` - App configuration and version numbers
- `eas.json` - EAS build configuration

---

## 📝 Version History

### Version 1.0.1 (Current)

- **Status:** Under review (Android)
- **Deployed to:** All tracks (Production, Beta, Alpha, Internal)
- **Version Code:** 3
- **Changes:** Initial release cleanup, removed old 1.0.0 versions

### Version 1.0.0 (Superseded)

- **Status:** Superseded by 1.0.1
- **Version Code:** 1
- **Note:** Automatically deactivated when 1.0.1 was promoted

---

## ✅ Checklist for New Releases

### Before Building

- [ ] Update version numbers in `app.json`
- [ ] Update release notes in metadata files
- [ ] Test app thoroughly
- [ ] Update screenshots if UI changed
- [ ] Review metadata for accuracy

### After Building

- [ ] Verify build succeeded in EAS dashboard
- [ ] Submit to stores (or use automated script)
- [ ] Upload metadata updates if needed
- [ ] Monitor submission status

### After Submission

- [ ] Check review status regularly
- [ ] Respond to any review feedback
- [ ] Monitor crash reports and user feedback
- [ ] Prepare for next release

---

**Last Updated:** December 1, 2024
**Current Version:** 1.0.1
**Next Review:** After Google Play review completes



