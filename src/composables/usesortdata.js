// mouse.js
import { ref } from "vue";
import { useStore } from "../store/index";
import { supabase } from "../supabase";

// by convention, composable function names start with "use"
export async function useSortData() {
  const store = useStore();
  const loading = ref(true);
  
  const completedTasks = ref([])
  const completedTasktypes = ref([])
  const sorted_data = ref("");

  async function sortData() {
    // still busy building and testing
    console.log("sorted data", store.tasks)
    for (let i in store.tasks) {
      store.tasks[i]
    }
    sorted_data.value = "yes"
  }

  await sortData();

  return { sorted_data };
}
