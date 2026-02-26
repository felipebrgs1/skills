---
name: kotlin-core
description: Advanced Kotlin patterns. Flow state management, sealed hierarchies, immutability (@Immutable), DSL builders, inline/reified functions. Use when working with: (1) StateFlow/SharedFlow, (2) Sealed classes or interfaces, (3) @Immutable for Compose, (4) DSL builders, (5) inline/reified, (6) Kotlin performance.
---

# Kotlin Core

Advanced Kotlin patterns. Covers Flow, sealed hierarchies, immutability, DSL builders, and inline functions.

## Mental Model

```
State Management (Hot Flows)
    ├── StateFlow<T>           # Single value, always has value
    ├── SharedFlow<T>          # Event stream, configurable replay
    └── MutableStateFlow<T>    # Private mutable, public via .asStateFlow()

Type Safety (Sealed Hierarchies)
    ├── sealed class           # State variants with data
    └── sealed interface       # Generic result types

Compose Performance (@Immutable)
    ├── @Immutable             # Prevents unnecessary recomposition
    └── data class             # Structural equality, copy()

DSL Patterns
    ├── Builder classes        # Fluent APIs
    ├── Lambda receivers       # inline fun builder { ... }
    └── Method chaining       # return this

Performance
    ├── inline fun            # Eliminate lambda overhead
    ├── reified type params   # Runtime type info
    └── value class           # Zero-cost wrappers
```

---

## 1. Flow State Management

### StateFlow: State that Changes

```kotlin
class AccountManager {
    private val _accountState = MutableStateFlow<AccountState>(AccountState.LoggedOut)
    val accountState: StateFlow<AccountState> = _accountState.asStateFlow()

    fun login(key: String) {
        _accountState.value = AccountState.LoggedIn(...)
    }
}

sealed class AccountState {
    data object LoggedOut : AccountState()
    data class LoggedIn(val pubKey: String) : AccountState()
}
```

**Key principles:**
1. Private mutable (`MutableStateFlow`), public immutable (`StateFlow`)
2. Always has initial value
3. Single value replays to new subscribers

### SharedFlow: Events

```kotlin
class NavigationManager {
    private val _navEvents = MutableSharedFlow<NavEvent>(replay = 0)
    val navEvents: SharedFlow<NavEvent> = _navEvents.asSharedFlow()

    fun navigate(event: NavEvent) {
        viewModelScope.launch { _navEvents.emit(event) }
    }
}
```

**When to use:**
- **StateFlow**: UI state, always has value
- **SharedFlow**: One-time events, navigation

### Flow Anti-Patterns

❌ **Exposing mutable:**
```kotlin
val state: MutableStateFlow<State>  // BAD
```

✅ **Expose immutable:**
```kotlin
val state: StateFlow<State> = _state.asStateFlow()  // GOOD
```

---

## 2. Sealed Hierarchies

### Sealed Classes: State Variants

```kotlin
sealed class AccountState {
    data object LoggedOut : AccountState()
    data class LoggedIn(val pubKeyHex: String, val npub: String) : AccountState()
}

// Usage - exhaustive when
when (state) {
    is AccountState.LoggedOut -> showLogin()
    is AccountState.LoggedIn -> showFeed(state.pubKeyHex)
}
```

### Sealed Interfaces: Generic Results

```kotlin
sealed interface Result<out T> {
    data class Success<T>(val value: T) : Result<T>
    data class Error(val exception: Exception) : Result<Nothing>
}

// With variance
fun fetch(): Result<User> = ...
val userResult: Result<User> = fetch()
```

### Decision Tree

```
Need common data in base?
    YES → sealed class
    NO → sealed interface

Need generics with variance (out/in)?
    YES → sealed interface
    NO → Either works
```

---

## 3. Immutability & Compose

### @Immutable

```kotlin
@Immutable
class TextNoteEvent(
    val id: String,
    val pubKey: String,
    val content: String,
    val tags: Array<Array<String>>
)
```

**Requirements:**
- All properties `val` (no `var`)
- No mutable collections
- Deep immutability

### Data Classes

```kotlin
@Immutable
data class RelayStatus(
    val url: String,
    val connected: Boolean,
    val error: String? = null
)

// Immutable update
val updated = oldStatus.copy(connected = true)
```

### Immutable Collections

```kotlin
import kotlinx.collections.immutable.persistentListOf
import kotlinx.collections.immutable.toImmutableList

val relays: ImmutableList<String> = persistentListOf("relay1", "relay2")
val updated = relays.add("relay3")  // Original unchanged
```

---

## 4. DSL Builders

### Type-Safe Fluent API

```kotlin
class TagArrayBuilder<T> {
    private val tags = mutableMapOf<String, MutableList<Array<String>>>()

    fun add(tag: Array<String>): TagArrayBuilder<T> {
        tags.getOrPut(tag[0]) { mutableListOf() }.add(tag)
        return this
    }

    fun build(): Array<Array<String>> = tags.values.flatMap { it }.toTypedArray()
}

inline fun <T> tagArray(init: TagArrayBuilder<T>.() -> Unit): Array<Array<String>> =
    TagArrayBuilder<T>().apply(init).build()

// Usage
val tags = tagArray<Event> {
    add(arrayOf("e", eventId))
    add(arrayOf("p", pubkey))
}
```

**Key patterns:**
1. Return `this` for chaining
2. Lambda receiver: `TagArrayBuilder<T>.() -> Unit`
3. `inline` for performance

### Template

```kotlin
class Builder {
    private val items = mutableListOf<Item>()
    fun add(item: Item) = apply { items.add(item) }
    fun build() = items.toList()
}

inline fun myDsl(init: Builder.() -> Unit) = Builder().apply(init).build()
```

---

## 5. Inline Functions & reified

### inline: Eliminate Overhead

```kotlin
inline fun <T> measureTime(block: () -> T): T {
    val start = System.nanoTime()
    return block().also {
        println("Took ${System.nanoTime() - start}ns")
    }
}
```

### reified: Runtime Type

```kotlin
inline fun <reified T> fromJson(json: String): T {
    return when (T::class) {
        TextNoteEvent::class -> parseTextNote(json) as T
        else -> throw Error("Unknown type")
    }
}

val event = fromJson<TextNoteEvent>(json)  // Clean!
```

### noinline & crossinline

```kotlin
inline fun foo(inlined: () -> Unit, noinline notInlined: () -> Unit) {
    inlined()  // Inlined
    someFunction(notInlined)  // Can't inline
}

inline fun bar(crossinline block: () -> Unit) {
    launch { block() }  // crossinline allows lambda in different context
}
```

---

## 6. Value Classes

```kotlin
@JvmInline
value class EventId(val hex: String)

@JvmInline
value class PubKey(val hex: String)

// Type safety without runtime cost
fun fetchEvent(id: EventId): Event
fun fetchProfile(key: PubKey): Profile

fetchEvent(EventId("abc"))  // Type safe
// fetchEvent(PubKey("xyz"))  // Compile error!
```

**When to use:**
- Type safety for primitives (IDs, hex strings)
- High-frequency allocations
- Zero-cost wrappers

---

## Common Patterns

### StateFlow State Management

```kotlin
sealed class UiState {
    data object Loading : UiState()
    data class Success(val data: List<Item>) : UiState()
    data class Error(val message: String) : UiState()
}

class MyViewModel {
    private val _state = MutableStateFlow<UiState>(UiState.Loading)
    val state: StateFlow<UiState> = _state.asStateFlow()

    fun load() {
        viewModelScope.launch {
            _state.value = UiState.Loading
            try {
                _state.value = UiState.Success(repo.getData())
            } catch (e: Exception) {
                _state.value = UiState.Error(e.message ?: "Error")
            }
        }
    }
}
```

---

## Anti-Patterns

❌ **Mutable public state:**
```kotlin
val state: MutableStateFlow<State>  // BAD
```

✅ **Immutable public interface:**
```kotlin
val state: StateFlow<State> = _state.asStateFlow()  // GOOD
```

❌ **var in @Immutable class:**
```kotlin
@Immutable data class Event(var content: String)  // BAD
```

✅ **All val:**
```kotlin
@Immutable data class Event(val content: String)  // GOOD
```

---

## Quick Reference

| Pattern | When |
|---------|------|
| StateFlow | UI state, always has value |
| SharedFlow | One-time events |
| sealed class | State with common data |
| sealed interface | Generic results, variance |
| @Immutable | Compose state |
| inline + reified | Type-safe parsing |

---

## References

- `references/flow-patterns.md`
- `references/sealed-class-catalog.md`
- `references/dsl-builder-examples.md`
- `references/immutability-patterns.md`

---

## When NOT to Use

- Async patterns → Use `kotlin-perf` (coroutines)
- expect/actual → Use `kotlin-multiplatform`
- Compose UI → Use `kotlin-ui`
