// mouse.js
import { ref } from "vue";
import { useStore } from "../store/index";
import { supabase } from "../supabase";

// by convention, composable function names start with "use"
export async function useGetData() {
  const store = useStore();
  const loading = ref(true);

  const all_tasks = ref([]);

  async function getProjectData() {
    // still busy building and testing
    try {
      loading.value = true;
      let { data, error, status } = await supabase
        .from("tasks")
        .select(`task_id, storypoints, title, status, link, backlog, to_do, in_progress, in_review, done, dework_created_on, dework_completed_on, due_date, assignees, tags`)
        .eq("group", "governance-guild");

      if (error && status !== 406) throw error;
      if (data) {
        all_tasks.value = data;
        store.changeTasks(all_tasks.value);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      loading.value = false;
    }
  }

  await getProjectData();

  return { all_tasks };
}
