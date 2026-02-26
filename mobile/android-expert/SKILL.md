# android-expert

Android platform expertise for Kotlin Multiplatform projects. Covers Compose Navigation, Material3, permissions, lifecycle, and Android-specific patterns in KMP architecture.

## When to Use

Auto-invoke when working with:
- Android navigation (Navigation Compose, routes, bottom nav)
- Runtime permissions (camera, notifications, biometric)
- Platform APIs (Intent, Context, Activity)
- Material3 theming and edge-to-edge UI
- Android build configuration (Proguard, APK optimization)
- AndroidManifest.xml configuration
- Android lifecycle (ViewModel, collectAsStateWithLifecycle)

## Core Mental Model

**Single Activity Architecture + Compose Navigation**

```
MainActivity (Single Entry Point)
    ├── enableEdgeToEdge()
    ├── AppTheme { }
    └── NavHost
        ├── Route.Home → HomeScreen
        ├── Route.Profile(id) → ProfileScreen
        └── Route.Settings → SettingsScreen
```

**Key Principles:**
1. **Type-Safe Navigation** - @Serializable routes, no strings
2. **Declarative Permissions** - Request contextually with Accompanist
3. **Edge-to-Edge + Insets** - Scaffold handles system bars
4. **ViewModel + Flow → State** - Survive config changes
5. **Platform Isolation** - Android code in `app/` module or `androidMain/`

## 1. Type-Safe Navigation

### @Serializable Routes (Navigation 2.8.0+)

```kotlin
@Serializable
sealed class Route {
    @Serializable object Home : Route()
    @Serializable object Search : Route()
    @Serializable data class Profile(val pubkey: String) : Route()
    @Serializable data class Note(val noteId: String) : Route()
}

@Composable
fun AppNavigation(navController: NavHostController, accountViewModel: AccountViewModel) {
    NavHost(
        navController = navController,
        startDestination = Route.Home,
        enterTransition = { fadeIn(animationSpec = tween(200)) },
        exitTransition = { fadeOut(animationSpec = tween(200)) }
    ) {
        composable<Route.Home> { HomeScreen(accountViewModel, navController) }
        composable<Route.Profile> { backStackEntry ->
            val profile = backStackEntry.toRoute<Route.Profile>()
            ProfileScreen(profile.pubkey, accountViewModel, navController)
        }
    }
}
```

### Nav Wrapper

```kotlin
class Nav(val controller: NavHostController, val drawerState: DrawerState, val scope: CoroutineScope) {
    fun nav(route: Route) {
        scope.launch {
            controller.navigate(route)
            drawerState.close()
        }
    }
    fun popBack() = controller.popBackStack()
}
```

### Bottom Navigation

```kotlin
enum class BottomBarItem(val route: Route, val icon: ImageVector, val label: String) {
    HOME(Route.Home, Icons.Default.Home, "Home"),
    MESSAGES(Route.Messages, Icons.Default.Message, "Messages"),
    NOTIFICATIONS(Route.Notifications, Icons.Default.Notifications, "Notifications"),
    SEARCH(Route.Search, Icons.Default.Search, "Search"),
    PROFILE(Route.Profile, Icons.Default.Person, "Profile")
}

@Composable
fun AppBottomBar(selectedRoute: Route, nav: Nav) {
    NavigationBar {
        BottomBarItem.entries.forEach { item ->
            NavigationBarItem(
                selected = selectedRoute::class == item.route::class,
                onClick = { nav.nav(item.route) },
                icon = { Icon(item.icon, contentDescription = item.label) },
                label = { Text(item.label) }
            )
        }
    }
}
```

**Reference:** `references/android-navigation.md`

## 2. Runtime Permissions

### Accompanist Pattern

```kotlin
@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun CameraFeature() {
    val cameraPermissionState = rememberPermissionState(Manifest.permission.CAMERA)

    when {
        cameraPermissionState.status.isGranted -> CameraPreview()
        cameraPermissionState.status.shouldShowRationale -> {
            Column {
                Text("Camera permission is needed")
                Button(onClick = { cameraPermissionState.launchPermissionRequest() }) { Text("Grant") }
            }
        }
        else -> Button(onClick = { cameraPermissionState.launchPermissionRequest() }) { Text("Enable") }
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
        else -> PermissionRequestButton(onClick = { permissionsState.launchMultiplePermissionRequest() })
    }
}
```

### Lifecycle-Aware Requests

```kotlin
@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun NotificationRegistration() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        val permissionState = rememberPermissionState(Manifest.permission.POST_NOTIFICATIONS)
        
        if (permissionState.status.isGranted) {
            LifecycleResumeEffect(key1 = permissionState.status.isGranted) {
                // Register for push
                onPauseOrDispose { /* cleanup */ }
            }
        }
    }
}
```

### Common Permissions

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

**Reference:** `references/android-permissions.md`

## 3. Material3 + Edge-to-Edge

### MainActivity

```kotlin
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            AppTheme { AccountScreen() }
        }
    }
}
```

### Theme

```kotlin
@Composable
fun AppTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    val colorScheme = if (darkTheme) darkColorScheme(primary = Purple200) else lightColorScheme(primary = Purple500)
    MaterialTheme(colorScheme = colorScheme, typography = Typography, content = content)
}
```

### Scaffold with Insets

```kotlin
@Composable
fun MainScreen(navController: NavHostController) {
    Scaffold(
        topBar = { AppTopBar() },
        bottomBar = { AppBottomBar() }
    ) { innerPadding ->
        NavHost(navController, modifier = Modifier.padding(innerPadding)) { /* routes */ }
    }
}
```

### Custom Inset Handling

```kotlin
@Composable
fun CustomScreen() {
    Box(modifier = Modifier.fillMaxSize().systemBarsPadding()) { /* content */ }
}
```

## 4. ViewModel + Lifecycle

### ViewModel Pattern

```kotlin
class FeedViewModel(private val accountStateViewModel: AccountStateViewModel) : ViewModel() {
    private val _feedState = MutableStateFlow<FeedState>(FeedState.Loading)
    val feedState: StateFlow<FeedState> = _feedState.asStateFlow()

    init { loadFeed() }

    fun loadFeed() {
        viewModelScope.launch {
            _feedState.value = FeedState.Loading
            try {
                val posts = repository.getFeed()
                _feedState.value = FeedState.Success(posts)
            } catch (e: Exception) {
                _feedState.value = FeedState.Error(e.message)
            }
        }
    }
}

sealed class FeedState {
    object Loading : FeedState()
    data class Success(val posts: List<Post>) : FeedState()
    data class Error(val message: String?) : FeedState()
}
```

### Compose Integration

```kotlin
@Composable
fun FeedScreen(feedViewModel: FeedViewModel = viewModel()) {
    val feedState by feedViewModel.feedState.collectAsStateWithLifecycle()

    when (feedState) {
        is FeedState.Loading -> LoadingIndicator()
        is FeedState.Success -> LazyColumn {
            items((feedState as FeedState.Success).posts) { post -> PostCard(post) }
        }
        is FeedState.Error -> ErrorScreen(
            message = (feedState as FeedState.Error).message,
            onRetry = { feedViewModel.loadFeed() }
        )
    }
}
```

### Lifecycle Effects

```kotlin
@Composable
fun ChatScreen(chatViewModel: ChatViewModel) {
    LifecycleResumeEffect(key1 = chatViewModel) {
        chatViewModel.connectToRelay()
        onPauseOrDispose { chatViewModel.disconnectFromRelay() }
    }
}
```

## 5. Platform APIs

### LocalContext

```kotlin
@Composable
fun ShareButton(text: String) {
    val context = LocalContext.current
    Button(onClick = {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, text)
        }
        context.startActivity(Intent.createChooser(intent, "Share"))
    }) { Text("Share") }
}
```

### Get Activity

```kotlin
tailrec fun Context.getActivity(): ComponentActivity = when (this) {
    is ComponentActivity -> this
    is ContextWrapper -> baseContext.getActivity()
    else -> throw IllegalStateException("Context not an Activity")
}
```

### Intent Handling

```kotlin
@Composable
fun AppNavigation(navController: NavHostController, accountViewModel: AccountViewModel) {
    val activity = LocalContext.current as? Activity

    LaunchedEffect(activity?.intent) {
        activity?.intent?.let { intent ->
            when (intent.action) {
                Intent.ACTION_SEND -> {
                    val text = intent.getStringExtra(Intent.EXTRA_TEXT)
                    navController.navigate(Route.NewPost(message = text))
                }
                Intent.ACTION_VIEW -> intent.data?.let { uri ->
                    when (uri.scheme) {
                        "app" -> handleDeepLink(uri, navController)
                    }
                }
            }
        }
    }
    NavHost(navController) { /* routes */ }
}
```

### FileProvider

```xml
<provider
    android:name="androidx.core.content.FileProvider"
    android:authorities="${applicationId}.provider"
    android:exported="false"
    android:grantUriPermissions="true">
    <meta-data android:name="android.support.FILE_PROVIDER_PATHS" android:resource="@xml/file_paths" />
</provider>
```

### Activity Results

```kotlin
@Composable
fun ExternalSigner() {
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            // Handle result
        }
    }

    Button(onClick = {
        launcher.launch(Intent(Intent.ACTION_VIEW).apply { data = Uri.parse("externalapp:action") })
    }) { Text("Open External App") }
}
```

## 6. Build Configuration

```gradle
android {
    namespace = 'com.example.yourapp'
    compileSdk = 36

    defaultConfig {
        applicationId = "com.example.yourapp"
        minSdk = 26
        targetSdk = 36
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }

    buildFeatures { compose = true }
}

kotlin { compilerOptions { jvmTarget = JvmTarget.JVM_21 } }

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.navigation.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)
    implementation(libs.accompanist.permissions)
}
```

**Reference:** `references/proguard-rules.md` and `scripts/analyze-apk-size.sh`

## 7. KMP Android Source Sets

### Platform-Specific Code

```kotlin
// androidMain/kotlin/Platform.android.kt
actual fun openExternalUrl(url: String, context: Any) {
    val ctx = context as Context
    ctx.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
}

actual fun shareText(text: String, context: Any) {
    val ctx = context as Context
    ctx.startActivity(Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_TEXT, text)
    })
}
```

## Common Patterns

### Single Activity

```kotlin
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            AppTheme { MainScreen() }
        }
    }
}
```

### ViewModel Survives Config Changes

```kotlin
@Composable
fun ProfileScreen(profileViewModel: ProfileViewModel = viewModel()) {
    val profile by profileViewModel.profile.collectAsStateWithLifecycle()
    ProfileContent(profile)
}
```

### Resource Access

```kotlin
@Composable
fun LocalizedButton() {
    val context = LocalContext.current
    Button(onClick = {
        Toast.makeText(context, context.getString(R.string.clicked), Toast.LENGTH_SHORT).show()
    }) { Text(stringResource(R.string.label)) }
}
```

## Anti-Patterns

1. **String-based navigation** - Use type-safe @Serializable routes
2. **Requesting permissions eagerly** - Request contextually before feature use
3. **Ignoring edge-to-edge** - Handle insets properly with Scaffold
4. **Using GlobalScope** - Use viewModelScope or rememberCoroutineScope
5. **Not handling config changes** - Use ViewModel + collectAsStateWithLifecycle
6. **Hardcoded system bar heights** - Use WindowInsets APIs
7. **Blocking main thread** - Use viewModelScope.launch(Dispatchers.IO)

## Quick Reference

| Task | Pattern |
|------|---------|
| **Navigate** | `navController.navigate(Route.Profile(id))` |
| **Request Permission** | `rememberPermissionState().launchPermissionRequest()` |
| **Access Context** | `LocalContext.current` |
| **Get Activity** | `context.getActivity()` |
| **Open URL** | `Intent(ACTION_VIEW, Uri.parse(url))` |
| **Share Text** | `Intent(ACTION_SEND).putExtra(EXTRA_TEXT, text)` |
| **Observe Flow** | `flow.collectAsStateWithLifecycle()` |
| **Lifecycle Effect** | `LifecycleResumeEffect { }` |
| **Handle Insets** | `Modifier.systemBarsPadding()` |
| **Theme** | `MaterialTheme(colorScheme = ...) { }` |

## Additional Resources

- `references/android-navigation.md`
- `references/android-permissions.md`
- `references/proguard-rules.md`
- `scripts/analyze-apk-size.sh`

## When NOT to Use

- Desktop features → Use `desktop-expert`
- iOS features → Use `ios-expert`
- Shared KMP code → Use `kotlin-multiplatform`
- Compose UI → Use `kotlin-ui`
