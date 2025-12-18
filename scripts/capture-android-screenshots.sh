#!/bin/bash

# Android Screenshot Capture Script
# Runs Maestro flow and organizes screenshots for Fastlane
#
# DEVICE RESOLUTION REQUIREMENTS:
# Google Play Store phoneScreenshots require:
# - Minimum: 320px width
# - Maximum: 3840px width
# - Aspect ratio: Between 16:9 and 9:16 (portrait or landscape)
# - Recommended: 1080x1920 (Full HD portrait) or 1920x1080 (Full HD landscape)
#
# To ensure correct resolution:
# 1. Use an Android emulator or physical device with the target resolution
# 2. For Maestro, specify device with: maestro test --device <device-id> <flow-file>
# 3. List available devices: adb devices
# 4. Recommended emulator: Pixel 5 (1080x2340) or Pixel 6 (1080x2400)
#
# Fastlane automatically detects resolution from the screenshot files themselves.
# The resolution is determined by the device/emulator used during capture.

set -e # Exit on error

# Directory constants
MAESTRO_FLOW=".maestro/app-store-screenshots.yaml"
TARGET_DIR="fastlane/metadata/android/en-US/images/phoneScreenshots"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📸 Starting Android Screenshot Capture...${NC}"

# Ensure Maestro is installed
if ! command -v maestro &> /dev/null; then
    echo "Error: Maestro is not installed or not in PATH."
    echo "Visit https://maestro.mobile.dev/getting-started/installing-maestro"
    exit 1
fi

# Ensure ADB is installed
if ! command -v adb &> /dev/null; then
    echo -e "${RED}❌ Error: ADB is not installed or not in PATH.${NC}"
    echo "Install Android SDK Platform Tools: https://developer.android.com/studio/releases/platform-tools"
    exit 1
fi

# ADB Connection Diagnostics and Fix
echo -e "${BLUE}🔧 Checking ADB connection...${NC}"

# Aggressive cleanup to fix connection issues
echo -e "${BLUE}   Cleaning up connections...${NC}"

# Kill any stale Maestro processes that might be holding connections
pkill -9 maestro 2>/dev/null || true

# Kill all ADB processes
pkill -9 adb 2>/dev/null || true

# Kill ADB server
adb kill-server 2>/dev/null || true

# Wait for processes to fully terminate
sleep 2

# Start ADB server fresh
echo -e "${BLUE}   Starting fresh ADB server...${NC}"
adb start-server 2>/dev/null || true

# Wait for server to be ready
sleep 3

# Clear any existing port forwards (this helps with TCP forwarder issues)
DEVICE_SERIAL=$(adb devices | grep "device$" | head -1 | awk '{print $1}' || echo "")
if [ -n "$DEVICE_SERIAL" ]; then
    echo -e "${BLUE}   Clearing port forwards on device...${NC}"
    adb -s "$DEVICE_SERIAL" forward --remove-all 2>/dev/null || true
    sleep 1

    # Verify device is responsive
    echo -e "${BLUE}   Verifying device responsiveness...${NC}"
    if ! adb -s "$DEVICE_SERIAL" shell echo "test" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Device may not be fully ready, waiting...${NC}"
        sleep 2
    fi
fi

# Check for connected devices
DEVICE_COUNT=$(adb devices | grep -c "device$" || echo "0")
if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ Error: No Android device connected${NC}"
    echo -e "${YELLOW}   Troubleshooting steps:${NC}"
    echo -e "   1. Connect a device via USB or start an emulator"
    echo -e "   2. Enable USB debugging on the device"
    echo -e "   3. Check devices: ${GREEN}adb devices${NC}"
    echo -e "   4. If using emulator, ensure it's fully booted"
    echo ""
    echo -e "${BLUE}   Available devices:${NC}"
    adb devices
    exit 1
fi

echo -e "${GREEN}✓ Found ${DEVICE_COUNT} connected device(s)${NC}"
echo ""

# Ensure Target Directory Exists
echo -e "${BLUE}📂 Preparing target directory: $TARGET_DIR${NC}"
mkdir -p "$TARGET_DIR"

# Clean old screenshots
echo -e "${BLUE}🧹 Cleaning old screenshots...${NC}"
rm -f "$TARGET_DIR"/*.png

# Verify Maestro flow file exists
if [ ! -f "$MAESTRO_FLOW" ]; then
    echo -e "${RED}❌ Error: Maestro flow file not found: $MAESTRO_FLOW${NC}"
    exit 1
fi

# Run Maestro Flow
echo -e "${BLUE}🎬 Running Maestro flow: $MAESTRO_FLOW${NC}"

# Check if debug mode is requested (second argument)
DEBUG_MODE="${2:-}"
if [ "$DEBUG_MODE" = "--debug" ] || [ "$DEBUG_MODE" = "-d" ]; then
    echo -e "${YELLOW}🐛 Debug mode: Running Maestro with verbose output...${NC}"
    echo -e "${BLUE}   Command: ${GREEN}maestro test --debug $MAESTRO_FLOW${NC}"
    echo ""
    maestro test --debug "$MAESTRO_FLOW"
    MAESTRO_EXIT_CODE=$?
else
    maestro test "$MAESTRO_FLOW"
    MAESTRO_EXIT_CODE=$?
fi

if [ $MAESTRO_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}❌ Maestro test failed${NC}"
    echo ""
    echo -e "${YELLOW}   Troubleshooting steps:${NC}"
    echo -e "   1. Run maestro directly for debugging:"
    echo -e "      ${GREEN}maestro test --debug .maestro/app-store-screenshots.yaml${NC}"
    echo ""
    echo -e "   2. Check device connection:"
    echo -e "      ${GREEN}adb devices${NC}"
    echo ""
    echo -e "   3. Verify device is responsive:"
    echo -e "      ${GREEN}adb shell echo 'test'${NC}"
    echo ""
    echo -e "   4. Try restarting ADB:"
    echo -e "      ${GREEN}adb kill-server && adb start-server${NC}"
    echo ""
    echo -e "   5. Check for port conflicts:"
    echo -e "      ${GREEN}lsof -i :5037${NC}"
    echo ""
    echo -e "   6. If using emulator, ensure it's fully booted:"
    echo -e "      ${GREEN}adb wait-for-device && adb shell getprop sys.boot_completed${NC}"
    echo ""
    echo -e "   7. Try specifying device explicitly:"
    DEVICE_SERIAL=$(adb devices | grep "device$" | head -1 | awk '{print $1}' || echo "")
    if [ -n "$DEVICE_SERIAL" ]; then
        echo -e "      ${GREEN}maestro test --device $DEVICE_SERIAL .maestro/app-store-screenshots.yaml${NC}"
    fi
    exit 1
fi

# Move Screenshots
echo -e "${BLUE}📦 Moving screenshots to Fastlane folder...${NC}"

# Define expected screenshots based on yaml flow
declare -a SCREENSHOTS=("01-tracking.png" "02-settings.png" "03-easy.png" "04-habit.png")

for shot in "${SCREENSHOTS[@]}"; do
    if [ -f "$shot" ]; then
        mv "$shot" "$TARGET_DIR/"
        echo -e "${GREEN}✓ Moved $shot${NC}"
    else
        echo -e "${RED}⚠️ Warning: $shot not found${NC}"
    fi
done

# Verify screenshot resolutions
echo -e ""
echo -e "${BLUE}🔍 Verifying screenshot resolutions...${NC}"
for shot in "${SCREENSHOTS[@]}"; do
    if [ -f "$TARGET_DIR/$shot" ]; then
        # Get image dimensions (requires ImageMagick or sips on macOS)
        if command -v sips &> /dev/null; then
            # macOS
            DIMENSIONS=$(sips -g pixelWidth -g pixelHeight "$TARGET_DIR/$shot" 2>/dev/null | grep -E "pixelWidth|pixelHeight" | awk '{print $2}' | tr '\n' 'x' | sed 's/x$//')
            echo -e "${GREEN}✓ $shot: ${DIMENSIONS}px${NC}"
        elif command -v identify &> /dev/null; then
            # ImageMagick
            DIMENSIONS=$(identify -format "%wx%h" "$TARGET_DIR/$shot" 2>/dev/null)
            echo -e "${GREEN}✓ $shot: ${DIMENSIONS}px${NC}"
        else
            echo -e "${GREEN}✓ $shot${NC}"
        fi
    fi
done

echo -e ""
echo -e "${GREEN}✅ Capture Complete!${NC}"
echo -e "Screenshots are available in: ${BLUE}$TARGET_DIR${NC}"
echo -e ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "  1. Verify resolutions meet Google Play requirements (320-3840px width)"
echo -e "  2. Run: ${GREEN}fastlane android upload_screenshots${NC} to publish"
echo -e ""
