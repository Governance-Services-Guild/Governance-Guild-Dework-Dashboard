<script setup>
import { ref, onMounted } from "vue";
import { useGetAggregateData } from "../composables/usegetaggregatedata";
import { useGetTaskMoveDetails } from "../composables/usegettaskmovedetails";
import { useGetDoneTasks } from "../composables/usegetdonetasks";
import { useGetCurrentTasks } from "../composables/usegetcurrenttasks";
import { fetchWorkspaceTasks } from "../api/workspace";
import Chart from "chart.js/auto";
import { Colors } from "chart.js";

Chart.register(Colors);

const workspace = 'f0cea521-d319-4f02-a20a-7439998dbf82'

let everyTask = {};
let movedTasks = {};
let reporttasks = {};
let lastRefresh = 0;
let chart = null;
let chart2 = null;
let chart3 = null;
let chart4 = null;
let tasksDone = ref()
let decisionsMade = ref()
let reportTasks = ref()
const report = ref()
const loading = ref(false)


onMounted(async () => {
  lastRefresh = parseInt(localStorage.getItem("refreshtime"))
    ? parseInt(localStorage.getItem("refreshtime"))
    : 0;
  if (parseInt(lastRefresh) < parseInt(Date.now()) - 30000) {
    localStorage.setItem("refreshtime", Date.now());
    lastRefresh = Date.now();
    localStorage.removeItem("alltasks");
    localStorage.removeItem("movedtasks");
    localStorage.removeItem("reporttasks");
    await getData();
  } else {
    everyTask = JSON.parse(localStorage.getItem("alltasks"));
    movedTasks = JSON.parse(localStorage.getItem("movedtasks"));
    reporttasks = JSON.parse(localStorage.getItem("reporttasks"));
    if (everyTask == null) {
      // all_projects == null
      //console.log("all_projects == null -> Reloading")
      await getData();
    } else {
      await getStats()
    }
  }
});
async function getReport(tasks) {
  let text = 'State what has been done this month based on the following list of tasks - ' 
  + tasks + 
  '. Keep in mind that these tasks are performed by Governance Guild.';
  try {
    await navigator.clipboard.writeText(text);
    console.log('Text copied to clipboard');
  } catch (err) {
    console.log('Failed to copy text: ', err);
  }
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

function getTaskNames(tasks) {
    let taskNames = [];
    for (let task of tasks) {
        if (task.subtasks && task.subtasks.length > 0) {
            //taskNames.push(task.name)
            for (let subtask of task.subtasks) {
              taskNames.push(subtask.name);
            }
        } else if (task.name && !task.name.toLowerCase().includes("activity list")) {
            taskNames.push(task.name);
        }
    }
    return taskNames.join(', ');
}

async function getData() {
  loading.value = true
  const data = await fetchWorkspaceTasks(workspace);
  const all_tasks = await useGetAggregateData(data.data.getWorkspace.tasks);
  const moved_tasks = await useGetTaskMoveDetails(data.data.getWorkspace.tasks)
  const done_tasks = await useGetDoneTasks(data.data.getWorkspace.tasks)
  const current_tasks = await useGetCurrentTasks(data.data.getWorkspace.tasks)
  const done = getTaskNames(done_tasks.done_tasks)
  const current = getTaskNames(current_tasks.current_tasks)
  reportTasks.value = done + ", "+ current
  if (localStorage.getItem("alltasks") == null) {
          localStorage.setItem("alltasks", JSON.stringify(all_tasks.all_tasks));
    }
  if (localStorage.getItem("movedtasks") == null) {
          localStorage.setItem("movedtasks", JSON.stringify(moved_tasks.moved_tasks));
    }
  if (localStorage.getItem("reporttasks") == null) {
          localStorage.setItem("reporttasks", JSON.stringify(reportTasks.value));
    }
  await getStats();
  loading.value = false
}

async function getStats() {
  reporttasks = JSON.parse(localStorage.getItem("reporttasks"));
  everyTask = JSON.parse(localStorage.getItem("alltasks"));
  movedTasks = JSON.parse(localStorage.getItem("movedtasks"));
  reportTasks.value = reporttasks
  const { results: results1 } = await splitComplexObjectIntoKeysAndTaskValues(everyTask.tags, 'tasks');
  const { results: results2 } = await splitComplexObjectIntoKeysAndTaskValues(everyTask.tags, 'storyPoints');
  const { results: results3 } = await splitObjectIntoKeysAndValues(everyTask.statusValues);
  var transformedData = transformData(movedTasks);
  let keysToRemove = ['github issue','Audited'];
  let keysToRemove2 = ['github issue','Audited'];
  let keysToRemove3 = ['done'];
  let newResultsObj = await removeKeyValues(keysToRemove, results1);
  let newResultsObj2 = await removeKeyValues(keysToRemove2, results2);
  let newResultsObj3 = await removeKeyValues(keysToRemove3, results3);
  tasksDone.value = everyTask.statusValues.done
  decisionsMade.value = everyTask.tags.Decision.tasks
  await createChart(newResultsObj);
  await createChart2(newResultsObj2);
  await createChart3(newResultsObj3);
  await createChart4(transformedData);
}

 async function createChart(chartdata2) {
  let projectLabels = chartdata2[0]
  let projectLabelsData = chartdata2[1]
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
      <div>
        <h1>Governance Guild Dework Stats</h1>
      </div>
      <div class="chartsbox">
        <div class="charts2">
          <div class="stat2">
            <h2>Monthly performance</h2>
            <canvas id="myChart4"></canvas>
          </div>
          <div>
          <p>Total Tasks done {{ tasksDone }}</p>
          <p>Decisions made {{ decisionsMade }}</p>
          <button v-on:click="getReport(reportTasks)">Generate Chat GPT prompt</button>
          <p>{{ report }}</p>
        </div>
        </div>
        <div class="charts">
          <div class="stat1">
            <h2>Current Status of Tasks</h2>
            <canvas id="myChart3"></canvas>
          </div>
          <div class="stat1">
            <h2>Total tasks per task type</h2>
            <canvas id="myChart"></canvas>
          </div>
          <div class="stat1">
            <h2>Total hours per task type</h2>
            <canvas id="myChart2"></canvas>
          </div>
        </div>
      </div>
    </div>
    <div></div>
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
  margin-bottom: 4em;
  max-height: 400px;
  min-width: 800px;
}
.charts {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
}
.charts2 {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
}
.chartsbox {
  display: flex;
}
</style>
