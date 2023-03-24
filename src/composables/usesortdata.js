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

  async function sortData() {
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
    //sorted_data.value = store.tasks
  }

  async function getAssignees() {
    // still busy building and testing
    try {
      loading.value = true;
      let { data, error, status } = await supabase
        .from("assignees")
        .select(`name`)

      if (error && status !== 406) throw error;
      if (data) {
        for (let i in data) {
          assignees.value.push(data[i].name)
          sorted_data.value[data[i].name] = {}
          sorted_data.value[data[i].name]["storypoints"] = 0;
          sorted_data.value[data[i].name]["tasks"] = 0;
          sorted_data.value[data[i].name]["tasks_done"] = 0;
        }
        console.log(assignees.value)
        store.changeAssignees(assignees.value); 
        store.changeSortedData(sorted_data.value);     
      }
    } catch (error) {
      alert(error.message);
    } finally {
      loading.value = false;
    }
  }

  async function buildAssignees() {
    // still busy building and testing
    let name = ""
    //sorted_data.value = store.sortedData
    for (let i in store.assignees) {
      try {
        loading.value = true;
        let { data, error, status } = await supabase
          .from("tasks")
          .select()
          .ilike('assignees', `%${store.assignees[i]}%`)
  
        if (error && status !== 406) throw error;
        if (data) {
          for (let j in data) {
            sorted_data.value[store.assignees[i]].storypoints = sorted_data.value[store.assignees[i]].storypoints + data[j].storypoints
            sorted_data.value[store.assignees[i]].tasks = sorted_data.value[store.assignees[i]].tasks + 1
            if (data[j].status == "DONE") {
              sorted_data.value[store.assignees[i]].tasks_done = sorted_data.value[store.assignees[i]].tasks_done + 1
            }
          }
          console.log("store.assignees[i]", store.assignees[i], data, data[i].storypoints)
        }
      } catch (error) {
        alert(error.message);
      } finally {
        loading.value = false;
      }
    }
    console.log("sorted_data.value", sorted_data.value)
  }

  async function getTags() {
    // still busy building and testing
    let name = ""
    for (let i in store.assignees) {
      try {
        loading.value = true;
        let { data, error, status } = await supabase
          .from("tasks")
          .select()
          .ilike('tags', `%${store.tags[i]}%`)
  
        if (error && status !== 406) throw error;
        if (data) {
          console.log("store.assignees[i]", store.assignees[i], data)
        }
      } catch (error) {
        alert(error.message);
      } finally {
        loading.value = false;
      }
    }
  }

  await sortData();
  await getAssignees();
  await buildAssignees();

  return { sorted_data };
}
