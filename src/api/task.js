import axios from 'axios';

export async function fetchTaskDetails(taskId) {
  const query = `
    query GetTaskDetailsQuery {
      getTask(id: "${taskId}") {
        id
        name
        createdAt
        updatedAt
        deletedAt
        doneAt
        dueDate
        featured
        gitBranchName
        applicationLink
        applicationTemplate
        submissionTemplate
        permalink
        maxWinners
        number
        openToBids
        parentTaskId
        priority
        sectionId
        sortKey
        status
        storyPoints
        submissionCount
        template
        templateTaskId
        workspaceId
        __typename
        applicationCount
        assignees {
          id
          username
          __typename
        }
        auditLog {
          id
          createdAt
          __typename
        }
        creator {
          id
          username
          __typename
        }
        description
        parentTask {
          id
          __typename
        }
        workspace {
          id
          name
          slug
          __typename
        }
      }
    }
  `;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': import.meta.env.VITE_DEWORK_AUTH,
  };

  try {
    const response = await axios.post('https://api.deworkxyz.com/graphql?op=GetWorkspaceTasksQuery', {
      query,
    }, {
      headers,
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}
