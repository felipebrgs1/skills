# Android Navigation Patterns

Complete navigation implementation patterns using Navigation Compose with type safety.

## Type-Safe Routes (Navigation 2.8.0+)

### Route Definitions

```kotlin
@Serializable
sealed class Route {
    @Serializable object Home : Route()
    @Serializable object Messages : Route()
    @Serializable object Video : Route()
    @Serializable object Discover : Route()
    @Serializable object Notification : Route()

    @Serializable data class Profile(val pubkey: String) : Route()
    @Serializable data class Note(val id: String) : Route()
    @Serializable data class Channel(val id: String) : Route()
    @Serializable data class Thread(val id: String, val replyTo: String? = null) : Route()
    @Serializable data class NewPost(val message: String? = null, val attachment: String? = null, val replyTo: String? = null) : Route()
    @Serializable data class Search(val query: String = "") : Route()

    @Serializable object Settings : Route()
    @Serializable object Security : Route()
    @Serializable object Relays : Route()
}
```

## NavHost Configuration

```kotlin
@Composable
fun AppNavigation(navController: NavHostController, accountViewModel: AccountViewModel, drawerState: DrawerState) {
    val scope = rememberCoroutineScope()
    val nav = remember { Nav(navController, drawerState, scope) }

    NavHost(
        navController = navController,
        startDestination = Route.Home,
        enterTransition = { fadeIn(animationSpec = tween(200)) },
        exitTransition = { fadeOut(animationSpec = tween(200)) }
    ) {
        composable<Route.Home> { HomeScreen(accountViewModel, nav) }
        composable<Route.Profile> { backStackEntry ->
            val profile = backStackEntry.toRoute<Route.Profile>()
            ProfileScreen(profile.pubkey, accountViewModel, nav)
        }
        composable<Route.Note> { backStackEntry ->
            val note = backStackEntry.toRoute<Route.Note>()
            NoteScreen(note.id, accountViewModel, nav)
        }
        composable<Route.NewPost> { backStackEntry ->
            val newPost = backStackEntry.toRoute<Route.NewPost>()
            NewPostScreen(newPost.message, newPost.attachment, newPost.replyTo, accountViewModel) { nav.popBack() }
        }
    }
}
```

### Custom Transitions

```kotlin
composable<Route.Profile>(
    enterTransition = { slideIntoContainer(AnimatedContentTransitionScope.SlideDirection.Start, tween(300)) },
    exitTransition = { slideOutOfContainer(AnimatedContentTransitionScope.SlideDirection.Start, tween(300)) },
    popEnterTransition = { slideIntoContainer(AnimatedContentTransitionScope.SlideDirection.End, tween(300)) },
    popExitTransition = { slideOutOfContainer(AnimatedContentTransitionScope.SlideDirection.End, tween(300)) }
) { backStackEntry ->
    val profile = backStackEntry.toRoute<Route.Profile>()
    ProfileScreen(profile.pubkey, accountViewModel, nav)
}
```

## Navigation Manager

```kotlin
class Nav(val controller: NavHostController, val drawerState: DrawerState, val scope: CoroutineScope) {
    fun nav(route: Route) {
        scope.launch {
            if (!controller.popBackStack(route, inclusive = false)) {
                controller.navigate(route) { launchSingleTop = true }
            }
            drawerState.close()
        }
    }

    fun newStack(route: Route) {
        scope.launch {
            controller.navigate(route) { popUpTo(Route.Home) { inclusive = false }; launchSingleTop = true }
            drawerState.close()
        }
    }

    fun popBack() = controller.popBackStack()
    inline fun <reified T : Route> popUpTo(inclusive: Boolean = false) = controller.popBackStack<T>(inclusive = inclusive)
    fun currentRoute(): Route? = controller.currentBackStackEntry?.toRoute<Route>()
}
```

## Bottom Navigation

```kotlin
@Composable
fun AppBottomBar(currentRoute: Route?, nav: Nav) {
    NavigationBar {
        BottomBarRoute.entries.forEach { item ->
            NavigationBarItem(
                selected = currentRoute?.let { it::class == item.route::class } ?: false,
                onClick = { nav.nav(item.route) },
                icon = { Icon(if (currentRoute?.let { it::class == item.route::class } == true) item.selectedIcon else item.unselectedIcon, item.label) },
                label = { Text(item.label) },
                alwaysShowLabel = false
            )
        }
    }
}

enum class BottomBarRoute(val route: Route, val selectedIcon: ImageVector, val unselectedIcon: ImageVector, val label: String) {
    HOME(Route.Home, Icons.Filled.Home, Icons.Outlined.Home, "Home"),
    MESSAGES(Route.Messages, Icons.Filled.Message, Icons.Outlined.Message, "Messages"),
    VIDEOS(Route.Video, Icons.Filled.VideoLibrary, Icons.Outlined.VideoLibrary, "Videos"),
    DISCOVER(Route.Discover, Icons.Filled.Explore, Icons.Outlined.Explore, "Discover"),
    NOTIFICATIONS(Route.Notification, Icons.Filled.Notifications, Icons.Outlined.Notifications, "Notifications")
}
```

### Observing Current Route

```kotlin
@Composable
fun MainScreen() {
    val navController = rememberNavController()
    val currentBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = currentBackStackEntry?.toRoute<Route>()

    Scaffold(
        topBar = { if (shouldShowTopBar(currentRoute)) AppTopBar(currentRoute) },
        bottomBar = { if (shouldShowBottomBar(currentRoute)) AppBottomBar(currentRoute, nav) }
    ) { paddingValues ->
        AppNavigation(navController, accountViewModel, modifier = Modifier.padding(paddingValues))
    }
}

fun shouldShowBottomBar(route: Route?): Boolean = route is Route.Home || route is Route.Messages || route is Route.Video || route is Route.Discover || route is Route.Notification
```

## Navigation Drawer

```kotlin
@Composable
fun AppDrawer(drawerState: DrawerState, nav: Nav, accountViewModel: AccountViewModel) {
    ModalDrawerSheet {
        DrawerHeader(accountViewModel.account)
        HorizontalDivider()
        NavigationDrawerItem(label = { Text("Home") }, selected = false, onClick = { nav.nav(Route.Home) }, icon = { Icon(Icons.Default.Home, "Home") })
        NavigationDrawerItem(label = { Text("Profile") }, selected = false, onClick = { nav.nav(Route.Profile(accountViewModel.account.pubkey)) }, icon = { Icon(Icons.Default.Person, "Profile") })
        NavigationDrawerItem(label = { Text("Settings") }, selected = false, onClick = { nav.nav(Route.Settings) }, icon = { Icon(Icons.Default.Settings, "Settings") })
        HorizontalDivider()
        NavigationDrawerItem(label = { Text("Logout") }, selected = false, onClick = { /* logout */ }, icon = { Icon(Icons.Default.Logout, "Logout") })
    }
}
```

### Main Scaffold with Drawer

```kotlin
@Composable
fun MainScreen() {
    val navController = rememberNavController()
    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    val nav = remember { Nav(navController, drawerState, scope) }

    ModalNavigationDrawer(drawerState = drawerState, drawerContent = { AppDrawer(drawerState, nav, accountViewModel) }) {
        Scaffold(
            topBar = { TopAppBar(title = { Text("App") }, navigationIcon = { IconButton(onClick = { scope.launch { drawerState.open() } }) { Icon(Icons.Default.Menu, "Menu") } }) },
            bottomBar = { AppBottomBar(currentRoute, nav) }
        ) { paddingValues ->
            AppNavigation(navController, modifier = Modifier.padding(paddingValues))
        }
    }
}
```

## Deep Link Handling

### Intent Processing

```kotlin
@Composable
fun AppNavigation(navController: NavHostController, accountViewModel: AccountViewModel) {
    val activity = LocalContext.current as? Activity
    LaunchedEffect(activity?.intent) { activity?.intent?.let { handleIntent(it, navController) } }
    NavHost(navController) { /* routes */ }
}

fun handleIntent(intent: Intent, navController: NavHostController) {
    when (intent.action) {
        Intent.ACTION_SEND -> {
            val text = intent.getStringExtra(Intent.EXTRA_TEXT)
            val uri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
            navController.navigate(Route.NewPost(message = text, attachment = uri?.toString()))
        }
        Intent.ACTION_VIEW -> intent.data?.let { uri ->
            when (uri.scheme) {
                "app" -> handleAppUri(uri, navController)
                "https", "http" -> handleWebUri(uri, navController)
            }
        }
    }
}

fun handleAppUri(uri: Uri, navController: NavHostController) {
    val path = uri.pathSegments.firstOrNull() ?: return
    when {
        path.startsWith("profile") -> navController.navigate(Route.Profile(path.removePrefix("profile/")))
        path.startsWith("note") -> navController.navigate(Route.Note(path.removePrefix("note/")))
    }
}
```

### AndroidManifest Intent Filters

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="app" />
</intent-filter>

<intent-filter>
    <action android:name="android.intent.action.SEND" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:mimeType="text/plain" />
    <data android:mimeType="image/*" />
</intent-filter>
```

## Nested Navigation

```kotlin
@Composable
fun ProfileScreen(pubkey: String, nav: Nav) {
    val nestedNavController = rememberNavController()
    Column {
        ProfileHeader(pubkey)
        TabRow(selectedTabIndex = currentTab) {
            Tab(selected = currentTab == 0, onClick = { }) { Text("Notes") }
            Tab(selected = currentTab == 1, onClick = { }) { Text("Replies") }
        }
        NavHost(nestedNavController, startDestination = ProfileTab.Notes) {
            composable<ProfileTab.Notes> { NotesTabContent(pubkey) }
            composable<ProfileTab.Replies> { RepliesTabContent(pubkey) }
        }
    }
}

@Serializable sealed class ProfileTab {
    @Serializable object Notes : ProfileTab()
    @Serializable object Replies : ProfileTab()
}
```

## Testing Navigation

```kotlin
@Test
fun testNavigationToProfile() {
    val navController = TestNavHostController(ApplicationProvider.getApplicationContext())
    composeTestRule.setContent {
        navController.navigatorProvider.addNavigator(ComposeNavigator())
        AppNavigation(navController, accountViewModel)
    }
    composeTestRule.onNodeWithText("Profile").performClick()
    assertTrue(navController.currentBackStackEntry?.toRoute<Route>() is Route.Profile)
}
```

## File Locations

- `app/src/main/java/com/example/yourapp/ui/navigation/routes/Routes.kt`
- `app/src/main/java/com/example/yourapp/ui/navigation/AppNavigation.kt`
- `app/src/main/java/com/example/yourapp/ui/navigation/Nav.kt`
- `app/src/main/java/com/example/yourapp/ui/navigation/bottombars/AppBottomBar.kt`
