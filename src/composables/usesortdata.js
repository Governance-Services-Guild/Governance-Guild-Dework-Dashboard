// mouse.js
import { ref } from "vue";
import { useStore } from "../store/index";
import { supabase } from "../supabase";

// by convention, composable function names start with "use"
export async function useSortData() {
  const store = useStore();
  const loading = ref(true);
  
  const completedTasks = ref([])
  let done = ref(0)
  let inprogress = ref(0)
  let todo = ref(0)
  let backlog = ref(0)
  let inreview = ref(0)
  let storypoints = ref(0)
  const completedTasktypes = ref([])
  const sorted_data = ref({});
  const assignees = ref([])
  const tags = ref([])

  async function sortData() {
    sorted_data.value['tasks'] = {}
    sorted_data.value['tasks']['backlog'] = 0
    sorted_data.value['tasks']['todo'] = 0
    sorted_data.value['tasks']['in_progress'] = 0
    sorted_data.value['tasks']['in_review'] = 0
    sorted_data.value['tasks']['done'] = 0
    done.value = 0
    storypoints.value = 0
    // still busy building and testing
    console.log("store.tasks", store.tasks)
    for (let i in store.tasks) {
      storypoints.value = storypoints.value + store.tasks[i].storypoints
      switch(store.tasks[i].status) {
        case 'DONE':
          done.value++
          break;
        case 'IN_PROGRESS':
          inprogress.value++
          break;
        case 'TODO':
          todo.value++
          break;
        case 'BACKLOG':
          backlog.value++
          break;
        case 'IN_REVIEW':
          inreview.value++
          break;
        default:
          console.log("Nothing happened")
          break;
      }
      console.log(store.tasks[i].status, done.value)
    }
    console.log("storypoints", storypoints.value, done.value, todo.value)
    sorted_data.value['tasks']['backlog'] = backlog.value
    sorted_data.value['tasks']['todo'] = todo.value
    sorted_data.value['tasks']['in_progress'] = inprogress.value
    sorted_data.value['tasks']['in_review'] = inreview.value
    sorted_data.value['tasks']['done'] = done.value
    //sorted_data.value = store.tasks
  }

  async function getAssignees() {
    // still busy building and testing
    try {
      loading.value = true;
      let { data, error, status } = await supabase
        .from("assignees")
        .select(`name, tasks, tasks_done`)

      if (error && status !== 406) throw error;
      if (data) {
        for (let i in data) {
          assignees.value.push(data[i].name)
          sorted_data.value[data[i].name] = {}
          sorted_data.value[data[i].name]["storypoints"] = data[i].storypoints;
          sorted_data.value[data[i].name]["tasks"] = data[i].tasks;
          sorted_data.value[data[i].name]["tasks_done"] = data[i].tasks_done;
        }
        console.log(assignees.value, "data", data)
        store.changeAssignees(assignees.value); 
        store.changeSortedData(sorted_data.value);     
      }
    } catch (error) {
      alert(error.message);
    } finally {
      loading.value = false;
    }
  }

  async function getTags() {
    // still busy building and testing
    try {
      loading.value = true;
      let { data, error, status } = await supabase
        .from("tags")
        .select(`tag, storypoints, tasks, tasks_done, tasks_backlog, tasks_in_progress, tasks_in_review, tasks_todo`)

      if (error && status !== 406) throw error;
      if (data) {
        sorted_data.value['taskTypes'] = {};
        for (let i in data) {
          if (data[i].tag != "github issue" && data[i].tag != "") {
            tags.value.push(data[i].tag)
            sorted_data.value['taskTypes'][data[i].tag] = {}
            sorted_data.value['taskTypes'][data[i].tag]["storypoints"] = data[i].storypoints;
            sorted_data.value['taskTypes'][data[i].tag]["tasks"] = data[i].tasks;
            sorted_data.value['taskTypes'][data[i].tag]["tasks_done"] = data[i].tasks_done;
            sorted_data.value['taskTypes'][data[i].tag]["tasks_backlog"] = data[i].tasks_backlog;
            sorted_data.value['taskTypes'][data[i].tag]["tasks_todo"] = data[i].tasks_todo;
            sorted_data.value['taskTypes'][data[i].tag]["tasks_in_progress"] = data[i].tasks_in_progress;
            sorted_data.value['taskTypes'][data[i].tag]["tasks_in_review"] = data[i].tasks_in_review;
          } 
        }
        console.log(tags.value, "data", data)
        store.changeTags(tags.value); 
        store.changeSortedData(sorted_data.value);     
      }
    } catch (error) {
      alert(error.message);
    } finally {
      loading.value = false;
    }
  }

  await sortData();
  await getAssignees();
  await getTags();

  return { sorted_data };
}
