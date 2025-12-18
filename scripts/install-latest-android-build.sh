#!/bin/bash

# Install Latest Android Build from EAS
# Downloads and installs the latest Android build for screenshot capture
#
# NOTE: Google Play Console releases are different from EAS builds:
# - Google Play Console: AAB/APK files that were submitted (can't download directly)
# - EAS Builds: Original build artifacts you can download
# This script downloads from EAS, not from Google Play Console

set -e # Exit on error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
# Usage: 
#   ./install-latest-android-build.sh [preview|production]  # Download from EAS
#   ./install-latest-android-build.sh /path/to/app.apk      # Install local APK
BUILD_PROFILE_OR_PATH="${1:-preview}"  # Can be profile name or path to APK
PACKAGE_NAME="com.hunght.BabyEase"

# Check if argument is a file path
if [ -f "$BUILD_PROFILE_OR_PATH" ]; then
    # It's a local APK file
    APK_PATH="$BUILD_PROFILE_OR_PATH"
    echo -e "${BLUE}📱 Installing Local APK${NC}"
    echo -e "${BLUE}   File: ${APK_PATH}${NC}"
    echo -e ""
    
    # Skip EAS checks and go straight to installation
    SKIP_EAS=true
else
    # It's a build profile
    BUILD_PROFILE="$BUILD_PROFILE_OR_PATH"
    APK_PATH=""
    SKIP_EAS=false
    echo -e "${BLUE}📱 Installing Latest Android Build from EAS${NC}"
    echo -e "${BLUE}   Profile: ${BUILD_PROFILE}${NC}"
    echo -e ""
    echo -e "${YELLOW}ℹ️  Note: This downloads from EAS Build service${NC}"
    echo -e "${YELLOW}   If you see a release in Google Play Console, that's the submitted version${NC}"
    echo -e "${YELLOW}   For screenshots, we need the installable APK from EAS${NC}"
    echo -e "${YELLOW}   Or use: ${GREEN}./install-latest-android-build.sh /path/to/app.apk${NC}"
    echo -e ""
fi

# Only check EAS if we're not using a local APK
if [ "$SKIP_EAS" = false ]; then
    # Ensure EAS CLI is installed
    if ! command -v eas &> /dev/null; then
        echo -e "${RED}❌ Error: EAS CLI is not installed${NC}"
        echo -e "   Install with: ${GREEN}npm install -g eas-cli${NC}"
        echo -e "   Then login: ${GREEN}eas login${NC}"
        exit 1
    fi

    # Check if logged in
    if ! eas whoami &> /dev/null; then
        echo -e "${RED}❌ Error: Not logged in to EAS${NC}"
        echo -e "   Login with: ${GREEN}eas login${NC}"
        exit 1
    fi
fi

# Check if device is connected
DEVICE_COUNT=$(adb devices | grep -c "device$" || echo "0")
if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ Error: No Android device connected${NC}"
    echo -e "   Connect a device and enable USB debugging"
    echo -e "   Check devices: ${GREEN}adb devices${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found ${DEVICE_COUNT} connected device(s)${NC}"
echo -e ""

# Download from EAS if not using local APK
if [ "$SKIP_EAS" = false ]; then
    # For production builds, warn about AAB format
    if [ "$BUILD_PROFILE" = "production" ]; then
        echo -e "${YELLOW}⚠️  Production builds are AAB format (not directly installable)${NC}"
        echo -e "${YELLOW}   For screenshots, we'll use preview profile which generates APK${NC}"
        BUILD_PROFILE="preview"
    fi

    echo -e "${BLUE}📦 Step 1: Finding latest ${BUILD_PROFILE} build...${NC}"

    # Get the latest build ID
    BUILD_ID=$(eas build:list --platform android --profile "$BUILD_PROFILE" --limit 1 --json 2>/dev/null | \
        grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [ -z "$BUILD_ID" ]; then
        echo -e "${YELLOW}⚠️  No existing ${BUILD_PROFILE} build found${NC}"
        echo -e "${BLUE}   Would you like to build a new one? (y/n)${NC}"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}   Building new ${BUILD_PROFILE} build... (this may take 10-20 minutes)${NC}"
            eas build --platform android --profile "$BUILD_PROFILE" --wait
            
            # Get the build ID after building
            BUILD_ID=$(eas build:list --platform android --profile "$BUILD_PROFILE" --limit 1 --json 2>/dev/null | \
                grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
            
            if [ -z "$BUILD_ID" ]; then
                echo -e "${RED}❌ Build completed but could not get build ID${NC}"
                exit 1
            fi
        else
            echo -e "${YELLOW}   Exiting. Build a new one with: ${GREEN}eas build --platform android --profile ${BUILD_PROFILE}${NC}"
            exit 0
        fi
    else
        echo -e "${GREEN}✓ Found existing build${NC}"
    fi

    echo -e "${BLUE}   Build ID: ${BUILD_ID}${NC}"
    echo -e ""

    echo -e "${BLUE}📲 Step 2: Downloading and installing...${NC}"

    # Create temp directory for download
    TEMP_DIR=$(mktemp -d)
    APK_PATH="$TEMP_DIR/app.apk"

    # Try to download using EAS CLI
    echo -e "${BLUE}   Downloading build...${NC}"
    if eas build:download --id "$BUILD_ID" --output "$APK_PATH" 2>/dev/null; then
        echo -e "${GREEN}✓ Download complete${NC}"
    else
        echo -e "${YELLOW}⚠️  Automatic download failed${NC}"
        echo -e "${YELLOW}   Please download manually:${NC}"
        echo -e "${BLUE}   1. Visit: https://expo.dev${NC}"
        echo -e "${BLUE}   2. Go to your project > Builds${NC}"
        echo -e "${BLUE}   3. Download the latest Android ${BUILD_PROFILE} build${NC}"
        echo -e "${BLUE}   4. Install with: ${GREEN}./install-latest-android-build.sh <downloaded-file>.apk${NC}"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
else
    # Using local APK, skip download step
    echo -e "${BLUE}📲 Installing local APK...${NC}"
    TEMP_DIR=""  # No temp directory needed
fi

# Uninstall existing app if it exists
if adb shell pm list packages | grep -q "$PACKAGE_NAME"; then
    echo -e "${BLUE}   Uninstalling existing app...${NC}"
    adb uninstall "$PACKAGE_NAME" 2>/dev/null || true
fi

# Install the APK
echo -e "${BLUE}   Installing on device...${NC}"
if adb install "$APK_PATH"; then
    echo -e "${GREEN}✓ Installation successful!${NC}"
else
    echo -e "${RED}❌ Installation failed${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Cleanup temp directory if we created one
if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
fi

echo -e ""
echo -e "${GREEN}✅ Build installed successfully!${NC}"
echo -e ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "  1. Update Maestro flow: ${GREEN}appId: com.hunght.BabyEase${NC}"
echo -e "  2. Run: ${GREEN}./scripts/capture-android-screenshots.sh${NC}"
echo -e ""
echo -e "${BLUE}💡 Alternative: Use local build (faster)${NC}"
echo -e "  ${GREEN}npx expo run:android${NC}"
