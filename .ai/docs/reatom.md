# Reatom State Management Guide

A comprehensive guide for implementing Reatom in this project. This document covers all core concepts, patterns, and utilities needed to build features using Reatom.

## Project-Specific Configuration

> **Important**: This project uses a simplified Reatom setup that differs from the standard documentation.

### Key Differences

| Standard Setup                     | This Project                               |
| ---------------------------------- | ------------------------------------------ |
| React StrictMode enabled           | **No StrictMode** - causes double-effects  |
| Explicit `reatomContext.Provider`  | **No provider** - uses default context     |
| `useAtom`, `useAction` hooks       | **Direct atom calls** in `reatomComponent` |
| `context.start()` + `clearStack()` | **Default context** - no explicit setup    |

### Why These Changes?

1. **No StrictMode**: React's StrictMode double-invokes effects in development, which breaks Reatom's context tracking and causes async operations to behave unexpectedly.

2. **No Context Provider**: The explicit `reatomContext.Provider` was causing initialization failures. Reatom's default global context works reliably with `reatomComponent`.

3. **Direct Atom Calls**: Inside `reatomComponent`, calling `atomName()` directly auto-subscribes to changes. No need for `useAtom` or `useAction` hooks.

### Project Pattern

```tsx
// main.tsx - Minimal, no wrappers
createRoot(document.getElementById("root")!).render(<App />);

// Components - Use reatomComponent, call atoms directly
const MyComponent = reatomComponent(() => {
  const user = userAtom(); // Auto-subscribes
  const isLoading = isLoadingAtom(); // Auto-subscribes

  return <button onClick={() => login("username")}>{user?.name}</button>;
}, "MyComponent");
```

---

## Table of Contents

1. [Installation](#installation)
2. [Core Concepts](#core-concepts)
   - [Atoms](#atoms)
   - [Computed](#computed)
   - [Actions](#actions)
   - [Effects](#effects)
3. [React Integration](#react-integration)
4. [Async Data Fetching](#async-data-fetching)
5. [Collections](#collections)
6. [Persistence](#persistence)
7. [Forms](#forms)
8. [Extensions](#extensions)
9. [Testing](#testing)
10. [Best Practices](#best-practices)

---

## Installation

```bash
# Core package
bun add @reatom/core

# React integration
bun add @reatom/react
```

---

## Core Concepts

Reatom is built on four fundamental primitives: `atom`, `computed`, `action`, and `effect`.

### Atoms

Atoms are the basic unit of state. They hold mutable values and notify subscribers when changed.

```typescript
import { atom } from "@reatom/core";

// Create atom with initial value and optional name (recommended for debugging)
const counter = atom(0, "counter");
const user = atom({ name: "John", age: 30 }, "user");

// Read current value
console.log(counter()); // 0
console.log(user()); // { name: 'John', age: 30 }

// Update with direct value
counter.set(5);
console.log(counter()); // 5

// Update with function (receives previous state)
counter.set((prev) => prev + 10);
console.log(counter()); // 15

// Update object atom
user.set((prev) => ({ ...prev, age: 31 }));
console.log(user()); // { name: 'John', age: 31 }
```

### Computed

Computed atoms derive values from other atoms. They recalculate only when dependencies change (lazy evaluation).

```typescript
import { atom, computed } from "@reatom/core";

const firstName = atom("John", "firstName");
const lastName = atom("Doe", "lastName");
const age = atom(30, "age");

// Computed value automatically tracks dependencies
const fullName = computed(() => {
  return `${firstName()} ${lastName()}`;
}, "fullName");

const isAdult = computed(() => age() >= 18, "isAdult");

// Computed with multiple dependencies
const userSummary = computed(() => {
  return `${fullName()} is ${age()} years old and is ${isAdult() ? "an adult" : "a minor"}`;
}, "userSummary");

console.log(fullName()); // "John Doe"
console.log(userSummary()); // "John Doe is 30 years old and is an adult"

// Updates only when dependencies change
firstName.set("Jane");
console.log(fullName()); // "Jane Doe"
```

### Actions

Actions encapsulate business logic and side effects. They can be sync or async.

```typescript
import { atom, action, wrap } from "@reatom/core";

const counter = atom(0, "counter");
const logs = atom<string[]>([], "logs");

// Simple action
const increment = action((amount: number = 1) => {
  const oldValue = counter();
  counter.set((prev) => prev + amount);
  const newValue = counter();

  logs.set((prev) => [...prev, `Incremented from ${oldValue} to ${newValue}`]);
  return newValue;
}, "increment");

// Action with async operations
const fetchAndIncrement = action(async (userId: string) => {
  try {
    const response = await wrap(fetch(`/api/count/${userId}`));
    const data = await wrap(response.json());

    counter.set(data.count);
    return { success: true, count: data.count };
  } catch (error) {
    logs.set((prev) => [...prev, `Error: ${error.message}`]);
    return { success: false, count: counter() };
  }
}, "fetchAndIncrement");

// Use actions
increment(5);
console.log(counter()); // 5

await fetchAndIncrement("user-123");
```

### Effects

Effects run side effects when dependencies change. They support cleanup functions.

```typescript
import { atom, computed, effect } from "@reatom/core";

const counter = atom(0, "counter");
const isEven = computed(() => counter() % 2 === 0, "isEven");

// Effect runs immediately and on every change
effect(() => {
  console.log(`Counter is ${counter()} and is ${isEven() ? "even" : "odd"}`);
});
// Logs: "Counter is 0 and is even"

counter.set(1);
// Logs: "Counter is 1 and is odd"

// Effect with cleanup
const message = atom("", "message");
effect(() => {
  const msg = message();
  const timerId = setTimeout(() => {
    console.log("Message was:", msg);
  }, 1000);

  // Cleanup function runs before next effect or on disconnect
  return () => clearTimeout(timerId);
});

message.set("Hello");
message.set("World"); // Cancels previous timeout, sets new one
```

---

## React Integration

### Setup

**Important**: This project uses Reatom without explicit React context provider and without React StrictMode.

```tsx
// main.tsx - Minimal setup without context provider
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

// No StrictMode - it causes double-mounting which interferes with Reatom's
// effect system and context tracking
// No reatomContext.Provider - Reatom works with its default global context
createRoot(document.getElementById("root")!).render(<App />);
```

**Why no StrictMode?**
React StrictMode double-invokes effects in development, which conflicts with Reatom's context tracking. This causes issues where:

- Effects run twice unexpectedly
- Context can become desynchronized
- Async operations may behave inconsistently

**Why no reatomContext.Provider?**
Reatom has a built-in default context that works without explicit provider setup. The `reatomComponent` wrapper handles context tracking automatically. Using explicit context provider was causing initialization issues, so we rely on Reatom's default context instead.

```tsx
// App.tsx - Root component using reatomComponent
import { reatomComponent } from "@reatom/react";

const App = reatomComponent(() => {
  return (
    <AuthGuard>
      <NewTabPage />
    </AuthGuard>
  );
}, "App");
```

### reatomComponent

The primary way to use Reatom in React. Components automatically track atom dependencies. **This is the preferred approach in this project** - we avoid React hooks like `useAtom` and `useAction` in favor of direct atom calls inside `reatomComponent`.

```tsx
import { atom, computed } from "@reatom/core";
import { reatomComponent } from "@reatom/react";

const counter = atom(0, "counter");
const doubled = computed(() => counter() * 2, "doubled");

// Automatic atom tracking - preferred pattern
export const Counter = reatomComponent(() => {
  // Call atoms directly - they auto-subscribe inside reatomComponent
  const count = counter();
  const doubledValue = doubled();

  // Call actions directly - no hooks needed
  return (
    <div>
      <p>Count: {count}</p>
      <p>Doubled: {doubledValue}</p>
      <button onClick={() => counter.set((prev) => prev + 1)}>Increment</button>
    </div>
  );
}, "Counter"); // Always provide component name for debugging
```

### useAtom Hook (Not Recommended)

> **Note**: In this project, we prefer using `reatomComponent` with direct atom calls instead of `useAtom`. The hooks below are documented for reference but are not the primary pattern.

For inline atom creation and two-way binding (use sparingly):

```tsx
import { useAtom, useAction } from "@reatom/react";
import { useCallback } from "react";

export const Greeting = ({ initialGreeting = "" }) => {
  const [input, setInput, inputAtom] = useAtom(initialGreeting);
  const [greeting] = useAtom(
    (ctx) => `Hello, ${ctx.spy(inputAtom)}!`,
    [inputAtom],
  );

  const handleChange = useCallback(
    (event) => setInput(event.currentTarget.value),
    [setInput],
  );

  return (
    <>
      <input value={input} onChange={handleChange} />
      {greeting}
    </>
  );
};
```

### useAction Hook (Not Recommended)

> **Note**: Prefer calling actions directly inside `reatomComponent` instead.

Bind actions to React context:

```typescript
import { atom, action } from '@reatom/core'
import { useAtom, useAction } from '@reatom/react'

const pageAtom = atom(0, 'pageAtom')
const next = action((ctx) => pageAtom(ctx, (page) => page + 1), 'pageAtom.next')
const prev = action(
  (ctx) => pageAtom(ctx, (page) => Math.max(1, page - 1)),
  'pageAtom.prev',
)

export const Paging = () => {
  const [page] = useAtom(pageAtom)
  const handleNext = useAction(next)
  const handlePrev = useAction(prev)

  return (
    <>
      <button onClick={handlePrev}>prev</button>
      {page}
      <button onClick={handleNext}>next</button>
    </>
  )
}
```

### useWrap Hook

Preserve Reatom context in callbacks.

```tsx
import { reatomComponent, useWrap } from "@reatom/react";

const CounterWithActions = reatomComponent(() => {
  const count = counter();

  // useWrap preserves Reatom context in callbacks
  const handleIncrement = useWrap(() => {
    counter.set((prev) => prev + 1);
  });

  const handleAsync = useWrap(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    counter.set((prev) => prev + 1);
  });

  return (
    <div>
      <p>{count}</p>
      <button onClick={handleIncrement}>Increment</button>
      <button onClick={handleAsync}>Async Increment</button>
    </div>
  );
});
```

---

## Async Data Fetching

### withAsyncData Extension

Automatically tracks loading, error, and data states.

```typescript
import { atom, computed, withAsyncData, wrap } from "@reatom/core";

const userId = atom("user-123", "userId");

// Computed async value with data tracking
const userResource = computed(async () => {
  const response = await wrap(fetch(`/api/users/${userId()}`));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await wrap(response.json());
}, "userResource").extend(
  withAsyncData({
    initState: null, // Initial data state
    staleTime: 5000, // Consider fresh for 5 seconds
  }),
);

// Access different states
console.log(userResource.pending()); // 1 during fetch, 0 when complete
console.log(userResource.ready()); // false during fetch, true when done
console.log(userResource.error()); // undefined or Error instance
console.log(userResource.data()); // null initially, then user object

// React to state changes
effect(() => {
  if (userResource.ready()) {
    const user = userResource.data();
    console.log("User loaded:", user.name);
  } else if (userResource.error()) {
    console.log("Error:", userResource.error().message);
  }
});

// Trigger refetch by changing dependency
userId.set("user-456");
```

### Action with Async Data

```typescript
import { atom, action, withAsyncData } from "@reatom/core";

const fetchList = action(async (page: number) => {
  const response = await fetch(`/api/data?page=${page}`);
  return await response.json();
}, "fetchList").extend(withAsyncData({ initState: [] }));

fetchList.ready(); // `false` during the fetch
fetchList.data(); // the fetch result
fetchList.error(); // `Error` or `undefined`

// Use it
fetchList(1); // Promise
```

### withAsync Extension (Lower-level control)

```typescript
import { computed, withAsync, wrap } from "@reatom/core";

const searchQuery = atom("react", "searchQuery");

const searchResource = computed(async () => {
  await wrap(new Promise((resolve) => setTimeout(resolve, 300))); // Debounce

  const response = await wrap(
    fetch(`https://api.github.com/search/repositories?q=${searchQuery()}`),
  );
  return await wrap(response.json());
}, "searchResource").extend(withAsync());

// Listen to promise lifecycle
searchResource.onFulfill((result) => {
  console.log(`Found ${result.total_count} repositories`);
});

searchResource.onReject((error) => {
  console.error("Search failed:", error);
});

searchResource.onSettle(() => {
  console.log("Search complete");
});

// Check state
console.log(searchResource.pending()); // Number of pending operations
console.log(searchResource.ready()); // Boolean: no pending operations
```

### Abort Handling

Use `withAbort` for automatic cancellation of concurrent requests.

```typescript
import { action, wrap, withAbort } from "@reatom/core";

const getA = async () => {
  const a = await wrap(api.getA());
  return a;
};

const getB = async (params) => {
  const b = await wrap(api.getB(params));
  return b;
};

// Automatically handles cancellation for concurrent calls
export const fetchData = action(async () => {
  const a = await wrap(getA());
  const b = await wrap(getB(a));
  setState(b);
}).extend(withAbort());
```

### wrap() Function

**Critical**: Always use `wrap()` for async operations to preserve Reatom context.

```typescript
import { action, atom, wrap } from "@reatom/core";

const dataAtom = atom(null, "dataAtom");

const fetchData = action(async () => {
  // GOOD: Wrap preserves context
  const response = await wrap(fetch("/api/data"));
  const data = await wrap(response.json());
  dataAtom.set(data); // Context preserved, this works

  // BAD: Context lost after unwrapped await
  // const response = await fetch('/api/data')
  // const data = await response.json()
  // dataAtom.set(data) // May throw "context lost" error
}, "fetchData");
```

---

## Collections

### reatomArray

Manage array state with immutable methods.

```typescript
import { reatomArray } from "@reatom/core";

const todos = reatomArray<{ id: number; text: string; done: boolean }>(
  [],
  "todos",
);

// Add items
todos.push({ id: 1, text: "Learn Reatom", done: false });
todos.push({ id: 2, text: "Build app", done: false });
todos.unshift({ id: 0, text: "Setup project", done: true });

console.log(todos()); // Array of 3 items

// Remove items
const lastItem = todos.pop();
const firstItem = todos.shift();

// Transform array
todos.map((todo) => ({ ...todo, done: true }));
todos.filter((todo) => !todo.done);
todos.sort((a, b) => a.id - b.id);

// Find items
const found = todos.find((todo) => todo.id === 1);
const index = todos.findIndex((todo) => todo.text === "Build app");

// Modify specific item
todos.splice(index, 1, { id: 2, text: "Build awesome app", done: false });

// Clear array
todos.clear();
```

### reatomRecord

Manage object state with immutable methods.

```typescript
import { reatomRecord, computed } from "@reatom/core";

const userProfile = reatomRecord(
  {
    name: "",
    email: "",
    age: 0,
    preferences: {
      theme: "light",
      notifications: true,
    },
  },
  "userProfile",
);

// Merge updates
userProfile.merge({
  name: "Alice",
  email: "alice@example.com",
  age: 28,
});

// Update nested properties
userProfile.merge({
  preferences: {
    ...userProfile().preferences,
    theme: "dark",
  },
});

// Remove properties
userProfile.omit("age");

// Reset to initial state
userProfile.reset();

// Derived computed values
const displayName = computed(() => {
  const profile = userProfile();
  return profile.name || profile.email || "Anonymous";
}, "displayName");
```

### reatomMap and reatomSet

Reactive wrappers for native Map and Set.

```typescript
import { reatomMap, reatomSet } from "@reatom/core";

// Map for key-value pairs
const userCache = reatomMap<string, { name: string; lastSeen: number }>(
  new Map(),
  "userCache",
);

userCache.set("user-1", { name: "Alice", lastSeen: Date.now() });
userCache.set("user-2", { name: "Bob", lastSeen: Date.now() });

console.log(userCache.has("user-1")); // true
console.log(userCache.get("user-1")); // { name: 'Alice', lastSeen: ... }
console.log(userCache.size()); // 2

userCache.delete("user-2");
userCache.clear();

// Set for unique values
const activeTags = reatomSet<string>(new Set(), "activeTags");

activeTags.add("react");
activeTags.add("typescript");

console.log(activeTags.has("react")); // true
console.log(activeTags.size()); // 2

activeTags.delete("typescript");
```

### reatomLinkedList

Efficient ordered collection with O(1) operations.

```typescript
import { reatomLinkedList } from "@reatom/core";

interface Task {
  id: string;
  title: string;
  done: boolean;
}

const taskList = reatomLinkedList<[title: string], Task, "id">(
  (title) => ({
    id: Math.random().toString(36).substring(7),
    title,
    done: false,
  }),
  {
    name: "taskList",
    key: "id", // Enable map for O(1) lookups by id
  },
);

// Create nodes
const task1 = taskList.create("Learn Reatom");
const task2 = taskList.create("Build app");

// Access as array
const tasks = taskList.array();

// Find node
const found = taskList.find((node) => node.title === "Build app");

// Reorder
taskList.move(task1, task2); // Move task1 after task2

// Remove
taskList.remove(task1);

// Batch updates for performance
taskList.batch(() => {
  taskList.create("Task A");
  taskList.create("Task B");
  taskList.create("Task C");
});
```

---

## Persistence

### localStorage

```typescript
import { atom, withLocalStorage } from "@reatom/core";

// Simple usage
const userPrefsAtom = atom({ theme: "light" }, "userPrefs").extend(
  withLocalStorage("user-preferences"),
);

// Values are automatically saved and restored
userPrefsAtom.set({ theme: "dark" });
// After page refresh, userPrefsAtom() will return { theme: 'dark' }
```

### sessionStorage

```typescript
import { atom, withSessionStorage } from "@reatom/core";

// Session-only persistence
const tempDataAtom = atom({}, "tempData").extend(
  withSessionStorage("temp-data"),
);
```

### IndexedDB (Large Data)

```typescript
import { atom, withIndexedDb } from "@reatom/core";

// Install peer dependency: bun add idb-keyval

const largeDataAtom = atom(new Map(), "largeData").extend(
  withIndexedDb("large-dataset"),
);
```

### BroadcastChannel (Cross-tab Sync)

```typescript
import { atom, withBroadcastChannel } from "@reatom/core";

// Real-time cross-tab sync (no persistence)
const notificationCountAtom = atom(0, "notificationCount").extend(
  withBroadcastChannel("notification-count"),
);
```

### Advanced Configuration

```typescript
const configuredAtom = atom({ name: "", age: 0 }).extend(
  withLocalStorage({
    key: "user-data",

    // Custom serialization
    toSnapshot: (state) => ({
      n: state.name,
      a: state.age,
    }),
    fromSnapshot: (snapshot: any) => ({
      name: snapshot.n,
      age: snapshot.a,
    }),

    // Version migration
    version: 2,
    migration: (record, currentVersion) => {
      if (record.version === 1) {
        return { name: record.data.userName, age: record.data.userAge };
      }
      return record.data;
    },

    // TTL (time to live) in milliseconds
    time: 24 * 60 * 60 * 1000, // 24 hours

    // Storage subscription for cross-tab sync
    subscribe: true,
  }),
);
```

### Custom Storage Implementation

```typescript
import { PersistStorage, reatomPersist } from "@reatom/core/persist";

const createCustomStorage = (name: string): Omit<PersistStorage, "cache"> => ({
  name,
  get: ({ key }) => {
    const item = localStorage.getItem(`${name}:${key}`);
    return item ? JSON.parse(item) : null;
  },
  set: ({ key }, record) => {
    localStorage.setItem(`${name}:${key}`, JSON.stringify(record));
  },
  clear: ({ key }) => {
    localStorage.removeItem(`${name}:${key}`);
  },
  subscribe: ({ key }, callback) => {
    const handler = (event: StorageEvent) => {
      if (event.key === `${name}:${key}` && event.newValue) {
        callback(JSON.parse(event.newValue));
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  },
});

const withMyStorage = reatomPersist(createCustomStorage("my-app"));
const myAtom = atom("").extend(withMyStorage("my-key"));
```

---

## Forms

### Basic Form

```typescript
import { reatomForm } from "@reatom/core";

export const loginForm = reatomForm(
  {
    username: "",
    password: "",
    passwordDouble: "",
  },
  {
    validate({ password, passwordDouble }) {
      if (password !== passwordDouble) {
        return "Passwords do not match";
      }
    },
    onSubmit: async (values) => {
      return await api.login(values);
    },
    validateOnBlur: true,
    name: "loginForm",
  },
);
```

### With Zod Schema

```typescript
import { reatomForm } from "@reatom/core";
import { z } from "zod";

const registerForm = reatomForm(
  {
    email: "",
    password: "",
    dateOfBirth: "",
  },
  {
    name: "registerForm",
    schema: z.object({
      email: z.email(),
      password: z.string().min(6),
      dateOfBirth: z.coerce.number().int().positive(),
    }),
    onSubmit: async (state) => {
      // state is typed: { email: string, password: string, dateOfBirth: number }
      return wrap(api.register(state));
    },
  },
);
```

### React Integration

```tsx
import { reatomComponent, bindField } from "@reatom/react";

const LoginForm = reatomComponent(() => {
  const { submit, fields } = loginForm;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        loginForm.submit();
      }}
    >
      <input {...bindField(fields.username)} />
      <input {...bindField(fields.password)} type="password" />
      <input {...bindField(fields.passwordDouble)} type="password" />
      <button type="submit" disabled={!submit.ready()}>
        Login
      </button>
    </form>
  );
});
```

### Full Form Example with Validation

```tsx
import { reatomComponent, bindField } from "@reatom/react";
import { reatomForm } from "@reatom/core";
import { z } from "zod";

const contactForm = reatomForm(
  {
    name: "",
    email: "",
    message: "",
    subscribe: false,
  },
  {
    schema: z.object({
      name: z.string().min(2),
      email: z.string().email(),
      message: z.string().min(10),
      subscribe: z.boolean(),
    }),
    onSubmit: async (values) => {
      await fetch("/api/contact", {
        method: "POST",
        body: JSON.stringify(values),
      });
    },
  },
);

export const ContactForm = reatomComponent(() => {
  const isSubmitting = !contactForm.submit.ready();
  const isFormValid = contactForm.isValid();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        contactForm.submit();
      }}
    >
      <div>
        <label>Name:</label>
        <input {...bindField(contactForm.fields.name)} />
        {contactForm.fields.name.errors().map((error) => (
          <span key={error} className="error">
            {error}
          </span>
        ))}
      </div>

      <div>
        <label>Email:</label>
        <input {...bindField(contactForm.fields.email)} type="email" />
        {contactForm.fields.email.errors().map((error) => (
          <span key={error} className="error">
            {error}
          </span>
        ))}
      </div>

      <div>
        <label>Message:</label>
        <textarea {...bindField(contactForm.fields.message)} rows={5} />
      </div>

      <div>
        <label>
          <input {...bindField(contactForm.fields.subscribe)} type="checkbox" />
          Subscribe to newsletter
        </label>
      </div>

      <button type="submit" disabled={isSubmitting || !isFormValid}>
        {isSubmitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
});
```

### Field-Level Dependent Validation

```typescript
import { reatomForm, reatomField } from "@reatom/core";

const loginForm = reatomForm((name) => {
  const password = reatomField("", `${name}.password`);

  const confirmPassword = reatomField("", {
    name: `${name}.confirmPassword`,
    validateOnBlur: true,
    validate: ({ state }) => {
      if (password() != state) throw new Error("Passwords do not match");
    },
  });

  return {
    username: reatomField("", `${name}.username`),
    password,
    confirmPassword,
  };
}, "loginForm");
```

---

## Extensions

Extensions add functionality to atoms and actions via the `.extend()` method.

### Common Extensions

```typescript
import {
  atom,
  action,
  withAsyncData,
  withSearchParams,
  withAbort,
} from "@reatom/core";

// URL sync
const search = atom("", "search").extend(withSearchParams("search"));
const page = atom(1, "page").extend(withSearchParams("page"));

// Async data
const listResource = computed(async () => {
  const response = await fetch(`/api/data?search=${search()}&page=${page()}`);
  return await response.json();
}, "listResource").extend(withAsyncData({ initState: [] }));

// Abort
const fetchData = action(async () => {
  const response = await wrap(fetch("/api/data"));
  return await wrap(response.json());
}, "fetchData").extend(withAbort());
```

### withConnectHook

Lazy data fetching when atom is first subscribed.

```typescript
import { atom, action, withConnectHook, wrap } from "@reatom/core";

export const fetchList = action(async () => {
  const data = await wrap(api.getList());
  list.set(data);
}, "fetchList");

export const list = atom([], "list").extend(withConnectHook(fetchList));
```

### Composing Multiple Extensions

```typescript
const persistentCounter = atom(0, "persistentCounter").extend(
  withReset(0),
  withLogger(),
  withLocalStorage("counter-key"),
);
```

### Custom Extension (Middleware)

```typescript
import { isAction, withMiddleware, GenericExt } from "@reatom/core";

const withLogger = (): GenericExt =>
  withMiddleware((target) => (next, ...params) => {
    if (!isAction(target) && !params.length) return next();

    console.log(`[${target.name}] Calling with:`, params);
    const result = next(...params);
    console.log(`[${target.name}] Result:`, result);
    return result;
  });

// Usage
const message = atom("", "message").extend(withLogger());
```

### Global Extension

```typescript
import { addGlobalExtension, isAction, withCallHook } from "@reatom/core";

addGlobalExtension((target) => {
  if (isAction(target)) {
    target.extend(
      withCallHook((payload, params) => {
        analytics.track("action_called", {
          action: target.name,
          timestamp: Date.now(),
          params: JSON.stringify(params),
        });
      }),
    );
  }
  return target;
});
```

---

## Testing

Reatom provides testing utilities compatible with Vitest.

### Basic Atom Testing

```typescript
import { test, expect, subscribe } from "@reatom/core/test";
import { atom, computed, action } from "@reatom/core";

// Basic atom testing
test("counter increments correctly", () => {
  const counter = atom(0, "counter");

  expect(counter()).toBe(0);

  counter.set(5);
  expect(counter()).toBe(5);

  counter.set((prev) => prev + 10);
  expect(counter()).toBe(15);
});
```

### Computed Testing

```typescript
test("computed values update on dependencies", () => {
  const firstName = atom("John", "firstName");
  const lastName = atom("Doe", "lastName");

  const fullName = computed(() => {
    return `${firstName()} ${lastName()}`;
  }, "fullName");

  expect(fullName()).toBe("John Doe");

  firstName.set("Jane");
  expect(fullName()).toBe("Jane Doe");
});
```

### Action Testing

```typescript
test("actions perform operations", () => {
  const counter = atom(0, "counter");

  const increment = action((amount: number) => {
    counter.set((prev) => prev + amount);
    return counter();
  }, "increment");

  const result = increment(5);
  expect(result).toBe(5);
  expect(counter()).toBe(5);
});
```

### Subscription Testing

```typescript
test("atoms notify subscribers", () => {
  const counter = atom(0, "counter");
  const track = subscribe(counter);

  counter.set(1);
  expect(track).toHaveBeenCalledWith(1);

  counter.set(2);
  expect(track).toHaveBeenCalledWith(2);
  expect(track).toHaveBeenCalledTimes(2);
});
```

### Async Testing

```typescript
test("async operations work correctly", async () => {
  const data = atom<string | null>(null, "data");

  const fetchData = action(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    data.set("loaded");
  }, "fetchData");

  expect(data()).toBeNull();
  await fetchData();
  expect(data()).toBe("loaded");
});
```

### Form Testing

```typescript
test("form validation works", () => {
  const form = reatomForm(
    { username: "", password: "" },
    {
      validate: (values) => {
        if (values.password.length < 8) {
          return "Password too short";
        }
      },
    },
  );

  expect(form.isValid()).toBe(false);

  form.fields.username.set("john");
  form.fields.password.set("secret123");

  expect(form.isValid()).toBe(true);
});
```

---

## Best Practices

### 1. Always Name Your Atoms and Actions

```typescript
// GOOD: descriptive names help with debugging
const fetchUserProfile = computed(async () => {
  return await wrap(api.getUserProfile());
}, "fetchUserProfile").extend(withAsyncData());

// BAD: generic names make debugging harder
const data = computed(async () => {
  return await wrap(api.getUserProfile());
}).extend(withAsyncData());
```

### 2. Always Use wrap() in Async Operations

```typescript
// GOOD
const response = await wrap(fetch("/api/data"));
const data = await wrap(response.json());

// BAD - context will be lost
const response = await fetch("/api/data");
const data = await response.json();
```

### 3. Organize by Feature

```
src/
├── features/
│   ├── auth/
│   │   ├── atoms.ts      # auth-related atoms
│   │   ├── actions.ts    # auth-related actions
│   │   └── components/   # auth UI components
│   ├── bookmarks/
│   │   ├── atoms.ts
│   │   ├── actions.ts
│   │   └── components/
```

### 4. Use Computed for Derived State

```typescript
// GOOD: derived state computed lazily
const filteredTodos = computed(() => {
  return todos().filter((todo) => !todo.completed);
}, "filteredTodos");

// BAD: redundant state that must be manually synced
const activeTodos = atom<Todo[]>([], "activeTodos");
// Must remember to update activeTodos whenever todos changes
```

### 5. Use Actions for Complex Logic

```typescript
// GOOD: logic encapsulated in action
const addTodo = action((text: string) => {
  const todo = {
    id: crypto.randomUUID(),
    text,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  todos.set((prev) => [...prev, todo]);
  return todo;
}, "addTodo");

// BAD: logic scattered in components
// todos.set(prev => [...prev, { id: ..., text, ... }])
```

### 6. Prefer withAsyncData for Data Fetching

```typescript
// GOOD: automatic loading/error/data state management
const userResource = computed(async () => {
  const response = await wrap(fetch(`/api/user/${userId()}`))
  return await wrap(response.json())
}, 'userResource').extend(withAsyncData({ initState: null }))

// In component
if (!userResource.ready()) return <Loading />
if (userResource.error()) return <Error error={userResource.error()} />
return <UserProfile user={userResource.data()} />
```

### 7. Use reatomComponent Instead of Hooks

```tsx
// GOOD: automatic dependency tracking, call atoms directly
const Counter = reatomComponent(() => {
  const count = counter(); // Direct call, auto-subscribes
  return <div>{count}</div>;
}, "Counter");

// AVOID: useAtom hooks add unnecessary complexity
const Counter = () => {
  const [count] = useAtom(counter);
  return <div>{count}</div>;
};
```

### 8. No React StrictMode or Context Provider

```tsx
// main.tsx - Current project setup
createRoot(document.getElementById("root")!).render(<App />);

// AVOID: StrictMode causes double-effects that break Reatom
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// AVOID: Explicit context provider (not needed with reatomComponent)
createRoot(document.getElementById("root")!).render(
  <reatomContext.Provider value={rootFrame}>
    <App />
  </reatomContext.Provider>,
);
```

### 9. Leverage Extensions for Cross-Cutting Concerns

```typescript
// Apply logging, persistence, and URL sync declaratively
const searchQuery = atom("", "searchQuery").extend(
  withSearchParams("q"),
  withLocalStorage("lastSearch"),
  withLogger(),
);
```

---

## Migration from Zustand

### Key Differences

| Zustand                  | Reatom                                    |
| ------------------------ | ----------------------------------------- |
| Single store with slices | Multiple independent atoms                |
| `useStore(selector)`     | `reatomComponent` + direct atom call      |
| Actions inside store     | Separate `action()` functions             |
| `set(state => ...)`      | `atom.set(prev => ...)`                   |
| Middleware               | Extensions (`.extend()`)                  |
| `persist` middleware     | `withLocalStorage`, `withIndexedDb`, etc. |

### Example Conversion

**Zustand:**

```typescript
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}))

const Counter = () => {
  const count = useStore((state) => state.count)
  const increment = useStore((state) => state.increment)
  return <button onClick={increment}>{count}</button>
}
```

**Reatom:**

```typescript
const count = atom(0, 'count')
const increment = action(() => count.set(prev => prev + 1), 'increment')
const decrement = action(() => count.set(prev => prev - 1), 'decrement')

const Counter = reatomComponent(() => {
  return <button onClick={() => increment()}>{count()}</button>
}, "Counter")
```

---

## Quick Reference

### Imports

```typescript
// Core
import { atom, computed, action, effect, wrap } from "@reatom/core";

// Collections
import {
  reatomArray,
  reatomRecord,
  reatomMap,
  reatomSet,
  reatomLinkedList,
} from "@reatom/core";

// Extensions
import {
  withAsyncData,
  withAsync,
  withAbort,
  withSearchParams,
  withLocalStorage,
  withSessionStorage,
  withIndexedDb,
  withBroadcastChannel,
  withConnectHook,
  withCallHook,
  withMiddleware,
} from "@reatom/core";

// Forms
import { reatomForm, reatomField } from "@reatom/core";

// React (prefer reatomComponent over hooks)
import { reatomComponent } from "@reatom/react";
// Avoid unless necessary: useAtom, useAction, useWrap, reatomContext

// Testing
import { test, expect, subscribe } from "@reatom/core/test";
```

### Cheat Sheet

```typescript
// State
const x = atom(initialValue, 'name')
x()                    // read
x.set(value)           // write
x.set(prev => ...)     // update

// Derived state
const y = computed(() => x() * 2, 'name')

// Side effects
const doSomething = action(async (param) => {
  const result = await wrap(fetchData(param))
  x.set(result)
}, 'name')

// React - always use reatomComponent with component name
const Component = reatomComponent(() => {
  const value = x()  // Direct call auto-subscribes
  return <div>{value}</div>
}, "Component")

// Persistence
const persisted = atom(0).extend(withLocalStorage('key'))

// Async with loading state
const resource = computed(async () => {
  return await wrap(fetch('/api'))
}, 'name').extend(withAsyncData({ initState: null }))

resource.ready()  // boolean
resource.data()   // data or initState
resource.error()  // Error or undefined
```
