#!/bin/bash

# Fastlane Metadata Sync Script
# This script syncs metadata between local files and app stores

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if bundle is installed
if ! command -v bundle &> /dev/null; then
    print_error "Bundler is not installed. Please install it first:"
    echo "  gem install bundler"
    exit 1
fi

# Check if dependencies are installed
if [ ! -f "Gemfile.lock" ]; then
    print_warning "Fastlane dependencies not installed. Installing now..."
    bundle install
fi

# Parse command line arguments
ACTION="${1:-sync}"
PLATFORM="${2:-all}"

print_info "Starting metadata sync: ${ACTION} for ${PLATFORM}"

# Function to sync iOS metadata
sync_ios() {
    local action=$1
    case $action in
        download)
            print_info "Downloading iOS metadata from App Store Connect..."
            bundle exec fastlane ios download_metadata
            print_success "iOS metadata downloaded"
            ;;
        upload)
            print_info "Uploading iOS metadata to App Store Connect..."
            bundle exec fastlane ios upload_metadata
            print_success "iOS metadata uploaded"
            ;;
        sync)
            print_info "Syncing iOS metadata (download -> upload)..."
            bundle exec fastlane ios download_metadata
            print_success "iOS metadata downloaded"
            print_info "Review the metadata files, then run with 'upload' to push changes"
            ;;
        *)
            print_error "Unknown action: $action"
            exit 1
            ;;
    esac
}

# Function to sync Android metadata
sync_android() {
    local action=$1
    case $action in
        download)
            print_info "Downloading Android metadata from Google Play Console..."
            bundle exec fastlane android download_metadata
            print_success "Android metadata downloaded"
            ;;
        upload)
            print_info "Uploading Android metadata to Google Play Console..."
            bundle exec fastlane android upload_metadata
            print_success "Android metadata uploaded"
            ;;
        sync)
            print_info "Syncing Android metadata (download -> upload)..."
            bundle exec fastlane android download_metadata
            print_success "Android metadata downloaded"
            print_info "Review the metadata files, then run with 'upload' to push changes"
            ;;
        *)
            print_error "Unknown action: $action"
            exit 1
            ;;
    esac
}

# Main execution
case $PLATFORM in
    ios)
        sync_ios $ACTION
        ;;
    android)
        sync_android $ACTION
        ;;
    all)
        if [ "$ACTION" = "download" ] || [ "$ACTION" = "sync" ]; then
            sync_ios download
            sync_android download
            if [ "$ACTION" = "sync" ]; then
                print_info "Review the metadata files, then run with 'upload' to push changes"
            fi
        elif [ "$ACTION" = "upload" ]; then
            sync_ios upload
            sync_android upload
        else
            print_error "Unknown action: $ACTION"
            print_info "Usage: $0 [download|upload|sync] [ios|android|all]"
            exit 1
        fi
        ;;
    *)
        print_error "Unknown platform: $PLATFORM"
        print_info "Usage: $0 [download|upload|sync] [ios|android|all]"
        exit 1
        ;;
esac

print_success "Metadata sync completed!"

