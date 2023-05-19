<script>
import { ref, onMounted } from "vue";
import { fetchWorkspaceTasks } from "../api/workspace";
import { fetchTaskDetails } from "../api/task";

  const taskId = "7475aab2-3d05-4ffa-9e3e-5e7f8f3d1f36";
  const workspace = "f0cea521-d319-4f02-a20a-7439998dbf82";
  const data2 = await fetchTaskDetails(taskId);
  const data = await fetchWorkspaceTasks(workspace);
  const link = ref([]);
  const task_move_details = ref({});
  console.log(data);
  console.log(data2);
  const { test, movesByMonth } = await taskMoveDetails(data.data.getWorkspace.tasks)
  console.log(test, movesByMonth)

  function splitObjectIntoKeysAndValues(obj) {
    let keys = Object.keys(obj);
    let values = Object.values(obj);

    return [keys, values];
  }
  
  async function taskMoveDetails(data) {
  let test = {}
  let movesByMonth = {};  // a new object to store moves by month
  for (let k in data) {
    link.value.push(data[k].id);
  }
  for (let i in link.value) {
    task_move_details.value[link.value[i]] = {};
    task_move_details.value[link.value[i]]["moved"] = 0;
    for (let j in data[i].auditLog) {
      if (data[i].auditLog[j].diff[0].kind == "E") {
        let moveDate = new Date(data[i].auditLog[j].createdAt);
        let moveMonth = moveDate.getFullYear() + '-' + ('0' + (moveDate.getMonth()+1)).slice(-2);  // Format date as 'yyyy-mm'

        // Increase move count for the specific month
        if (!movesByMonth[moveMonth]) {
          movesByMonth[moveMonth] = { moved: 1 };
        } else {
          movesByMonth[moveMonth].moved++;
        }

        task_move_details.value[link.value[i]]["moved"]++;
      }
    }
  }
  test = task_move_details.value;
  return { test, movesByMonth };  // return both the test object and movesByMonth object
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

const aggregatedData = aggregateData(data.data.getWorkspace.tasks);
console.log(aggregatedData);

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