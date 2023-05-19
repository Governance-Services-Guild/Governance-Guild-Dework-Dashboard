<script setup>
import { ref, onMounted } from "vue";
import { useStore } from "../store/index";
import { useGetData } from "../composables/usegetdata";
import { fetchWorkspaceTasks } from "../api/workspace";
import { fetchTaskDetails } from "../api/task";
import Chart from "chart.js/auto";
import { Colors } from "chart.js";

Chart.register(Colors);


  const link = ref([]);
  const task_move_details = ref({});
  
const taskData = ref([])
const sortedData2 = ref([])
const sortedData = ref({})
const chartData = ref({})
const chart2Data = ref({})
const workspace = 'f0cea521-d319-4f02-a20a-7439998dbf82'
let everyTask = {};
let movedTasks = {};
const store = useStore();
let lastRefresh = 0;
let chart = null;
let chart2 = null;
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
    store.changeTasks(everyTask);
    if (everyTask == null) {
      // all_projects == null
      console.log("all_projects == null -> Reloading")
      await getData();
    } else {
      await getStats()
    }
  }
});

async function splitObjectIntoKeysAndValues(obj) {
    let keys = Object.keys(obj);
    let values = Object.values(obj);
    let results2 = [keys, values]

    return { results2 };
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
  
function taskMoveDetails(data) {
    let movesByMonth = {};  // a new object to store moves by month

    for (let i in data) {
        let moved = false;  // flag to check if a task has moved
        let creationMonth, doneMonth;

        // Get the creation month
        let creationDate = new Date(data[i].createdAt);
        creationMonth = creationDate.getFullYear() + '-' + ('0' + (creationDate.getMonth() + 1)).slice(-2);

        // Initialize creationMonth in movesByMonth if it's not present
        if (!movesByMonth[creationMonth]) {
            movesByMonth[creationMonth] = { moved: 0, not_moved: 0, created: 0, done: 0 };
        }
        
        // Increase creation count for the creation month
        movesByMonth[creationMonth].created++;

        // Get the done month if it exists
        if (data[i].doneAt) {
            let doneDate = new Date(data[i].doneAt);
            doneMonth = doneDate.getFullYear() + '-' + ('0' + (doneDate.getMonth() + 1)).slice(-2);
            
            // Initialize doneMonth in movesByMonth if it's not present
            if (!movesByMonth[doneMonth]) {
                movesByMonth[doneMonth] = { moved: 0, not_moved: 0, created: 0, done: 0 };
            }

            // Increase done count for the done month
            movesByMonth[doneMonth].done++;
        }

        for (let j in data[i].auditLog) {
            if (data[i].auditLog[j].diff[0].kind == "E") {
                let moveDate = new Date(data[i].auditLog[j].createdAt);
                let moveMonth = moveDate.getFullYear() + '-' + ('0' + (moveDate.getMonth() + 1)).slice(-2);  // Format date as 'yyyy-mm'

                // Initialize moveMonth in movesByMonth if it's not present
                if (!movesByMonth[moveMonth]) {
                    movesByMonth[moveMonth] = { moved: 0, not_moved: 0, created: 0, done: 0 };
                }

                // Increase move count for the specific month
                movesByMonth[moveMonth].moved++;
                moved = true;
            }
        }

        // If the task has not moved, increase the not_moved count for the months between creation and done
        if (!moved) {
            for (let moveMonth in movesByMonth) {
                // If doneMonth is undefined, then the task is still ongoing and not_moved should be incremented for all months after creationMonth
                // Otherwise, not_moved should be incremented for all months between creationMonth and doneMonth
                if ((doneMonth === undefined && moveMonth >= creationMonth) || 
                    (moveMonth >= creationMonth && moveMonth <= doneMonth)) {
                    movesByMonth[moveMonth].not_moved++;
                }
            }
        }
    }

    return movesByMonth;  // return movesByMonth object
}

function aggregateData(tasks) {
  const result = {
    tags: {},
    statusValues: {
      backlog: 0,
      todo: 0,
      in_progress: 0,
      in_review: 0,
      done: 0
    }
  };

  tasks.forEach((task) => {
    const creatorUsername = task.creator.username;

    // Track the creator of the task
    if (!result[creatorUsername]) {
      result[creatorUsername] = {
        storyPoints: 0,
        tasksCreated: 0,
        tasksDone: 0,
        tasksInvolved: 0,
        tags: {},
        statusValues: {
          backlog: 0,
          todo: 0,
          in_progress: 0,
          in_review: 0,
          done: 0
        }
      };
    }
    result[creatorUsername].tasksCreated++;

    // Aggregating storyPoints for assignees
    task.assignees.forEach((assignee) => {
      const { username } = assignee;
      if (!result[username]) {
        result[username] = {
          storyPoints: 0,
          tasksCreated: 0,
          tasksDone: 0,
          tasksInvolved: 0,
          tags: {},
          statusValues: {
            backlog: 0,
            todo: 0,
            in_progress: 0,
            in_review: 0,
            done: 0
          }
        };
      }
      result[username].storyPoints += task.storyPoints;
      result[username].tasksInvolved++;

      const status = task.status.toLowerCase();
      // Track the number of tasks done by the assignee
      if (status === 'done') {
        result[username].tasksDone++;
      }

      // Track the status of tasks for each assignee
      if (result[username].statusValues[status] !== undefined) {
        result[username].statusValues[status]++;
      }
    });

    // Aggregating storyPoints and task counts for tags
    task.tags.forEach((tag) => {
      const { label } = tag;
      if (!result.tags[label]) {
        result.tags[label] = {
          storyPoints: 0,
          tasks: 0,
        };
      }
      result.tags[label].storyPoints += task.storyPoints;
      result.tags[label].tasks++;

      // Add tags to each assignee
      task.assignees.forEach((assignee) => {
        const { username } = assignee;
        if (!result[username].tags[label]) {
          result[username].tags[label] = {
            storyPoints: 0,
            tasks: 0,
          };
        }
        result[username].tags[label].storyPoints += task.storyPoints;
        result[username].tags[label].tasks++;
      });
    });

    // Aggregating statusValues
    const status = task.status.toLowerCase();
    if (result.statusValues[status] !== undefined) {
      result.statusValues[status]++;
    }
  });

  return result;
}

async function getData() {
  console.log("Running getData")
  const data = await fetchWorkspaceTasks(workspace);
  console.log("data", data)
  const all_tasks = aggregateData(data.data.getWorkspace.tasks);
  const moved_tasks = taskMoveDetails(data.data.getWorkspace.tasks)
  console.log("All and moved_tasks",all_tasks, moved_tasks);
  if (localStorage.getItem("alltasks") == null) {
          localStorage.setItem("alltasks", JSON.stringify(all_tasks));
    }
  if (localStorage.getItem("movedtasks") == null) {
          localStorage.setItem("movedtasks", JSON.stringify(moved_tasks));
    }
  await getStats();
}

async function getStats() {
  everyTask = JSON.parse(localStorage.getItem("alltasks"));
  movedTasks = JSON.parse(localStorage.getItem("movedtasks"));
  console.log("all and moved", everyTask, movedTasks)
  const { results: results1 } = await splitComplexObjectIntoKeysAndTaskValues(everyTask.tags, 'tasks');
  const { results: results2 } = await splitComplexObjectIntoKeysAndTaskValues(everyTask.tags, 'storyPoints');
  const { results: results3 } = await splitObjectIntoKeysAndValues(everyTask.statusValues)
  let keysToRemove = ['github issue','Audited'];
  //let newResultsObj = await removeKeyValues(keysToRemove, { results });
  let keysToRemove2 = ['github issue','Audited'];
  //let newResultsObj2 = await removeKeyValues(keysToRemove2, { results2 });
  let newResultsObj = await removeKeyValues(keysToRemove, results1);
  let newResultsObj2 = await removeKeyValues(keysToRemove2, results2);
  console.log("everyTask",everyTask, newResultsObj)
  chartData.value = results1
  chart2Data.value = results2
  await createChart(newResultsObj);
  await createChart2(newResultsObj2);
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
</script>

<template>
  <main class="main">
    <div>
      <p>Home page</p>
      <button  @click="getData()">Get Data</button>
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
  margin: 0.8em;
  min-height: 300px;
  min-width: 500px;
}
.charts {
  display: flex;

}
</style>
