import { ref } from "vue";
import { supabase } from "../supabase";

export async function useGetMovements(workspace) {

  function getLatestDate(dates) {
    return new Date(Math.max.apply(null, dates));
  }

  async function getMonthlyMovements() {
    // Get all tasks from the table
    const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("workspace", workspace);
    console.log("movement tasks", tasks)
    
    if (error) {
      console.error("Error fetching tasks:", error);
      return;
    }
  
    // Initialize the result object
  const result = {};

  tasks.forEach(task => {
    // Process created tasks on the project board
    if (task.dework_created_on) {
      const createdMonth = new Date(task.dework_created_on).toISOString().slice(0, 7);

      if (!result[createdMonth]) {
        result[createdMonth] = {
          created: 0,
          moved: 0,
          done: 0,
          not_moved: 0,
        };
      }
      result[createdMonth].created++;
    }

    // Process completed tasks
    if (task.dework_completed_on) {
      const completedMonth = new Date(task.dework_completed_on).toISOString().slice(0, 7);

      if (!result[completedMonth]) {
        result[completedMonth] = {
          created: 0,
          moved: 0,
          done: 0,
          not_moved: 0,
        };
      }
      result[completedMonth].done++;
    }

    // Process moved and not moved tasks
    if (task.created_at) {
      const addedMonth = new Date(task.created_at).toISOString().slice(0, 7);
    
      if (!result[addedMonth]) {
        result[addedMonth] = {
          created: 0,
          moved: 0,
          done: 0,
          not_moved: 0,
        };
      }
    
      if (task.todo || task.in_progress || task.in_review) {
        result[addedMonth].moved++;
      } else if (!task.dework_completed_on) {  // Exclude tasks that are already done
        result[addedMonth].not_moved++;
      }
    }
  });

  return result;
}

(async () => {
  const monthlyMovements = await getMonthlyMovements();
  console.log("Monthly movements:", monthlyMovements);
})();

  const results = await getMonthlyMovements();

  return { results };
}
