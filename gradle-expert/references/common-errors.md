# Common Build Errors & Solutions

## Compose Issues

### Version Mismatch
```
IllegalStateException: Version mismatch: Compose runtime 1.10.0 but compiler 1.9.0
```
**Fix:** Align Compose Multiplatform with Kotlin version.

### BOM Conflict
```
Duplicate class androidx.compose.ui.platform.AndroidCompositionLocalMap
```
**Fix:** Use Compose Multiplatform in KMP modules, AndroidX BOM only in Android modules.

## secp256k1 JNI Errors

### Wrong Variant (Desktop)
```
UnsatisfiedLinkError: no secp256k1jni in java.library.path
```
**Fix:** Ensure jvmMain uses `secp256k1-kmp-jni-jvm`, not jni-android.

### Version Mismatch
```
NoSuchMethodError: fr.acinq.secp256k1.Secp256k1.sign
```
**Fix:** All three variants (common, jni-android, jni-jvm) must share same version.

## Source Set Issues

### Undefined Source Set
```
Could not get unknown property 'jvmAndroid'
```
**Fix:** Define jvmAndroid BEFORE androidMain and jvmMain.

### JVM Lib in Common
```
Unresolved reference: ObjectMapper (Jackson)
```
**Fix:** Move to jvmAndroid source set (JVM-only libs can't be in commonMain).

## Proguard/R8 Issues

### Native Lib Stripped
```
NoClassDefFoundError: com.goterl.lazysodium.Sodium
```
**Fix:**
```proguard
-keep class fr.acinq.secp256k1.** { *; }
-keep class com.goterl.lazysodium.** { *; }
-keep class com.sun.jna.** { *; }
```

### Reflection Broken
```
InvalidDefinitionException: Cannot construct instance
```
**Fix:**
```proguard
-keepattributes *Annotation*, Signature
-keep class com.example.** { *; }
```

## Desktop Packaging

### Icon Not Found
```
Cannot find icon file: src/jvmMain/resources/icon.icns
```
**Fix:** Ensure icon file exists at specified path.

### Main Class Not Found
```
Could not find or load main class ...MainKt
```
**Fix:** Add `Kt` suffix for Kotlin main classes.

## Kotlin Compilation

### Expect/Actual Mismatch
```
'actual' declaration has no corresponding expected
```
**Fix:** Ensure signatures match exactly between expect and actual.

### JVM Version Mismatch
```
Unsupported class file major version 65
```
**Fix:** Use Java 21 everywhere.

## Dependency Resolution

### Repository Not Found
```
Could not find com.example:library:1.0.0
```
**Fix:** Add repository in settings.gradle.

### Variant Not Found
```
No matching variant of ... was found
```
**Fix:** Use `@aar` suffix for Android-specific artifacts.

## JVM Issues

### Wrong Java Version
```
Unsupported class file major version 65
```
**Fix:**
```bash
export JAVA_HOME=/path/to/jdk-21
./gradlew --stop
./gradlew build
```

## Quick Reference

| Error | Fix |
|-------|-----|
| `UnsatisfiedLinkError` | Check JNI variant by platform |
| `Version mismatch` (Compose) | Align Compose + Kotlin versions |
| `NoClassDefFoundError` | Add Proguard `-keep` rule |
| `Unresolved reference` | Move to correct source set |
| `Duplicate class` | Remove AndroidX BOM from KMP |
| `Unsupported class file` | Use Java 21 |
