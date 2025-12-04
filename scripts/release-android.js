#!/usr/bin/env node

/**
 * Automated Android Release Script
 *
 * This script:
 * 1. Increments the version number (patch version by default)
 * 2. Updates app.json and package.json
 * 3. Builds the Android app with EAS
 * 4. Submits to Google Play Internal Testing
 * 5. Promotes to Production track using fastlane
 * 6. Updates metadata and changelog
 *
 * Usage:
 *   node scripts/release-android.js [--major|--minor|--patch] [--skip-build] [--skip-promote]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bright}[${step}]${colors.reset} ${colors.cyan}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
  log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
  } catch (error) {
    if (!options.allowFailure) {
      logError(`Command failed: ${command}`);
      throw error;
    }
    return null;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const versionType = args.find(arg => ['--major', '--minor', '--patch'].includes(arg))?.replace('--', '') || 'patch';
const skipBuild = args.includes('--skip-build');
const skipPromote = args.includes('--skip-promote');
const skipSubmit = args.includes('--skip-submit');
const autoPromote = args.includes('--auto-promote');

// Paths
const rootDir = path.join(__dirname, '..');
const appJsonPath = path.join(rootDir, 'app.json');
const packageJsonPath = path.join(rootDir, 'package.json');

/**
 * Increment version number
 */
function incrementVersion(version, type = 'patch') {
  const parts = version.split('.').map(Number);

  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
    default:
      parts[2]++;
      break;
  }

  return parts.join('.');
}

/**
 * Update version in app.json and package.json
 */
function updateVersionFiles() {
  logStep('1/6', 'Updating version numbers...');

  // Read app.json
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const currentVersion = appJson.expo.version;
  const currentVersionCode = appJson.expo.android.versionCode;
  const currentBuildNumber = appJson.expo.ios.buildNumber;

  // Calculate new version
  const newVersion = incrementVersion(currentVersion, versionType);
  const newVersionCode = currentVersionCode + 1;
  const newBuildNumber = String(parseInt(currentBuildNumber) + 1);

  log(`  Current version: ${currentVersion} (code: ${currentVersionCode})`);
  log(`  New version: ${colors.green}${newVersion}${colors.reset} (code: ${colors.green}${newVersionCode}${colors.reset})`);

  // Update app.json
  appJson.expo.version = newVersion;
  appJson.expo.android.versionCode = newVersionCode;
  appJson.expo.ios.buildNumber = newBuildNumber;
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

  // Update package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

  logSuccess(`Updated to version ${newVersion} (code ${newVersionCode})`);

  return { newVersion, newVersionCode, currentVersion, currentVersionCode };
}

/**
 * Create changelog for the new version
 */
function createChangelog(versionCode, version) {
  logStep('2/6', 'Creating changelog...');

  const changelogDir = path.join(rootDir, 'fastlane/metadata/android/en-US/changelogs');
  const changelogPath = path.join(changelogDir, `${versionCode}.txt`);

  // Check if changelog already exists
  if (fs.existsSync(changelogPath)) {
    logWarning(`Changelog already exists for version code ${versionCode}`);
    log(`  Edit it at: ${changelogPath}`);
    return;
  }

  // Create changelog directory if it doesn't exist
  if (!fs.existsSync(changelogDir)) {
    fs.mkdirSync(changelogDir, { recursive: true });
  }

  // Create default changelog
  const changelog = `Bug fixes and improvements in version ${version}:
• Enhanced app stability and performance
• UI/UX improvements
• Fixed minor issues

Thank you for using Easy Baby Tracker!
`;

  fs.writeFileSync(changelogPath, changelog);
  logSuccess(`Created changelog for version ${version} (${versionCode})`);
  log(`  Edit changelog at: ${changelogPath}`);
}

/**
 * Build app with EAS
 */
function buildWithEAS() {
  logStep('3/6', 'Building Android app with EAS...');

  log('  Building production AAB...');
  exec('eas build --platform android --profile production --non-interactive', {
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  logSuccess('Build completed successfully');
}

/**
 * Submit to Google Play Internal Testing
 */
function submitToPlayStore() {
  logStep('4/6', 'Submitting to Google Play Internal Testing...');

  log('  Submitting latest build...');
  exec('eas submit --platform android --profile production --non-interactive --latest', {
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  logSuccess('Submitted to Internal Testing track');
}

/**
 * Wait for user confirmation before promoting
 */
function waitForConfirmation() {
  if (autoPromote) {
    log('  Auto-promote enabled, skipping confirmation...');
    return true;
  }

  logWarning('The build has been submitted to Internal Testing.');
  log('  Please wait a few minutes for Google Play to process the build.');
  log('  You can verify the build in Play Console > Release > Internal testing');
  log('');
  log('  Do you want to promote to Production now? (y/n)');

  // In a real script, you'd use readline or similar for interactive input
  // For automation, we'll just proceed if auto-promote is set
  return false;
}

/**
 * Promote to production with fastlane
 */
function promoteToProduction(versionCode) {
  logStep('5/6', 'Promoting to Production track with fastlane...');

  log('  Promoting from Internal to Production...');
  exec('fastlane android promote_to_production', {
    cwd: rootDir,
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  logSuccess('Promoted to Production track');
}

/**
 * Update metadata with fastlane
 */
function updateMetadata(versionCode) {
  logStep('6/6', 'Updating store metadata...');

  log('  Uploading metadata and changelog...');
  exec(`fastlane android upload_metadata version_code:${versionCode}`, {
    cwd: rootDir,
    env: { ...process.env, FORCE_COLOR: '1' },
    allowFailure: true, // Changelog might not be available immediately
  });

  logSuccess('Metadata updated');
}

/**
 * Check release status
 */
function checkReleaseStatus() {
  log('\n' + colors.bright + '═'.repeat(60) + colors.reset);
  log(colors.bright + '  Checking release status...' + colors.reset);
  log(colors.bright + '═'.repeat(60) + colors.reset + '\n');

  exec('fastlane android check_release_status', {
    cwd: rootDir,
    env: { ...process.env, FORCE_COLOR: '1' }
  });
}

/**
 * Main execution
 */
async function main() {
  try {
    log('\n' + colors.bright + colors.blue + '🚀 Android Release Automation Script' + colors.reset);
    log(colors.bright + '═'.repeat(60) + colors.reset);

    // Step 1: Update version
    const { newVersion, newVersionCode, currentVersion } = updateVersionFiles();

    // Step 2: Create changelog
    createChangelog(newVersionCode, newVersion);

    // Step 3: Build with EAS
    if (!skipBuild) {
      buildWithEAS();
    } else {
      logWarning('Skipping build (--skip-build flag)');
    }

    // Step 4: Submit to Play Store
    if (!skipBuild && !skipSubmit) {
      submitToPlayStore();
    } else {
      logWarning('Skipping submit (--skip-submit flag or --skip-build flag)');
    }

    // Step 5: Promote to Production
    if (!skipPromote) {
      if (skipBuild || autoPromote) {
        // Wait a bit for Google Play to process
        if (!skipBuild) {
          log('\n  Waiting 30 seconds for Google Play to process the build...');
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
        promoteToProduction(newVersionCode);
      } else {
        logWarning('Skipping promotion - use --auto-promote to automatically promote');
        log('  Run manually: fastlane android promote_to_production');
      }
    } else {
      logWarning('Skipping promotion (--skip-promote flag)');
    }

    // Step 6: Update metadata (optional, as it's done during promotion)
    if (!skipPromote && !skipBuild) {
      // Wait a bit more after promotion
      log('\n  Waiting 10 seconds before updating metadata...');
      await new Promise(resolve => setTimeout(resolve, 10000));

      updateMetadata(newVersionCode);
    }

    // Final status check
    checkReleaseStatus();

    // Success summary
    log('\n' + colors.bright + colors.green + '═'.repeat(60) + colors.reset);
    log(colors.bright + colors.green + '  ✅ Release process completed successfully!' + colors.reset);
    log(colors.bright + colors.green + '═'.repeat(60) + colors.reset);
    log('');
    log(`  Version: ${colors.green}${currentVersion}${colors.reset} → ${colors.green}${newVersion}${colors.reset}`);
    log(`  Version Code: ${colors.green}${newVersionCode}${colors.reset}`);
    log('');
    log('  Next steps:');
    log('  1. Check Play Console: https://play.google.com/console/developers');
    log('  2. Monitor the review status (usually 1-3 days)');
    log('  3. Respond to any review feedback if needed');
    log('');

    if (skipPromote || (!autoPromote && skipBuild)) {
      logWarning('To promote to production manually, run:');
      log(`  ${colors.cyan}fastlane android promote_to_production${colors.reset}`);
      log('');
    }

  } catch (error) {
    logError('Release process failed');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();

