# Immutability Patterns

@Immutable for Compose performance.

## @Immutable

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

**Why it matters:**
- Compose skips recomposition if reference unchanged
- Thread-safe by design

## Data Classes

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

**Benefits:**
- Structural equality
- copy() for modifications
- toString(), hashCode()

## Immutable Collections

```kotlin
import kotlinx.collections.immutable.persistentListOf
import kotlinx.collections.immutable.toImmutableList

// Create
val relays: ImmutableList<String> = persistentListOf("relay1", "relay2")

// Add returns NEW list
val updated = relays.add("relay3")  // Original unchanged

// Convert
val immutable = mutableList.toImmutableList()
```

### Immutable Map

```kotlin
import kotlinx.collections.immutable.persistentMapOf

val statuses: ImmutableMap<String, Status> = persistentMapOf(
    "relay1" to Status(true),
    "relay2" to Status(false)
)

val updated = statuses.put("relay3", Status(true))
val removed = statuses.remove("relay1")
```

## StateFlow with Immutable

```kotlin
@Immutable
data class FeedState(
    val events: ImmutableList<Event>,
    val loading: Boolean,
    val error: String?
)

class FeedViewModel {
    private val _state = MutableStateFlow(FeedState(persistentListOf(), false, null))
    val state: StateFlow<FeedState> = _state.asStateFlow()

    fun addEvent(event: Event) {
        _state.value = _state.value.copy(
            events = _state.value.events.add(event)
        )
    }
}
```

## Deep Immutability

```kotlin
@Immutable
data class User(
    val name: String,
    val profile: Profile
)

@Immutable
data class Profile(
    val bio: String,
    val avatar: String
)

// Deep update
val updated = user.copy(profile = user.profile.copy(bio = "New bio"))
```

## Anti-Patterns

❌ **var in @Immutable:**
```kotlin
@Immutable data class Event(var content: String)  // BAD
```

✅ **All val:**
```kotlin
@Immutable data class Event(val content: String)  // GOOD
```

❌ **Mutable collections:**
```kotlin
@Immutable data class State(val items: MutableList<Item>)  // BAD
```

✅ **Immutable collections:**
```kotlin
@Immutable data class State(val items: ImmutableList<Item>)  // GOOD
```

❌ **Direct mutation:**
```kotlin
status.connected = true  // Error with val
```

✅ **Immutable update:**
```kotlin
val updated = status.copy(connected = true)
```

## Checklist

- [ ] All properties `val`
- [ ] No mutable collections
- [ ] Nested objects also immutable
- [ ] Use `copy()` for updates
- [ ] Use ImmutableList/Map in StateFlow state
