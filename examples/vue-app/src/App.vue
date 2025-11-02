<script setup lang="ts">
import { ref } from "vue";
import { useSQLiteQuery, useSQLiteClientAsync } from "@alexop/sqlite-vue";

const { rows: todos, loading, error, refresh } = useSQLiteQuery(
  "SELECT * FROM todos ORDER BY rowid DESC",
  [],
  ["todos"]
);

const newTitle = ref("");
const editingId = ref<string | null>(null);
const editingTitle = ref("");

// Get the client promise during setup
const dbPromise = useSQLiteClientAsync();

async function addTodo() {
  if (!newTitle.value.trim()) return;

  const db = await dbPromise;
  await db.exec(
    "INSERT INTO todos (id, title) VALUES (?, ?)",
    [crypto.randomUUID(), newTitle.value]
  );
  db.notifyTable("todos");
  newTitle.value = "";
  await refresh();
}

async function deleteTodo(id: string) {
  const db = await dbPromise;
  await db.exec("DELETE FROM todos WHERE id = ?", [id]);
  db.notifyTable("todos");
  await refresh();
}

function startEdit(todo: any) {
  editingId.value = todo.id;
  editingTitle.value = todo.title;
}

function cancelEdit() {
  editingId.value = null;
  editingTitle.value = "";
}

async function updateTodo(id: string) {
  if (!editingTitle.value.trim()) return;

  const db = await dbPromise;
  await db.exec(
    "UPDATE todos SET title = ? WHERE id = ?",
    [editingTitle.value, id]
  );
  db.notifyTable("todos");
  editingId.value = null;
  editingTitle.value = "";
  await refresh();
}
</script>

<template>
  <main class="p-6">
    <h1 class="text-2xl font-bold mb-4">SQLite Vue test</h1>

    <form class="flex gap-2 mb-4" @submit.prevent="addTodo">
      <input
        v-model="newTitle"
        class="border px-2 py-1 rounded flex-1"
        placeholder="Todo title"
      />
      <button
        type="submit"
        class="bg-blue-600 text-white px-4 py-1 rounded"
      >
        Add
      </button>
    </form>

    <p v-if="loading">Loading...</p>
    <p v-if="error">{{ error.message }}</p>

    <ul v-if="todos.length" class="space-y-2">
      <li
        v-for="t in todos"
        :key="t.id"
        class="flex items-center gap-2 p-3 border rounded bg-white"
      >
        <!-- Edit mode -->
        <template v-if="editingId === t.id">
          <input
            v-model="editingTitle"
            class="border px-2 py-1 rounded flex-1"
            @keyup.enter="updateTodo(t.id)"
            @keyup.esc="cancelEdit"
            autofocus
          />
          <button
            @click="updateTodo(t.id)"
            class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            Save
          </button>
          <button
            @click="cancelEdit"
            class="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
          >
            Cancel
          </button>
        </template>

        <!-- View mode -->
        <template v-else>
          <span class="flex-1">{{ t.title }}</span>
          <button
            @click="startEdit(t)"
            class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            @click="deleteTodo(t.id)"
            class="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
          >
            Delete
          </button>
        </template>
      </li>
    </ul>
    <p v-else class="text-gray-500">No todos yet.</p>
  </main>
</template>
