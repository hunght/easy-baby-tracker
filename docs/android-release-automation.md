# Android Release Automation

This document explains how to use the automated Android release script to build, submit, and promote your app to Google Play.

## Overview

The `release-android.js` script automates the entire Android release workflow:

1. ✅ **Auto-increment version** (major, minor, or patch)
2. ✅ **Update** `app.json` and `package.json`
3. ✅ **Create changelog** for the new version
4. ✅ **Build** Android AAB with EAS
5. ✅ **Submit** to Google Play Internal Testing
6. ✅ **Promote** to Production track with fastlane
7. ✅ **Update** store metadata and changelog

## Quick Start

### Full Automatic Release (Recommended)

Build, submit, and promote to production automatically:

```bash
npm run release:android:auto
```

This will:

- Increment patch version (1.0.2 → 1.0.3)
- Build and submit to Internal Testing
- Wait 30 seconds for processing
- Automatically promote to Production
- Update store metadata

### Semi-Automatic Release (Safer)

Build and submit, but manually promote:

```bash
npm run release:android
```

This will:

- Increment version
- Build and submit to Internal Testing
- **Stop** and wait for you to manually promote

Then promote when ready:

```bash
npm run release:android:promote-only
```

## Available Commands

### Basic Commands

```bash
# Patch version increment (1.0.2 → 1.0.3)
npm run release:android
npm run release:android:patch

# Minor version increment (1.0.2 → 1.1.0)
npm run release:android:minor

# Major version increment (1.0.2 → 2.0.0)
npm run release:android:major
```

### Advanced Commands

```bash
# Full automatic release (build + promote)
npm run release:android:auto

# Build only (no promotion)
npm run release:android:build-only

# Promote only (no build)
npm run release:android:promote-only
```

### Manual Script Invocation

You can also run the script directly with custom flags:

```bash
# Full auto release
node scripts/release-android.js --auto-promote

# Build only
node scripts/release-android.js --skip-promote

# Promote existing build
node scripts/release-android.js --skip-build --auto-promote

# Skip submit but build
node scripts/release-android.js --skip-submit

# Custom version type
node scripts/release-android.js --minor --auto-promote
```

## Script Flags

| Flag             | Description                         |
| ---------------- | ----------------------------------- |
| `--patch`        | Increment patch version (default)   |
| `--minor`        | Increment minor version             |
| `--major`        | Increment major version             |
| `--auto-promote` | Automatically promote to production |
| `--skip-build`   | Skip EAS build step                 |
| `--skip-submit`  | Skip submission to Play Store       |
| `--skip-promote` | Skip promotion to production        |

## Workflow Examples

### Example 1: Emergency Bug Fix

Quick patch release with full automation:

```bash
npm run release:android:auto
```

**Timeline**: ~15-20 minutes

- 5 min: Version bump + EAS build
- 30 sec: Wait for processing
- 1 min: Promote to production
- Result: Version in production, pending Google review

### Example 2: New Feature Release

Minor version with manual verification:

```bash
# Step 1: Build and submit
npm run release:android:minor

# Step 2: Test in Internal Testing (verify the build works)
# ... test the app ...

# Step 3: Promote to production when ready
npm run release:android:promote-only
```

**Timeline**: Your pace

- Build and test at your own pace
- Promote when confident

### Example 3: Rebuild Without Version Change

If build failed and you want to rebuild:

```bash
# Build with current version (manually adjust version back first)
npm run release:android:build-only
```

### Example 4: Pre-built Binary

If you already built with EAS separately:

```bash
# Just promote existing build
npm run release:android:promote-only
```

## What the Script Does

### Step 1: Version Increment

Reads current version from `app.json`:

```json
{
  "expo": {
    "version": "1.0.2",
    "android": {
      "versionCode": 4
    },
    "ios": {
      "buildNumber": "4"
    }
  }
}
```

Increments based on type:

- **Patch**: `1.0.2` → `1.0.3` (versionCode 4 → 5)
- **Minor**: `1.0.2` → `1.1.0` (versionCode 4 → 5)
- **Major**: `1.0.2` → `2.0.0` (versionCode 4 → 5)

Updates both `app.json` and `package.json`.

### Step 2: Changelog Creation

Creates: `fastlane/metadata/android/en-US/changelogs/{versionCode}.txt`

Default template:

```
Bug fixes and improvements in version {version}:
• Enhanced app stability and performance
• UI/UX improvements
• Fixed minor issues

Thank you for using Easy Baby Tracker!
```

**💡 Tip**: Edit the changelog before the build completes!

### Step 3: EAS Build

Runs:

```bash
eas build --platform android --profile production --non-interactive
```

Builds production AAB using your EAS configuration.

### Step 4: Submit to Internal Testing

Runs:

```bash
eas submit --platform android --profile production --non-interactive --latest
```

Submits to Internal Testing track as configured in `eas.json`.

### Step 5: Promote to Production

Runs:

```bash
fastlane android promote_to_production
```

Promotes from Internal → Production track with changelog.

### Step 6: Verify Status

Runs:

```bash
fastlane android check_release_status
```

Shows current status across all tracks.

## Customizing the Script

### Change Default Version Type

Edit `scripts/release-android.js`:

```javascript
// Change this line:
const versionType =
  args.find((arg) => ['--major', '--minor', '--patch'].includes(arg))?.replace('--', '') || 'patch';

// To:
const versionType =
  args.find((arg) => ['--major', '--minor', '--patch'].includes(arg))?.replace('--', '') || 'minor';
```

### Customize Changelog Template

Edit `scripts/release-android.js`, find the `createChangelog` function:

```javascript
const changelog = `Your custom template here...`;
```

### Add Pre/Post Build Hooks

Add custom logic before or after build steps:

```javascript
// Before build
function preBuildHook() {
  // Run tests
  exec('npm test');
  // Lint code
  exec('npm run lint');
}

// After build
function postBuildHook() {
  // Send notification
  exec('curl -X POST ...');
}
```

## Fastlane Integration

The script uses these fastlane lanes:

```ruby
# Promote to production
fastlane android promote_to_production

# Promote to all tracks
fastlane android promote_all_tracks

# Check status
fastlane android check_release_status

# Upload metadata only
fastlane android upload_metadata version_code:5
```

## Troubleshooting

### Issue: "Cannot find release for version code"

**Problem**: Google Play hasn't processed the build yet.

**Solution**:

```bash
# Wait longer before promoting
node scripts/release-android.js --skip-build --auto-promote
```

### Issue: Build fails

**Problem**: EAS build error.

**Solution**:

1. Check EAS dashboard for error details
2. Fix the issue
3. Manually decrement version in `app.json`
4. Run script again

### Issue: Promotion fails

**Problem**: Fastlane can't promote.

**Solution**:

1. Manually promote in Play Console
2. Or check `google-play-key.json` permissions

### Issue: Wrong version number

**Problem**: Need to change version manually.

**Solution**:

1. Edit `app.json` and `package.json` manually
2. Run with `--skip-build` if needed

## Best Practices

### 1. Use Semantic Versioning

- **Patch** (1.0.X): Bug fixes, minor changes
- **Minor** (1.X.0): New features, non-breaking changes
- **Major** (X.0.0): Breaking changes, major updates

### 2. Test Before Auto-Promote

For important releases:

```bash
# Build and test first
npm run release:android:build-only

# Promote after testing
npm run release:android:promote-only
```

### 3. Customize Changelog

Always edit the auto-generated changelog before promotion:

```bash
# Edit this file:
nano fastlane/metadata/android/en-US/changelogs/{versionCode}.txt
```

### 4. Keep Track of Releases

Check status after release:

```bash
fastlane android check_release_status
```

### 5. Monitor Google Play Console

After promotion:

- Check review status
- Monitor crash reports
- Review user feedback

## Complete Release Workflow

### Standard Release Process

```bash
# 1. Ensure you're on main branch
git checkout main
git pull

# 2. Make sure everything is committed
git status

# 3. Run the release script (patch version)
npm run release:android:auto

# 4. Monitor the process
# ... script runs automatically ...

# 5. Verify in Play Console
# Visit: https://play.google.com/console/developers

# 6. Commit version changes
git add app.json package.json
git commit -m "chore: bump version to X.X.X"
git push

# 7. Create git tag
git tag -a vX.X.X -m "Release vX.X.X"
git push --tags
```

### Hotfix Release Process

```bash
# 1. Create hotfix branch
git checkout -b hotfix/bug-fix

# 2. Fix the bug
# ... make changes ...

# 3. Commit changes
git add .
git commit -m "fix: critical bug"

# 4. Merge to main
git checkout main
git merge hotfix/bug-fix

# 5. Quick release
npm run release:android:auto

# 6. Push changes
git push
```

## Environment Requirements

Ensure you have:

- ✅ Node.js installed
- ✅ EAS CLI installed (`npm install -g eas-cli`)
- ✅ Fastlane installed
- ✅ Google Play Service Account key (`google-play-key.json`)
- ✅ EAS account configured
- ✅ Logged into EAS (`eas login`)

## Support

If you encounter issues:

1. Check the error messages in the script output
2. Verify EAS dashboard: https://expo.dev
3. Check Play Console: https://play.google.com/console/developers
4. Review fastlane logs in the terminal

## Related Documentation

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Fastlane Supply Documentation](https://docs.fastlane.tools/actions/supply/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)

---

**Last Updated**: Version 1.0.2 - Dec 3, 2025
