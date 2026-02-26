# Module Dependency Graph

## Hierarchy

```
┌─────────────┬─────────────┐
│ :app        │ :desktopApp │  ← Platform apps
│ (Android)   │    (JVM)    │
└──────┬──────┴──────┬──────┘
       │             │
       └──────┬──────┘
              ▼
       ┌─────────────┐
       │  :commons   │           ← Shared UI
       │  (KMP UI)   │
       └──────┬──────┘
              ▼
       ┌─────────────┐
       │  :library   │           ← Core library
       │(KMP Library)│
       └─────────────┘
```

## Source Sets

```
commonMain           # Cross-platform
    ├─ jvmAndroid    # Shared JVM (Android + Desktop)
    │   ├─ androidMain
    │   └─ jvmMain
    └─ iosMain       # iOS only
```

## Dependency Flow

**Desktop:** `:desktopApp → :commons (jvmMain) → :library (jvmMain → jvmAndroid → commonMain)`

**Android:** `:app → :commons (androidMain) → :library (androidMain → jvmAndroid → commonMain)`

## Key Patterns

### secp256k1 Variants
```kotlin
// commonMain
api(libs.secp256k1.kmp.common)

// androidMain
api(libs.secp256k1.kmp.jni.android)

// jvmMain
implementation(libs.secp256k1.kmp.jni.jvm)
```

### JNA Variants
```kotlin
// androidMain - AAR
implementation("net.java.dev.jna:jna:5.18.1@aar")

// jvmMain - JAR
implementation(libs.jna)
```

### API vs Implementation

- **`api`**: Types in public API, expect/actual declarations
- **`implementation`**: Internal details, not exposed to consumers

## Verify Dependencies
```bash
./gradlew :module:dependencies
./gradlew dependencyInsight --dependency secp256k1
```
