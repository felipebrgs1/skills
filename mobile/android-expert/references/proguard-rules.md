# Proguard/R8 Rules

R8 shrinks, obfuscates, and optimizes Android APK code.

## Enable R8

```gradle
android {
    buildTypes {
        release {
            minifyEnabled = true
            shrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

## Essential Rules

### Kotlin Metadata

```proguard
-keep class kotlin.Metadata { *; }
-keep class kotlin.** { *; }
-dontwarn kotlin.**

-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
```

### Serialization

```proguard
-keep,includedescriptorclasses class com.example.**$$serializer { *; }
-keepclassmembers class com.example.** { *** Companion; }
-keepclasseswithmembers class com.example.** { kotlinx.serialization.KSerializer serializer(...); }

-keep @kotlinx.serialization.Serializable class * { *; }
```

### Data Classes

```proguard
-keep class com.example.yourapp.model.** { *; }
```

### Compose

```proguard
-keep class androidx.compose.** { *; }
-dontwarn androidx.compose.**

-keep class * implements java.io.Serializable { *; }
-keepclassmembers class * implements java.io.Serializable {
    !static !transient <fields>;
}
```

### OkHttp/Retrofit

```proguard
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

-keepattributes Signature, Exceptions
-keep class retrofit2.** { *; }
```

### ViewModels

```proguard
-keep class * extends androidx.lifecycle.ViewModel { <init>(); }
-keep class * extends androidx.lifecycle.ViewModelProvider$Factory { <init>(...); }
```

### Enums

```proguard
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}
```

### Parcelable

```proguard
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}
```

### Native Libraries

```proguard
-keepclasseswithmembernames class * { native <methods>; }
```

## Remove Logging

```proguard
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
```

## Debugging Issues

### Mapping File

R8 outputs to `app/build/outputs/mapping/release/`:
- `mapping.txt` - Obfuscation mappings
- `seeds.txt` - Classes kept by rules
- `usage.txt` - Code removed

### Common Issues

**NoSuchMethodException:**
```proguard
-keep class com.example.YourClass { public <methods>; }
```

**Serialization fails:**
```proguard
-keep @kotlinx.serialization.Serializable class * { *; }
```

**Navigation crashes:**
```proguard
-keep @kotlinx.serialization.Serializable class com.example.ui.navigation.routes.** { *; }
```

## File Locations

- `app/proguard-rules.pro`
- `app/build.gradle`
- `app/build/outputs/mapping/release/`
