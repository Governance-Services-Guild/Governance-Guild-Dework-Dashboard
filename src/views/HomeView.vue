<script setup>
import { ref, onMounted } from "vue";
import { useStore } from "../store/index";
import { useGetData } from "../composables/usegetdata";
import { useSortData } from "../composables/usesortdata";
import Chart from "chart.js/auto";
import { Colors } from "chart.js";

Chart.register(Colors);

const taskData = ref([])
const sortedData2 = ref([])
const sortedData = ref({})
const chartData = ref({})
let everyTask = [];
const store = useStore();
let lastRefresh = 0;
let chart = null;
/*
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
});*/

async function getData() {
  const { all_tasks } = await useGetData();
  taskData.value = all_tasks.value
  //console.log("test", taskData.value);
  const { sortedData } = await getStats();
  chartData.value = sortedData.value
  await createChart(chartData.value);
}

async function statsButton() {
  await createChart();
  /*const { sorted_data } = await getStats();
  sortedData2.value = sorted_data.value
  console.log('stats', sortedData2.value)
  const str = JSON.stringify(sortedData2);
  navigator.clipboard.writeText(str);*/
}

async function getStats() {
  const { sorted_data } = await useSortData();
  sortedData.value = sorted_data.value
  if (localStorage.getItem("alltasks") == null) {
          localStorage.setItem("alltasks", JSON.stringify(sortedData.value));
        }
  return { sortedData };
}

 async function createChart(sorted_data) {
  let projectLabels = []
  let projectLabelsData = []
  for (let i in sorted_data.taskTypes) {
    projectLabels.push(i)
    projectLabelsData.push(sorted_data.taskTypes[i].storypoints)
  }
  console.log("projectLabels",projectLabels, projectLabelsData)
  const label = projectLabels;
  const data = {
    labels: label,
    datasets: [
      {
        label: "total hours",
        data: projectLabelsData,
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)", // color for first bar
          "rgba(54, 162, 235, 0.2)", // color for second bar
          "rgba(255, 206, 86, 0.2)", // color for third bar
          // add more colors here for additional bars
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)", // border color for first bar
          "rgba(54, 162, 235, 1)", // border color for second bar
          "rgba(255, 206, 86, 1)", // border color for third bar
          // add more border colors here for additional bars
        ],
        borderWidth: 1,
      },
    ],
  };
  const config = {
    type: "bar",
    data: data,
    options: {
      scales: {
        y: {
          ticks: {
            color: "rgba(255, 255, 255, 0.87)",
          },
        },
        x: {
          ticks: {
            color: "rgba(255, 255, 255, 0.87)",
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  };

  if (chart) {
    chart.destroy();
    chart = null;
  }

  // Create a new chart instance
  const ctx = document.getElementById("myChart");
  chart = new Chart(ctx, config);
 }
</script>

<template>
  <main class="main">
    <div>
      <p>Home page</p>
      <button  @click="getData()">Get Data</button>
      <button  @click="statsButton()">Get Stats</button>
    </div>
    <div class="stat1">
          <canvas id="myChart"></canvas>
    </div>
  </main>
</template>

<style scoped>
.main {
  padding: 0.5rem;
}
.stat1 {
  border-radius: 8px;
  padding: 0.8em;
  margin: 0.8em;
}
</style>
