export async function useGetTaskMoveDetails(data) {
  let moved_tasks = {};  // a new object to store moves by month

  for (let i in data) {
      let moved = false;  // flag to check if a task has moved
      let creationMonth, doneMonth;

      // Get the creation month
      let creationDate = new Date(data[i].createdAt);
      creationMonth = creationDate.getFullYear() + '-' + ('0' + (creationDate.getMonth() + 1)).slice(-2);

      // Initialize creationMonth in moved_tasks if it's not present
      if (!moved_tasks[creationMonth]) {
          moved_tasks[creationMonth] = { moved: 0, not_moved: 0, created: 0, done: 0 };
      }
      
      // Increase creation count for the creation month
      moved_tasks[creationMonth].created++;

      // Get the done month if it exists
      if (data[i].doneAt) {
          let doneDate = new Date(data[i].doneAt);
          doneMonth = doneDate.getFullYear() + '-' + ('0' + (doneDate.getMonth() + 1)).slice(-2);
          
          // Initialize doneMonth in moved_tasks if it's not present
          if (!moved_tasks[doneMonth]) {
              moved_tasks[doneMonth] = { moved: 0, not_moved: 0, created: 0, done: 0 };
          }

          // Increase done count for the done month
          moved_tasks[doneMonth].done++;
      }

      for (let j in data[i].auditLog) {
          if (data[i].auditLog[j].diff[0].kind == "E") {
              let moveDate = new Date(data[i].auditLog[j].createdAt);
              let moveMonth = moveDate.getFullYear() + '-' + ('0' + (moveDate.getMonth() + 1)).slice(-2);  // Format date as 'yyyy-mm'

              // Initialize moveMonth in moved_tasks if it's not present
              if (!moved_tasks[moveMonth]) {
                  moved_tasks[moveMonth] = { moved: 0, not_moved: 0, created: 0, done: 0 };
              }

              // Increase move count for the specific month
              moved_tasks[moveMonth].moved++;
              moved = true;
          }
      }

      // If the task has not moved, increase the not_moved count for the months between creation and done
      if (!moved) {
          for (let moveMonth in moved_tasks) {
              // If doneMonth is undefined, then the task is still ongoing and not_moved should be incremented for all months after creationMonth
              // Otherwise, not_moved should be incremented for all months between creationMonth and doneMonth
              if ((doneMonth === undefined && moveMonth >= creationMonth) || 
                  (moveMonth >= creationMonth && moveMonth <= doneMonth)) {
                  moved_tasks[moveMonth].not_moved++;
              }
          }
      }
  }

  return { moved_tasks };  // return moved_tasks object
}