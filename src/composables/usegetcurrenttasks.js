export async function useGetCurrentTasks(tasks) {
    const currentMonth = new Date().getMonth();
  const current_tasks = [];

  for (const taskId in tasks) {
    const task = tasks[taskId];

    // Filter tasks with status = 'IN_REVIEW' and tag label = 'Audited'
    const isInProgressStatus = task.status === 'IN_PROGRESS';
    const isInReviewStatus = task.status === 'IN_REVIEW';

    if (isInProgressStatus || isInReviewStatus) {
      current_tasks.push({
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

  return { current_tasks };
  }
  