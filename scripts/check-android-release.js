#!/usr/bin/env node

/**
 * Script to check Android release status from Google Play Console
 * Usage: node scripts/check-android-release.js
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PACKAGE_NAME = 'com.hunght.BabyEase';

console.log('📱 Checking Android Release Status\n');
console.log('Package: ' + PACKAGE_NAME + '\n');

// Method 1: Use Fastlane
console.log('📋 Checking via Fastlane...\n');
try {
  execSync('fastlane android check_release_status', {
    stdio: 'inherit',
    cwd: ROOT_DIR,
  });
} catch {
  console.log('\n⚠️  Fastlane check encountered an issue\n');
  console.log('\n💡 For detailed status, visit:');
  console.log('   https://play.google.com/console/developers');
  console.log('   Navigate to: Release > Production\n');
}

