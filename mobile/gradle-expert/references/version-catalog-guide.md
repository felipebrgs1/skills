# Version Catalog Guide

## Structure
```toml
[versions]     # Version numbers
[libraries]    # Dependencies
[plugins]      # Gradle plugins
```

## Basic Pattern
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
    implementation(libs.okhttp)
}
```

## BOMs (Bill of Materials)
```toml
[versions]
composeBom = "2024.02.00"

[libraries]
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
```

```kotlin
val composeBom = platform(libs.androidx.compose.bom)
implementation(composeBom)
implementation(libs.androidx.ui)
```

## Platform Variants

### secp256k1
```toml
[versions]
secp256k1 = "0.15.0"

[libraries]
secp256k1-kmp-common = { group = "fr.acinq.secp256k1", name = "secp256k1-kmp", version.ref = "secp256k1" }
secp256k1-kmp-jni-android = { group = "fr.acinq.secp256k1", name = "secp256k1-kmp-jni-android", version.ref = "secp256k1" }
secp256k1-kmp-jni-jvm = { group = "fr.acinq.secp256k1", name = "secp256k1-kmp-jni-jvm", version.ref = "secp256k1" }
```

**Critical:** All three variants MUST share same version.

## Plugins
```toml
[versions]
kotlin = "2.0.0"

[plugins]
kotlinMultiplatform = { id = "org.jetbrains.kotlin.multiplatform", version.ref = "kotlin" }
kotlinAndroid = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
```

## Critical Alignments

- **Kotlin ecosystem:** All Kotlin plugins must share same version
- **Compose:** Compose Multiplatform must match Kotlin (check compatibility matrix)
- **AGP:** Dictates minimum Gradle version

## Troubleshooting

**Unresolved reference: libs** → Upgrade Gradle to 7.0+

**Library not found** → Check repository in settings.gradle

**Version conflict:**
```kotlin
configurations.all {
    resolutionStrategy { force(libs.okhttp.get().toString()) }
}
```

## Best Practices

1. Never hardcode versions in build.gradle.kts
2. Use BOMs for related libraries (Compose, AndroidX)
3. Document special cases (JNA @aar)
4. Test after version updates
