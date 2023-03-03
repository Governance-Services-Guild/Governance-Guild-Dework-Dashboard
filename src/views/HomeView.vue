<script setup>
import { ref, onMounted } from "vue";
import { useStore } from "../store/index";
import { useGetData } from "../composables/usegetdata";
import { useSortData } from "../composables/usesortdata";

const taskData = ref([])
const sortedData = ref([])
let everyTask = [];
const store = useStore();
let lastRefresh = 0;

onMounted(async () => {
  lastRefresh = parseInt(localStorage.getItem("refreshtime"))
    ? parseInt(localStorage.getItem("refreshtime"))
    : 0;
  //localStorage.removeItem("alltasks");
  if (parseInt(lastRefresh) < parseInt(Date.now()) - 300000) {
    localStorage.setItem("refreshtime", Date.now());
    lastRefresh = Date.now();
    console.log("Reloading", everyTask, Date.now());
    localStorage.removeItem("alltasks");
    await getData();
  }
  everyTask = JSON.parse(localStorage.getItem("alltasks"));
  store.changeTasks(everyTask);
  if (everyTask == null) {
    // all_projects == null
    console.log("all_projects == null -> Reloading")
    await getData();
  } else {
    await getStats();
  }
});

async function getData() {
  const { all_tasks } = await useGetData();
  taskData.value = all_tasks.value
  console.log("test", taskData.value);
  await getStats();
}


async function getStats() {
  const { sorted_data } = await useSortData();
  sortedData.value = sorted_data.value
  console.log('stats', sortedData.value)

  const str = JSON.stringify(sortedData.value);
  navigator.clipboard.writeText(str);
}

</script>

<template>
  <main class="main">
    <div>
      <p>Home page</p>
      <button  @click="getData()">Get Data</button>
      <button  @click="getStats()">Get Stats</button>
    </div>
  </main>
</template>

<style scoped>
.main {
  padding: 0.5rem;
}
</style>
