# Android Runtime Permissions

Complete permission handling patterns using Accompanist Permissions library.

## Permission Categories

### Normal Permissions (Auto-granted)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### Dangerous Permissions (Runtime Request)

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

## Accompanist Permissions

### Setup

```gradle
dependencies {
    implementation("com.google.accompanist:accompanist-permissions:0.36.0")
}
```

### Single Permission

```kotlin
@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun CameraFeature() {
    val permissionState = rememberPermissionState(Manifest.permission.CAMERA)

    when {
        permissionState.status.isGranted -> CameraPreview()
        permissionState.status.shouldShowRationale -> {
            Column(Modifier.fillMaxSize().padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Camera needed for QR scanning", style = MaterialTheme.typography.bodyLarge, textAlign = TextAlign.Center)
                Spacer(16.dp)
                Button(onClick = { permissionState.launchPermissionRequest() }) { Text("Grant") }
            }
        }
        else -> Button(onClick = { permissionState.launchPermissionRequest() }) { Text("Enable") }
    }
}
```

### Multiple Permissions

```kotlin
@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun MediaUploadFeature() {
    val permissionsState = rememberMultiplePermissionsState(
        listOf(Manifest.permission.CAMERA, Manifest.permission.READ_EXTERNAL_STORAGE)
    )

    when {
        permissionsState.allPermissionsGranted -> MediaUploadUI()
        permissionsState.shouldShowRationale -> RationaleDialog(
            onConfirm = { permissionsState.launchMultiplePermissionRequest() }
        )
        else -> Button(onClick = { permissionsState.launchMultiplePermissionRequest() }) { Text("Request") }
    }
}

@Composable
fun RationaleDialog(title: String = "Permissions Required", message: String, onConfirm: () -> Unit, onDismiss: () -> Unit) {
    AlertDialog(onDismissRequest = onDismiss, title = { Text(title) }, text = { Text(message) },
        confirmButton = { TextButton(onClick = onConfirm) { Text("Continue") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } })
}
```

### Lifecycle-Aware Requests

```kotlin
@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun NotificationRegistration() {
    val context = LocalContext.current
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        val permissionState = rememberPermissionState(Manifest.permission.POST_NOTIFICATIONS)

        if (permissionState.status.isGranted) {
            LifecycleResumeEffect(key1 = permissionState.status.isGranted) {
                val scope = rememberCoroutineScope()
                scope.launch(Dispatchers.IO) { /* register for push */ }
                onPauseOrDispose { }
            }
        } else {
            NotificationPrompt(onEnableClick = { permissionState.launchPermissionRequest() })
        }
    }
}

@Composable
fun NotificationPrompt(onEnableClick: () -> Unit) {
    Card(Modifier.fillMaxWidth().padding(16.dp)) {
        Column(Modifier.padding(16.dp)) {
            Icon(Icons.Default.Notifications, null, Modifier.size(48.dp))
            Text("Enable Notifications", style = MaterialTheme.typography.titleMedium)
            Text("Get notified about updates", style = MaterialTheme.typography.bodyMedium)
            Button(onClick = onEnableClick, Modifier.fillMaxWidth()) { Text("Enable") }
        }
    }
}
```

## Best Practices

### 1. Request Contextually

```kotlin
@Composable
fun QRScannerButton() {
    val permissionState = rememberPermissionState(Manifest.permission.CAMERA)
    Button(onClick = {
        if (permissionState.status.isGranted) openScanner()
        else permissionState.launchPermissionRequest()
    }) { Text("Scan QR") }
}
```

### 2. Show Rationale

```kotlin
@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun LocationFeature() {
    val permissionState = rememberPermissionState(Manifest.permission.ACCESS_COARSE_LOCATION)
    if (!permissionState.status.isGranted) {
        Card {
            Column(Modifier.padding(16.dp)) {
                Text("Location needed for local content", style = MaterialTheme.typography.bodyMedium)
                Row {
                    OutlinedButton(onClick = { }) { Text("Skip") }
                    Spacer(8.dp)
                    Button(onClick = { permissionState.launchPermissionRequest() }) { Text("Enable") }
                }
            }
        }
    } else LocationMap()
}
```

### 3. Handle Permanent Denial

```kotlin
@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun CameraWithSettings() {
    val context = LocalContext.current
    val permissionState = rememberPermissionState(Manifest.permission.CAMERA)

    when {
        permissionState.status.isGranted -> CameraPreview()
        permissionState.status.shouldShowRationale -> RationaleDialog(onConfirm = { permissionState.launchPermissionRequest() })
        else -> AlertDialog(
            onDismissRequest = { },
            title = { Text("Permission Denied") },
            text = { Text("Enable in Settings") },
            confirmButton = { TextButton(onClick = {
                context.startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.fromParts("package", context.packageName, null)
                })
            }) { Text("Open Settings") } }
        )
    }
}
```

### 4. Version-Specific Permissions

```kotlin
@Composable
fun StoragePermission() {
    val permissions = remember {
        buildList {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                add(Manifest.permission.READ_MEDIA_IMAGES)
            } else if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.S_V2) {
                add(Manifest.permission.READ_EXTERNAL_STORAGE)
            }
        }
    }

    if (permissions.isNotEmpty()) {
        val state = rememberMultiplePermissionsState(permissions)
        if (!state.allPermissionsGranted) Button(onClick = { state.launchMultiplePermissionRequest() }) { Text("Request") }
    }
}
```

## Manual Permission Check

```kotlin
fun hasCameraPermission(context: Context): Boolean =
    ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED

fun requestCameraPermission(activity: ComponentActivity) {
    ActivityCompat.requestPermissions(activity, arrayOf(Manifest.permission.CAMERA), REQUEST_CAMERA)
}
```

## Testing

```kotlin
@get:Rule val permissionRule = GrantPermissionRule.grant(Manifest.permission.CAMERA)

@Test fun testCameraWithPermission() {
    composeTestRule.setContent { CameraFeature() }
    composeTestRule.onNodeWithText("Camera").assertExists()
}
```

## File Locations

- `app/src/main/AndroidManifest.xml`
- `app/build.gradle`
