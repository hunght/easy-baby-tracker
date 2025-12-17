#!/usr/bin/env node

/**
 * Script to automatically build and submit iOS without any user input
 * Waits for build to complete, then auto-submits to App Store
 * Usage: node scripts/auto-publish-ios.js
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

function incrementBuildNumber(buildNumber) {
  return (parseInt(buildNumber, 10) + 1).toString();
}

function updateVersions() {
  console.log('📦 Updating version numbers...\n');

  // Read app.json
  const appJson = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf8'));
  const oldVersion = appJson.expo.version;
  const oldIosBuildNumber = appJson.expo.ios?.buildNumber || '1';

  // Increment versions
  const newVersion = incrementVersion(oldVersion);
  const newIosBuildNumber = incrementBuildNumber(oldIosBuildNumber);

  // Update app.json
  appJson.expo.version = newVersion;
  if (appJson.expo.ios) {
    appJson.expo.ios.buildNumber = newIosBuildNumber;
  }

  // Write app.json
  fs.writeFileSync(APP_JSON_PATH, JSON.stringify(appJson, null, 2) + '\n');

  // Update package.json version
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n');

  console.log('✅ Version numbers updated:');
  console.log(`   Version: ${oldVersion} → ${newVersion}`);
  console.log(`   iOS Build Number: ${oldIosBuildNumber} → ${newIosBuildNumber}\n`);

  return { newVersion, newIosBuildNumber };
}

function buildIOS() {
  console.log('🍎 Building iOS app...\n');
  try {
    // Build with --wait flag to ensure it completes before moving on
    // --non-interactive prevents prompts
    execSync('eas build --platform ios --profile production --wait --non-interactive', {
      stdio: 'inherit',
      cwd: ROOT_DIR,
    });
    console.log('\n✅ iOS build completed!\n');
    return true;
  } catch (error) {
    console.error('\n❌ iOS build failed!\n');
    console.error(error.message);
    return false;
  }
}

function submitIOS() {
  console.log('📤 Submitting iOS app to App Store...\n');
  try {
    // Use --latest to automatically use the most recent build
    // --non-interactive prevents prompts (uses cached Apple credentials)
    execSync('eas submit --platform ios --profile production --latest --non-interactive', {
      stdio: 'inherit',
      cwd: ROOT_DIR,
    });
    console.log('\n✅ iOS submission completed!\n');
    return true;
  } catch (error) {
    console.error('\n❌ iOS submission failed!\n');
    console.error(error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Starting automated iOS publish process...\n');

  // Update versions
  const versions = updateVersions();

  // Build iOS (waits for completion)
  const buildSuccess = buildIOS();

  if (!buildSuccess) {
    console.error('❌ Build failed. Aborting submission.\n');
    process.exit(1);
  }

  // Submit to App Store (automatic after build completes)
  const submitSuccess = submitIOS();

  if (!submitSuccess) {
    console.error('❌ Submission failed.\n');
    process.exit(1);
  }

  console.log('✅ Automated iOS publish completed!\n');
  console.log(`📱 Version ${versions.newVersion} has been published to TestFlight.\n`);
}

// Run the script
main();
