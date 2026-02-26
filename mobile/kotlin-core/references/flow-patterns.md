# Flow Patterns

StateFlow and SharedFlow usage patterns.

## StateFlow

### Basic Pattern

```kotlin
sealed class AccountState {
    data object LoggedOut : AccountState()
    data class LoggedIn(val pubKey: String) : AccountState()
}

class AccountManager {
    private val _accountState = MutableStateFlow<AccountState>(AccountState.LoggedOut)
    val accountState: StateFlow<AccountState> = _accountState.asStateFlow()

    fun login(key: String) {
        _accountState.value = AccountState.LoggedIn(key)
    }

    fun logout() {
        _accountState.value = AccountState.LoggedOut
    }
}
```

### Map as State

```kotlin
class RelayManager {
    private val _relayStatuses = MutableStateFlow<Map<String, RelayStatus>>(emptyMap())
    val relayStatuses: StateFlow<Map<String, RelayStatus>> = _relayStatuses.asStateFlow()

    fun updateRelay(url: String, status: RelayStatus) {
        _relayStatuses.value = _relayStatuses.value + (url to status)
    }

    fun removeRelay(url: String) {
        _relayStatuses.value = _relayStatuses.value - url
    }
}
```

## SharedFlow

### Events

```kotlin
class NavManager {
    private val _events = MutableSharedFlow<NavEvent>(replay = 0)
    val events: SharedFlow<NavEvent> = _events.asSharedFlow()

    fun navigate(event: NavEvent) {
        viewModelScope.launch { _events.emit(event) }
    }
}
```

## Common Patterns

### Immutable Updates

```kotlin
// Map
_status.value = _status.value + (key to value)
_status.value = _status.value - key

// List
_items.value = _items.value + item
_items.value = _items.value.filter { it.id != id }

// Object
_user.value = _user.value.copy(name = newName)
```

### Derived State

```kotlin
val items: StateFlow<List<Item>> = _items.asStateFlow()
val count: StateFlow<Int> = items.map { it.size }
    .stateIn(viewModelScope, SharingStarted.Lazily, 0)
```

### Loading/Error State

```kotlin
sealed class UiState<out T> {
    data object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
}
```

## Anti-Patterns

### ❌ Mutable Public State
```kotlin
val state: MutableStateFlow<State>  // BAD
```

### ✅ Immutable
```kotlin
private val _state = MutableStateFlow(State.Initial)
val state: StateFlow<State> = _state.asStateFlow()  // GOOD
```

### ❌ StateFlow for Events
```kotlin
val event: StateFlow<NavEvent?> = MutableStateFlow(null)  // BAD - lost if no collector
```

### ✅ SharedFlow for Events
```kotlin
private val _event = MutableSharedFlow<NavEvent>(replay = 0)
val event: SharedFlow<NavEvent> = _event.asSharedFlow()  // GOOD
```

### ❌ Blocking in Update
```kotlin
_state.value = fetchData()  // BAD - blocks
```

### ✅ Async Update
```kotlin
viewModelScope.launch {
    _state.value = Loading
    _state.value = Success(withContext(IO) { fetchData() })
}
```
