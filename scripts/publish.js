#!/usr/bin/env node

/**
 * Script to auto-increment version numbers and publish to both Android and iOS
 * Usage: node scripts/publish.js [--skip-build] [--skip-submit] [--android-only] [--ios-only]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const APP_JSON_PATH = path.join(ROOT_DIR, 'app.json');
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');

// Parse command line arguments
const args = process.argv.slice(2);
const skipBuild = args.includes('--skip-build');
const skipSubmit = args.includes('--skip-submit');
const androidOnly = args.includes('--android-only');
const iosOnly = args.includes('--ios-only');

function incrementVersion(version) {
  const parts = version.split('.');
  const patch = parseInt(parts[2] || 0, 10) + 1;
  return `${parts[0]}.${parts[1]}.${patch}`;
}

function incrementBuildNumber(buildNumber) {
  return (parseInt(buildNumber, 10) + 1).toString();
}

function incrementVersionCode(versionCode) {
  return parseInt(versionCode, 10) + 1;
}

function updateVersions() {
  console.log('📦 Updating version numbers...\n');

  // Read app.json
  const appJson = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf8'));
  const oldVersion = appJson.expo.version;
  const oldIosBuildNumber = appJson.expo.ios?.buildNumber || '1';
  const oldAndroidVersionCode = appJson.expo.android?.versionCode || 1;

  // Increment versions
  const newVersion = incrementVersion(oldVersion);
  const newIosBuildNumber = incrementBuildNumber(oldIosBuildNumber);
  const newAndroidVersionCode = incrementVersionCode(oldAndroidVersionCode);

  // Update app.json
  appJson.expo.version = newVersion;
  if (appJson.expo.ios) {
    appJson.expo.ios.buildNumber = newIosBuildNumber;
  }
  if (appJson.expo.android) {
    appJson.expo.android.versionCode = newAndroidVersionCode;
  }

  // Write app.json
  fs.writeFileSync(APP_JSON_PATH, JSON.stringify(appJson, null, 2) + '\n');

  // Update package.json version
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n');

  console.log('✅ Version numbers updated:');
  console.log(`   Version: ${oldVersion} → ${newVersion}`);
  console.log(`   iOS Build Number: ${oldIosBuildNumber} → ${newIosBuildNumber}`);
  console.log(`   Android Version Code: ${oldAndroidVersionCode} → ${newAndroidVersionCode}\n`);

  return { newVersion, newIosBuildNumber, newAndroidVersionCode };
}

function buildAndroid() {
  console.log('🤖 Building Android app...\n');
  try {
    execSync('eas build --platform android --profile production', {
      stdio: 'inherit',
      cwd: ROOT_DIR,
    });
    console.log('\n✅ Android build completed!\n');
    return true;
  } catch {
    console.error('\n❌ Android build failed!\n');
    return false;
  }
}

function buildIOS() {
  console.log('🍎 Building iOS app...\n');
  try {
    execSync('eas build --platform ios --profile production', {
      stdio: 'inherit',
      cwd: ROOT_DIR,
    });
    console.log('\n✅ iOS build completed!\n');
    return true;
  } catch {
    console.error('\n❌ iOS build failed!\n');
    return false;
  }
}

function submitAndroid() {
  console.log('📤 Submitting Android app to Google Play...\n');
  try {
    execSync('eas submit --platform android --profile production --latest', {
      stdio: 'inherit',
      cwd: ROOT_DIR,
    });
    console.log('\n✅ Android submission completed!\n');
    return true;
  } catch {
    console.error('\n❌ Android submission failed!\n');
    return false;
  }
}

function submitIOS() {
  console.log('📤 Submitting iOS app to App Store...\n');
  try {
    execSync('eas submit --platform ios --profile production --latest', {
      stdio: 'inherit',
      cwd: ROOT_DIR,
    });
    console.log('\n✅ iOS submission completed!\n');
    return true;
  } catch {
    console.error('\n❌ iOS submission failed!\n');
    return false;
  }
}

function main() {
  console.log('🚀 Starting publish process...\n');

  // Update versions
  const versions = updateVersions();

  if (skipBuild) {
    console.log('⏭️  Skipping build step (--skip-build flag)\n');
  } else {
    // Build apps
    let androidBuildSuccess = false;
    let iosBuildSuccess = false;

    if (!iosOnly) {
      androidBuildSuccess = buildAndroid();
    }

    if (!androidOnly) {
      iosBuildSuccess = buildIOS();
    }

    if ((androidOnly && !androidBuildSuccess) || (iosOnly && !iosBuildSuccess)) {
      console.error('❌ Build failed. Aborting submission.\n');
      process.exit(1);
    }

    if (!androidOnly && !iosOnly) {
      if (!androidBuildSuccess || !iosBuildSuccess) {
        console.error('❌ One or more builds failed. Aborting submission.\n');
        process.exit(1);
      }
    }
  }

  if (skipSubmit) {
    console.log('⏭️  Skipping submit step (--skip-submit flag)\n');
    console.log('✅ Publish process completed (builds only)!\n');
    return;
  }

  // Submit apps
  if (!iosOnly) {
    submitAndroid();
  }

  if (!androidOnly) {
    submitIOS();
  }

  console.log('✅ Publish process completed!\n');
  console.log(`📱 Version ${versions.newVersion} has been published to both stores.\n`);
}

// Run the script
main();

