export async function useGetAggregateData(tasks) {
  const all_tasks = {
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
    if (!all_tasks[creatorUsername]) {
      all_tasks[creatorUsername] = {
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
    all_tasks[creatorUsername].tasksCreated++;

    // Aggregating storyPoints for assignees
    task.assignees.forEach((assignee) => {
      const { username } = assignee;
      if (!all_tasks[username]) {
        all_tasks[username] = {
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
      all_tasks[username].storyPoints += task.storyPoints;
      all_tasks[username].tasksInvolved++;

      const status = task.status.toLowerCase();
      // Track the number of tasks done by the assignee
      if (status === 'done') {
        all_tasks[username].tasksDone++;
      }

      // Track the status of tasks for each assignee
      if (all_tasks[username].statusValues[status] !== undefined) {
        all_tasks[username].statusValues[status]++;
      }
    });

    // Aggregating storyPoints and task counts for tags
    task.tags.forEach((tag) => {
      const { label } = tag;
      if (!all_tasks.tags[label]) {
        all_tasks.tags[label] = {
          storyPoints: 0,
          tasks: 0,
        };
      }
      all_tasks.tags[label].storyPoints += task.storyPoints;
      all_tasks.tags[label].tasks++;

      // Add tags to each assignee
      task.assignees.forEach((assignee) => {
        const { username } = assignee;
        if (!all_tasks[username].tags[label]) {
          all_tasks[username].tags[label] = {
            storyPoints: 0,
            tasks: 0,
          };
        }
        all_tasks[username].tags[label].storyPoints += task.storyPoints;
        all_tasks[username].tags[label].tasks++;
      });
    });

    // Aggregating statusValues
    const status = task.status.toLowerCase();
    if (all_tasks.statusValues[status] !== undefined) {
      all_tasks.statusValues[status]++;
    }
  });

  return { all_tasks };
}
