# Build Commands Reference

## Core Tasks
```bash
./gradlew build                    # Build all modules
./gradlew clean build              # Clean build
./gradlew assemble                 # Without tests
```

## Module Builds
```bash
./gradlew :library:build           # KMP library
./gradlew :commons:build           # Shared UI
./gradlew :desktopApp:build        # Desktop app
```

## Desktop
```bash
./gradlew :desktopApp:run           # Run
./gradlew :desktopApp:packageDmg    # macOS
./gradlew :desktopApp:packageMsi    # Windows
./gradlew :desktopApp:packageDeb    # Linux
```

Output: `desktopApp/build/compose/binaries/main/{dmg,msi,deb}/`

## Android
```bash
./gradlew :app:assembleDebug        # Debug APK
./gradlew :app:assembleRelease      # Release APK
./gradlew :app:bundleRelease        # Release AAB
```

## Testing
```bash
./gradlew test                      # All tests
./gradlew :library:jvmTest          # JVM tests
```

## Diagnostics
```bash
./gradlew dependencies              # Full tree
./gradlew :module:dependencies       # Specific module
./gradlew dependencyInsight --dependency okhttp
./gradlew build --scan              # Online diagnostics
./gradlew build --profile           # Performance report
```

## Performance
```bash
./gradlew build --parallel --max-workers=8
./gradlew build --configuration-cache
./gradlew --stop                    # Stop daemon
```

## gradle.properties
```properties
org.gradle.daemon=true
org.gradle.jvmargs=-Xmx4g
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.configuration-cache=true
kotlin.incremental=true
```
