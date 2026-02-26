# Sealed Class Catalog

Sealed types patterns.

## Sealed Classes

### State Variants

```kotlin
sealed class AccountState {
    data object LoggedOut : AccountState()
    data class LoggedIn(
        val pubKey: String,
        val npub: String
    ) : AccountState()
}

// Exhaustive when
when (state) {
    is AccountState.LoggedOut -> showLogin()
    is AccountState.LoggedIn -> showFeed(state.pubKey)
}
```

### State Machine

```kotlin
sealed class ConnectionState {
    data object Disconnected : ConnectionState()
    data object Connecting : ConnectionState()
    data class Connected(val relay: String) : ConnectionState()
    data class Failed(val error: String) : ConnectionState()
}
```

## Sealed Interfaces

### Generic Results

```kotlin
sealed interface Result<out T> {
    data class Success<T>(val value: T) : Result<T>
    data class Error(val exception: Exception) : Result<Nothing>
}

// With covariance
fun fetch(): Result<User> = ...
val userResult: Result<User> = fetch()
```

### Nested Hierarchies

```kotlin
sealed interface UiState {
    sealed interface Loading : UiState {
        data object Initial : Loading
        data class Refreshing(val data: List<Item>) : Loading
    }
    sealed interface Content : UiState {
        data class Success(val data: List<Item>) : Content
        data object Empty : Content
    }
}
```

## When to Use

| Need | Use |
|------|-----|
| Common data in base | sealed class |
| Generics with variance | sealed interface |
| Multiple inheritance | sealed interface |
| State machine | sealed class |

## Decision Tree

```
Need common data in base?
    YES → sealed class
    NO → sealed interface

Need generics with variance (out/in)?
    YES → sealed interface
    NO → Either works
```
