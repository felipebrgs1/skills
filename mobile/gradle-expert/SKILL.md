---
name: gradle-expert
description: Build optimization, dependency resolution, and multi-module KMP troubleshooting. Use when working with: (1) Gradle build files, (2) Version catalog (libs.versions.toml), (3) Build errors and dependency conflicts, (4) Module dependencies and source sets, (5) Desktop packaging, (6) Build performance.
---

# Gradle Expert

Build system expertise for Kotlin Multiplatform projects. Focus: practical troubleshooting, dependency resolution, and optimization.

## Module Architecture

```
┌─────────────┬─────────────┐
│ :app        │ :desktopApp │  ← Platform apps
│ (Android)   │    (JVM)    │
└──────┬──────┴──────┬──────┘
       │             │
       └──────┬──────┘
              ▼
       ┌─────────────┐
       │  :commons   │           ← Shared UI (KMP)
       │  (KMP UI)   │
       └──────┬──────┘
              ▼
       ┌─────────────┐
       │  :library   │           ← Core library (KMP)
       │(KMP Library)│
       └─────────────┘
```

**Key insight:** Dependencies flow DOWN. Lower modules never depend on upper.

## Version Catalog

All dependencies in `gradle/libs.versions.toml`:

```toml
[versions]
kotlin = "2.0.0"

[libraries]
okhttp = { group = "com.squareup.okhttp3", name = "okhttp", version.ref = "okhttp" }

[plugins]
kotlinMultiplatform = { id = "org.jetbrains.kotlin.multiplatform", version.ref = "kotlin" }
```

**Usage:**
```kotlin
dependencies {
    implementation(libs.okhttp)  // Type-safe
}
```

**Critical alignments:**
- Kotlin plugins must share same version
- Compose Multiplatform version must match Kotlin (check compatibility matrix)
- secp256k1 variants (common, jni-android, jni-jvm) must share same version

## Quick Commands

```bash
# Full builds
./gradlew build
./gradlew clean build

# Desktop
./gradlew :desktopApp:run
./gradlew :desktopApp:packageDmg

# Module-specific
./gradlew :library:build
./gradlew :commons:build

# Diagnostics
./gradlew dependencies
./gradlew build --scan
./gradlew build --profile
```

## Source Set Hierarchy

```
commonMain           # Cross-platform code
    │
    ├─ jvmAndroid    # JVM-specific, shared by Android + Desktop
    │   ├─ androidMain
    │   └─ jvmMain
    │
    └─ iosMain       # iOS-specific
```

## Critical Dependencies

### secp256k1 (Crypto)

```kotlin
// commonMain
api(libs.secp256k1.kmp.common)

// androidMain
api(libs.secp256k1.kmp.jni.android)

// jvmMain
implementation(libs.secp256k1.kmp.jni.jvm)
```

**Error:** `UnsatisfiedLinkError: no secp256k1jni` → Wrong variant for platform

### JNA (LibSodium)

```kotlin
// androidMain
implementation("net.java.dev.jna:jna:5.18.1@aar")

// jvmMain
implementation(libs.jna)
```

**Never put in jvmAndroid or commonMain** - platform-specific packaging only.

### Compose Versions

```toml
composeMultiplatform = "1.7.0"
kotlin = "2.0.0"
```

**Rule:** Compose Multiplatform must match Kotlin version compatibility.

**KMP modules use Compose Multiplatform:**
```kotlin
implementation(compose.ui)
implementation(compose.material3)
```

**Android-only modules can use AndroidX BOM:**
```kotlin
val composeBom = platform(libs.androidx.compose.bom)
implementation(composeBom)
```

## Desktop Packaging

```kotlin
// desktopApp/build.gradle.kts
nativeDistributions {
    targetFormats(TargetFormat.Dmg, TargetFormat.Msi, TargetFormat.Deb)
    packageName = "AppName"
    macOS { bundleID = "com.example.app.desktop" }
}
```

**Package tasks:**
```bash
./gradlew :desktopApp:packageDmg   # macOS
./gradlew :desktopApp:packageMsi   # Windows
./gradlew :desktopApp:packageDeb   # Linux
```

## Build Performance

**gradle.properties:**
```properties
org.gradle.daemon=true
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g
org.gradle.parallel=true
org.gradle.workers.max=8
org.gradle.caching=true
org.gradle.configuration-cache=true
kotlin.incremental=true
```

**Impact:** 30-50% faster builds after first run.

**When to clean:**
- After changing version catalog
- After adding/removing source sets
- When seeing unexplained errors

## Troubleshooting

### Version Conflict
**Symptom:** `Duplicate class` or `NoSuchMethodError`

**Fix:**
```bash
./gradlew dependencyInsight --dependency <library-name>
```

### Source Set Issues
**Symptom:** `Unresolved reference` to JVM library in shared code

**Fix:** Move to jvmAndroid or platform-specific source set.

```kotlin
// ❌ Wrong - JVM-only in commonMain
commonMain { implementation(libs.jackson) }

// ✅ Correct - JVM-only in jvmAndroid
val jvmAndroid = create("jvmAndroid") {
    dependsOn(commonMain.get())
    api(libs.jackson)
}
```

### Wrong JVM Target
**Symptom:** `Unsupported class file major version 65`

**Fix:** Ensure Java 21 everywhere:
```kotlin
kotlin { jvm { compilerOptions { jvmTarget.set(JvmTarget.JVM_21) } } }
android { compileOptions { sourceCompatibility = VERSION_21; targetCompatibility = VERSION_21 } }
```

### Compose Compiler Mismatch
**Symptom:** `IllegalStateException: Version mismatch`

**Fix:** Align Compose Multiplatform with Kotlin version.

## Quick Reference

| Task | Command |
|------|---------|
| Build all | `./gradlew build` |
| Desktop run | `./gradlew :desktopApp:run` |
| Android APK | `./gradlew :app:assembleDebug` |
| Dependencies | `./gradlew dependencies` |
| Build scan | `./gradlew build --scan` |
| Profile | `./gradlew build --profile` |
| Stop daemon | `./gradlew --stop` |

## References

- `references/build-commands.md`
- `references/dependency-graph.md`
- `references/version-catalog-guide.md`
- `references/common-errors.md`
- `scripts/analyze-build-time.sh`
- `scripts/fix-dependency-conflicts.sh`

## When NOT to Use

- Source set architecture (expect/actual) → Use `kotlin-multiplatform`
- Compose UI issues → Use `kotlin-ui`
- Kotlin language issues → Use `kotlin-core`
- Desktop-specific features → Use `desktop-expert`
- Android-specific features → Use `android-expert`
