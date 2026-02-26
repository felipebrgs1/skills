# DSL Builder Examples

Type-safe fluent APIs.

## TagArrayBuilder

```kotlin
class TagArrayBuilder<T> {
    private val tags = mutableMapOf<String, MutableList<Array<String>>>()

    fun add(tag: Array<String>): TagArrayBuilder<T> {
        tags.getOrPut(tag[0]) { mutableListOf() }.add(tag)
        return this
    }

    fun remove(name: String): TagArrayBuilder<T> {
        tags.remove(name)
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
    remove("a")
}
```

## Basic Builder Template

```kotlin
class Builder {
    private val items = mutableListOf<Item>()

    fun add(item: Item): Builder = apply { items.add(item) }
    fun build(): List<Item> = items.toList()
}

inline fun myDsl(init: Builder.() -> Unit) = Builder().apply(init).build()

// Usage
val result = myDsl {
    add(Item("foo"))
    add(Item("bar"))
}
```

## DSL Principles

### 1. Lambda with Receiver

```kotlin
// Without receiver
fun build(config: (Builder) -> Unit) = Builder().also(config).build()

// With receiver - cleaner
inline fun build(config: Builder.() -> Unit) = Builder().apply(config).build()
```

### 2. Method Chaining

```kotlin
fun add(item: Item): Builder = apply { items.add(item) }  // Return this
```

### 3. Inline for Performance

```kotlin
inline fun myDsl(init: Builder.() -> Unit) = Builder().apply(init).build()
```

### 4. Type Safety

```kotlin
class EventBuilder<T : Event> {
    fun addTag(tag: Tag<T>): EventBuilder<T> = apply { tags.add(tag) }
}

val event = EventBuilder<TextNoteEvent>()
    .addTag(TextNoteTag(subject))  // OK
    // .addTag(ChannelTag(name))   // Compile error!
```

## Nested Builders

```kotlin
class FilterBuilder {
    private val conditions = mutableListOf<String>()
    fun eq(field: String, value: String) = apply { conditions.add("$field = '$value'") }
    fun build() = conditions.joinToString(" AND ")
}

class QueryBuilder {
    private var filter = ""
    fun select(vararg fields: String) = apply { ... }
    fun where(init: FilterBuilder.() -> Unit) = apply { filter = FilterBuilder().apply(init).build() }
    fun build() = "SELECT * WHERE $filter"
}

// Usage
val sql = QueryBuilder().select("id", "name").where {
    eq("status", "active")
}
```

## Best Practices

✅ **DO:**
- Return `this` for chaining
- Use `inline` for DSL functions
- Validate in `build()`

❌ **DON'T:**
- Expose mutable state
- Forget to return `this`
- Make DSL functions non-inline unnecessarily
