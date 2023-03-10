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
  const sorted_data = ref("");
  const assignees = ref([])

  async function sortData() {
    done.value = 0
    storypoints.value = 0
    // still busy building and testing
    console.log("sorted data", store.tasks)
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
    sorted_data.value = store.tasks
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
        }
        console.log(assignees.value)
        store.changeAssignees(assignees.value);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      loading.value = false;
    }
  }

  await sortData();
  await getAssignees();

  return { sorted_data };
}
