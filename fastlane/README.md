## fastlane documentation

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios download_metadata

```sh
[bundle exec] fastlane ios download_metadata
```

Download metadata from App Store Connect

### ios upload_metadata

```sh
[bundle exec] fastlane ios upload_metadata
```

Upload metadata to App Store Connect

### ios download_screenshots

```sh
[bundle exec] fastlane ios download_screenshots
```

Download screenshots from App Store Connect

### ios upload_screenshots

```sh
[bundle exec] fastlane ios upload_screenshots
```

Upload screenshots to App Store Connect

---

## Android

### android download_metadata

```sh
[bundle exec] fastlane android download_metadata
```

Download metadata from Google Play Console

### android upload_metadata

```sh
[bundle exec] fastlane android upload_metadata
```

Upload metadata to Google Play Console

### android download_screenshots

```sh
[bundle exec] fastlane android download_screenshots
```

Download screenshots from Google Play Console

### android upload_screenshots

```sh
[bundle exec] fastlane android upload_screenshots
```

Upload screenshots to Google Play Console

### android check_release_status

```sh
[bundle exec] fastlane android check_release_status
```

Check Android release status and tracks

### android promote_to_production

```sh
[bundle exec] fastlane android promote_to_production
```

Promote version 1.0.2 (version code 4) from internal to production

### android promote_to_beta

```sh
[bundle exec] fastlane android promote_to_beta
```

Promote version 1.0.2 (version code 4) from internal to beta track

### android promote_to_alpha

```sh
[bundle exec] fastlane android promote_to_alpha
```

Promote version 1.0.2 (version code 4) from internal to alpha track

### android promote_to_testing_tracks

```sh
[bundle exec] fastlane android promote_to_testing_tracks
```

Promote version 1.0.2 to both Beta and Alpha tracks

### android promote_all_tracks

```sh
[bundle exec] fastlane android promote_all_tracks
```

Complete process: Promote 1.0.2 to all tracks (Production, Beta, Alpha)

---

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
