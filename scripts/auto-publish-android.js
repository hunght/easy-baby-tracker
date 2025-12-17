#!/usr/bin/env node

/**
 * Script to automatically build and submit Android without any user input
 * Waits for build to complete, then auto-submits to Google Play
 * Usage: node scripts/auto-publish-android.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const APP_JSON_PATH = path.join(ROOT_DIR, 'app.json');
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');

function incrementVersion(version) {
  const parts = version.split('.');
  const patch = parseInt(parts[2] || 0, 10) + 1;
  return `${parts[0]}.${parts[1]}.${patch}`;
}

function incrementVersionCode(versionCode) {
  return parseInt(versionCode, 10) + 1;
}

function updateVersions() {
  console.log('📦 Updating version numbers...\n');

  // Read app.json
  const appJson = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf8'));
  const oldVersion = appJson.expo.version;
  const oldAndroidVersionCode = appJson.expo.android?.versionCode || 1;

  // Increment versions
  const newVersion = incrementVersion(oldVersion);
  const newAndroidVersionCode = incrementVersionCode(oldAndroidVersionCode);

  // Update app.json
  appJson.expo.version = newVersion;
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
  console.log(`   Android Version Code: ${oldAndroidVersionCode} → ${newAndroidVersionCode}\n`);

  return { newVersion, newAndroidVersionCode };
}

function buildAndroid() {
  console.log('🤖 Building Android app...\n');
  try {
    // Build with --wait flag to ensure it completes before moving on
    // --non-interactive prevents prompts
    execSync('eas build --platform android --profile production --wait --non-interactive', {
      stdio: 'inherit',
      cwd: ROOT_DIR,
    });
    console.log('\n✅ Android build completed!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Android build failed!\n');
    console.error(error.message);
    return false;
  }
}

function submitAndroid() {
  console.log('📤 Submitting Android app to Google Play...\n');
  try {
    // Use --latest to automatically use the most recent build
    // --non-interactive prevents prompts
    execSync('eas submit --platform android --profile production --latest --non-interactive', {
      stdio: 'inherit',
      cwd: ROOT_DIR,
    });
    console.log('\n✅ Android submission completed!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Android submission failed!\n');
    console.error(error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Starting automated Android publish process...\n');

  // Update versions
  const versions = updateVersions();

  // Build Android (waits for completion)
  const buildSuccess = buildAndroid();

  if (!buildSuccess) {
    console.error('❌ Build failed. Aborting submission.\n');
    process.exit(1);
  }

  // Submit to Google Play (automatic after build completes)
  const submitSuccess = submitAndroid();

  if (!submitSuccess) {
    console.error('❌ Submission failed.\n');
    process.exit(1);
  }

  console.log('✅ Automated Android publish completed!\n');
  console.log(`📱 Version ${versions.newVersion} has been published to Google Play internal track.\n`);
}

// Run the script
main();
