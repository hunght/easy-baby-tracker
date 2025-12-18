#!/usr/bin/env node

/**
 * Unified script to automatically build and submit apps to stores
 * Supports Android (Google Play), iOS (App Store), or both platforms
 * 
 * Usage:
 *   node scripts/auto-publish.js                    # Both platforms, auto-increment version
 *   node scripts/auto-publish.js --android          # Android only
 *   node scripts/auto-publish.js --ios              # iOS only
 *   node scripts/auto-publish.js --no-increment     # Skip version increment
 *   node scripts/auto-publish.js --android --no-increment
 *   node scripts/auto-publish.js --help             # Show help
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const APP_JSON_PATH = path.join(ROOT_DIR, 'app.json');
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);

    const options = {
        android: false,
        ios: false,
        increment: true,
        help: false,
    };

    for (const arg of args) {
        switch (arg) {
            case '--android':
            case '-a':
                options.android = true;
                break;
            case '--ios':
            case '-i':
                options.ios = true;
                break;
            case '--no-increment':
            case '-n':
                options.increment = false;
                break;
            case '--help':
            case '-h':
                options.help = true;
                break;
            default:
                console.error(`Unknown option: ${arg}`);
                process.exit(1);
        }
    }

    // If neither platform specified, default to both
    if (!options.android && !options.ios && !options.help) {
        options.android = true;
        options.ios = true;
    }

    return options;
}

function showHelp() {
    console.log(`
📱 Auto-Publish Script
======================

Automatically builds and submits your app to app stores.

Usage:
  node scripts/auto-publish.js [options]

Options:
  --android, -a      Build and publish Android only
  --ios, -i          Build and publish iOS only
  --no-increment, -n Skip version number increment
  --help, -h         Show this help message

Examples:
  node scripts/auto-publish.js                    # Both platforms, increment version
  node scripts/auto-publish.js --android          # Android only, increment version
  node scripts/auto-publish.js --ios              # iOS only, increment version
  node scripts/auto-publish.js --no-increment     # Both platforms, keep current version
  node scripts/auto-publish.js -a -n              # Android only, keep current version

Note:
  - Builds are submitted to internal/TestFlight tracks
  - Uses EAS Build and EAS Submit
  - Requires authenticated EAS CLI
`);
}

function incrementVersion(version) {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || 0, 10) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
}

function incrementVersionCode(versionCode) {
    return parseInt(versionCode, 10) + 1;
}

function incrementBuildNumber(buildNumber) {
    return (parseInt(buildNumber, 10) + 1).toString();
}

function updateVersions(platforms) {
    console.log('📦 Updating version numbers...\n');

    // Read app.json
    const appJson = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf8'));
    const oldVersion = appJson.expo.version;
    const oldAndroidVersionCode = appJson.expo.android?.versionCode || 1;
    const oldIosBuildNumber = appJson.expo.ios?.buildNumber || '1';

    // Increment versions
    const newVersion = incrementVersion(oldVersion);
    const newAndroidVersionCode = incrementVersionCode(oldAndroidVersionCode);
    const newIosBuildNumber = incrementBuildNumber(oldIosBuildNumber);

    // Update app.json
    appJson.expo.version = newVersion;

    if (platforms.android && appJson.expo.android) {
        appJson.expo.android.versionCode = newAndroidVersionCode;
    }

    if (platforms.ios && appJson.expo.ios) {
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
    if (platforms.android) {
        console.log(`   Android Version Code: ${oldAndroidVersionCode} → ${newAndroidVersionCode}`);
    }
    if (platforms.ios) {
        console.log(`   iOS Build Number: ${oldIosBuildNumber} → ${newIosBuildNumber}`);
    }
    console.log('');

    return {
        newVersion,
        newAndroidVersionCode,
        newIosBuildNumber
    };
}

function getCurrentVersions() {
    const appJson = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf8'));
    return {
        newVersion: appJson.expo.version,
        newAndroidVersionCode: appJson.expo.android?.versionCode || 1,
        newIosBuildNumber: appJson.expo.ios?.buildNumber || '1',
    };
}

function buildPlatform(platform) {
    const emoji = platform === 'android' ? '🤖' : '🍎';
    const name = platform === 'android' ? 'Android' : 'iOS';

    console.log(`${emoji} Building ${name} app...\n`);
    try {
        execSync(`eas build --platform ${platform} --profile production --wait --non-interactive`, {
            stdio: 'inherit',
            cwd: ROOT_DIR,
        });
        console.log(`\n✅ ${name} build completed!\n`);
        return true;
    } catch (error) {
        console.error(`\n❌ ${name} build failed!\n`);
        console.error(error.message);
        return false;
    }
}

function submitPlatform(platform) {
    const name = platform === 'android' ? 'Android' : 'iOS';
    const store = platform === 'android' ? 'Google Play' : 'App Store';

    console.log(`📤 Submitting ${name} app to ${store}...\n`);
    try {
        execSync(`eas submit --platform ${platform} --profile production --latest --non-interactive`, {
            stdio: 'inherit',
            cwd: ROOT_DIR,
        });
        console.log(`\n✅ ${name} submission completed!\n`);
        return true;
    } catch (error) {
        console.error(`\n❌ ${name} submission failed!\n`);
        console.error(error.message);
        return false;
    }
}

async function main() {
    const options = parseArgs();

    if (options.help) {
        showHelp();
        process.exit(0);
    }

    const platforms = [];
    if (options.android) platforms.push('android');
    if (options.ios) platforms.push('ios');

    console.log('🚀 Starting automated publish process...\n');
    console.log(`📋 Configuration:`);
    console.log(`   Platforms: ${platforms.join(', ')}`);
    console.log(`   Increment version: ${options.increment ? 'Yes' : 'No'}\n`);

    // Update versions if needed
    let versions;
    if (options.increment) {
        versions = updateVersions({ android: options.android, ios: options.ios });
    } else {
        versions = getCurrentVersions();
        console.log('⏭️  Skipping version increment (using current version)\n');
        console.log(`   Version: ${versions.newVersion}`);
        if (options.android) console.log(`   Android Version Code: ${versions.newAndroidVersionCode}`);
        if (options.ios) console.log(`   iOS Build Number: ${versions.newIosBuildNumber}`);
        console.log('');
    }

    const results = {
        android: { build: null, submit: null },
        ios: { build: null, submit: null },
    };

    // Build and submit each platform
    for (const platform of platforms) {
        // Build
        const buildSuccess = buildPlatform(platform);
        results[platform].build = buildSuccess;

        if (!buildSuccess) {
            console.error(`❌ ${platform} build failed. Skipping submission for this platform.\n`);
            continue;
        }

        // Submit
        const submitSuccess = submitPlatform(platform);
        results[platform].submit = submitSuccess;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 PUBLISH SUMMARY');
    console.log('='.repeat(50) + '\n');
    console.log(`Version: ${versions.newVersion}\n`);

    let hasFailures = false;

    if (options.android) {
        const androidStatus = results.android.build && results.android.submit ? '✅' : '❌';
        console.log(`Android: ${androidStatus}`);
        console.log(`   Build: ${results.android.build ? '✅ Success' : '❌ Failed'}`);
        if (results.android.build) {
            console.log(`   Submit: ${results.android.submit ? '✅ Success' : '❌ Failed'}`);
        }
        if (!results.android.build || !results.android.submit) hasFailures = true;
    }

    if (options.ios) {
        const iosStatus = results.ios.build && results.ios.submit ? '✅' : '❌';
        console.log(`iOS: ${iosStatus}`);
        console.log(`   Build: ${results.ios.build ? '✅ Success' : '❌ Failed'}`);
        if (results.ios.build) {
            console.log(`   Submit: ${results.ios.submit ? '✅ Success' : '❌ Failed'}`);
        }
        if (!results.ios.build || !results.ios.submit) hasFailures = true;
    }

    console.log('\n' + '='.repeat(50) + '\n');

    if (hasFailures) {
        console.log('⚠️  Some operations failed. Check the logs above for details.\n');
        process.exit(1);
    } else {
        console.log('🎉 All operations completed successfully!\n');
        if (options.android) console.log('📱 Android: Published to Google Play internal track');
        if (options.ios) console.log('📱 iOS: Published to TestFlight');
        console.log('');
    }
}

// Run the script
main();
