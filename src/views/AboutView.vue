<script>
import { fetchWorkspaceTasks } from "../api/workspace";
import { fetchTaskDetails } from "../api/task";

export default {
  async mounted() {
    const data = await fetchWorkspaceTasks();
    const taskId = "7475aab2-3d05-4ffa-9e3e-5e7f8f3d1f36";
    const data2 = await fetchTaskDetails(taskId);
    console.log(data);
    console.log(data2);
  },
};
</script>

<template>
  <main class="main">
    <div>
      <p>About</p>
    </div>
  </main>
</template>

<style scoped>
.main {
  padding: 0.5rem;
}
</style>