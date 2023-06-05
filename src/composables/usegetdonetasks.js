export async function useGetDoneTasks(tasks) {
    const currentMonth = new Date().getMonth();
  const done_tasks = [];

  for (const taskId in tasks) {
    const task = tasks[taskId];

    // Filter tasks with 'E' kind diff in audit log and created in the current month
    const hasRecentDoneStatus = task.auditLog.some(log => {
      const isStatusChanged = log.diff.some(diff => diff.kind === 'E' && diff.rhs === 'IN_REVIEW');
      const createdAtMonth = new Date(log.createdAt).getMonth();
      return isStatusChanged && createdAtMonth === currentMonth;
    });

    const taskCreatedAtMonth = new Date(task.createdAt).getMonth();
    const isTaskCreatedThisMonth = taskCreatedAtMonth === currentMonth;

    if (hasRecentDoneStatus && isTaskCreatedThisMonth) {
      done_tasks.push({
        assignees: task.assignees,
        auditLog: task.auditLog,
        createdAt: task.createdAt,
        description: task.description,
        doneAt: task.doneAt,
        id: task.id,
        name: task.name,
        status: task.status,
        storyPoints: task.storyPoints,
        subtasks: task.subtasks,
        tags: task.tags
      });
    }
  }

  return { done_tasks };
  }
  