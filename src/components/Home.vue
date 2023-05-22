<script setup>
import { ref, onMounted } from "vue";
import { useGetAggregateData } from "../composables/usegetaggregatedata";
import { useGetTaskMoveDetails } from "../composables/usegettaskmovedetails";
import { fetchWorkspaceTasks } from "../api/workspace";
import Chart from "chart.js/auto";
import { Colors } from "chart.js";
import { HfInference } from '@huggingface/inference'

const hf = new HfInference(import.meta.env.VITE_HUGGING_TEST)

Chart.register(Colors);

const workspace = 'f0cea521-d319-4f02-a20a-7439998dbf82'

let everyTask = {};
let movedTasks = {};
let lastRefresh = 0;
let chart = null;
let chart2 = null;
let chart3 = null;
let chart4 = null;
let tasksDone = ref()
let decisionsMade = ref()


onMounted(async () => {
  lastRefresh = parseInt(localStorage.getItem("refreshtime"))
    ? parseInt(localStorage.getItem("refreshtime"))
    : 0;
  //localStorage.removeItem("alltasks");
  if (parseInt(lastRefresh) < parseInt(Date.now()) - 30000) {
    localStorage.setItem("refreshtime", Date.now());
    lastRefresh = Date.now();
    console.log("Reloading", everyTask, Date.now());
    localStorage.removeItem("alltasks");
    localStorage.removeItem("movedtasks");
    await getData();
  } else {
    everyTask = JSON.parse(localStorage.getItem("alltasks"));
    movedTasks = JSON.parse(localStorage.getItem("movedtasks"));
    if (everyTask == null) {
      // all_projects == null
      console.log("all_projects == null -> Reloading")
      await getData();
    } else {
      await getStats()
    }
  }
});

async function huggingtest(everyTask) {
  const test = await hf.summarization({
  model: 'facebook/bart-large-cnn',
  inputs:
    'The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest man-made structure in the world, a title it held for 41 years until the Chrysler Building in New York City was finished in 1930.',
  parameters: {
    max_length: 100
  }
})
console.log("test", test)
}


async function splitObjectIntoKeysAndValues(obj) {
    let keys = Object.keys(obj);
    let values = Object.values(obj);
    let results = [keys, values]

    return { results };
  }

  async function splitComplexObjectIntoKeysAndTaskValues(obj, keyToLookFor) {
    let keys = Object.keys(obj);
    let values = Object.values(obj).map(value => value[keyToLookFor]);
    let results = [keys, values]

    return { results };
}

async function removeKeyValues(keysToRemove, results) {
  if (!results || !Array.isArray(results)) {
    console.error("Invalid results argument", results);
    throw new Error("Invalid results argument");
  }

  let keysArray = results[0];
  let valuesArray = results[1];

  keysToRemove.forEach(keyToRemove => {
    let index = keysArray.indexOf(keyToRemove);
    if (index > -1) {
      keysArray.splice(index, 1);
      valuesArray.splice(index, 1);
    }
  });

  return [keysArray, valuesArray];
}

function transformData(data) {
    var result = [];
    for (var key in data) {
        var newObj = data[key];
        newObj['x'] = key;
        result.push(newObj);
    }
    return result;
}

async function getData() {
  console.log("Running getData")
  const data = await fetchWorkspaceTasks(workspace);
  console.log("data", data.data.getWorkspace.tasks)
  const all_tasks = await useGetAggregateData(data.data.getWorkspace.tasks);
  const moved_tasks = await useGetTaskMoveDetails(data.data.getWorkspace.tasks)
  console.log("All and moved_tasks",all_tasks.all_tasks, moved_tasks.moved_tasks);
  if (localStorage.getItem("alltasks") == null) {
          localStorage.setItem("alltasks", JSON.stringify(all_tasks.all_tasks));
    }
  if (localStorage.getItem("movedtasks") == null) {
          localStorage.setItem("movedtasks", JSON.stringify(moved_tasks.moved_tasks));
    }
  await getStats();
}

async function getStats() {
  everyTask = JSON.parse(localStorage.getItem("alltasks"));
  movedTasks = JSON.parse(localStorage.getItem("movedtasks"));
  console.log("all and moved", everyTask, movedTasks)
  const { results: results1 } = await splitComplexObjectIntoKeysAndTaskValues(everyTask.tags, 'tasks');
  const { results: results2 } = await splitComplexObjectIntoKeysAndTaskValues(everyTask.tags, 'storyPoints');
  const { results: results3 } = await splitObjectIntoKeysAndValues(everyTask.statusValues);
  var transformedData = transformData(movedTasks);
  console.log("transformedData", transformedData)
  let keysToRemove = ['github issue','Audited'];
  let keysToRemove2 = ['github issue','Audited'];
  let keysToRemove3 = ['done'];
  let newResultsObj = await removeKeyValues(keysToRemove, results1);
  let newResultsObj2 = await removeKeyValues(keysToRemove2, results2);
  let newResultsObj3 = await removeKeyValues(keysToRemove3, results3);
  console.log("everyTask",everyTask, newResultsObj)
  await createChart(newResultsObj);
  await createChart2(newResultsObj2);
  await createChart3(newResultsObj3);
  await createChart4(transformedData);
  await huggingtest(everyTask);
}

 async function createChart(chartdata2) {
  let projectLabels = chartdata2[0]
  let projectLabelsData = chartdata2[1]
  
  console.log("projectLabels",projectLabels, projectLabelsData)
  const label = projectLabels;
  const data = {
    labels: label,
    datasets: [
      {
        label: "total tasks",
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

 async function createChart2(chartdata2) {
  let projectLabels = chartdata2[0]
  let projectLabelsData = chartdata2[1]
  
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

  if (chart2) {
    chart2.destroy();
    chart2 = null;
  }

  // Create a new chart instance
  const ctx = document.getElementById("myChart2");
  chart2 = new Chart(ctx, config);
 }

 async function createChart3(chartdata3) {
  let projectLabels = chartdata3[0]
  let projectLabelsData = chartdata3[1]
  
  console.log("projectLabels",projectLabels, projectLabelsData)
  const label = projectLabels;
  const data = {
    labels: label,
    datasets: [
      {
        label: "total tasks",
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

  if (chart3) {
    chart3.destroy();
    chart3 = null;
  }

  // Create a new chart instance
  const ctx = document.getElementById("myChart3");
  chart3 = new Chart(ctx, config);
 }

 async function createChart4(chartdata4) {
  let projectLabels = chartdata4[0]
  let projectLabelsData = chartdata4[1]
  
  console.log("projectLabels",projectLabels, projectLabelsData)
  const label = projectLabels;
  const data = chartdata4
  const config = {
  type: 'bar',
  data: {
    labels: Object.keys(movedTasks),
    datasets: [{
      label: 'Tasks Created',
      data: data,
      parsing: {
        yAxisKey: 'created'
      }
    }, {
      label: 'Tasks Done',
      data: data,
      parsing: {
        yAxisKey: 'done'
      }
    }, {
      label: 'Task Movements',
      data: data,
      parsing: {
        yAxisKey: 'moved'
      }
    }, {
      label: 'Idle Tasks',
      data: data,
      parsing: {
        yAxisKey: 'not_moved'
      }
    }]
  },
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
        display: true,
      },
    },
  },
};

  if (chart4) {
    chart4.destroy();
    chart4 = null;
  }

  // Create a new chart instance
  const ctx = document.getElementById("myChart4");
  chart4 = new Chart(ctx, config);
 }

</script>

<template>
  <main class="main">
    <div>
      <h1>Governance Guild Dework Stats</h1>
    </div>
    <div class="chartsbox">
      <div class="charts">
        <div class="stat2">
          <h2>Monthly performance</h2>
          <canvas id="myChart4"></canvas>
        </div>
      </div>
      <div class="charts">
        <div class="stat1">
          <h2>Total tasks per task type</h2>
          <canvas id="myChart"></canvas>
        </div>
        <div class="stat1">
          <h2>Total hours per task type</h2>
          <canvas id="myChart2"></canvas>
        </div>
        <div class="stat1">
          <h2>Current Status of Tasks</h2>
          <canvas id="myChart3"></canvas>
        </div>
      </div>
    </div>
    <div>
      <div>
        <p>Tasks done {{ tasksDone }}</p>
        <p>Decisions made {{ decisionsMade }}</p>
      </div>
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
  margin: 0.2em;
  min-height: 320px;
  min-width: 480px;
}
.stat2 {
  border-radius: 8px;
  padding: 0.8em;
  margin: 0.2em;
  max-height: 400px;
  min-width: 800px;
}
.charts {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
}
.charts {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
}
.chartsbox {
  display: flex;
}
</style>
