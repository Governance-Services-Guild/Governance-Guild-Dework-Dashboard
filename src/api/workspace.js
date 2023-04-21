import axios from 'axios';

export async function fetchWorkspaceTasks() {
    const query = `
    query GetWorkspaceTasksQuery {
        getWorkspace(id: "f0cea521-d319-4f02-a20a-7439998dbf82") {
        id
        tasks {
          id
          name
          applicationCount
          assignees {
            id
            username
          }
          createdAt
          creator {
            id
            username
          }
          deletedAt
          description
          doneAt
          dueDate
          gating
          maxWinners
          number
          openToBids
          owners {
            id
            username
          }
          parentTaskId
          priority
          sectionId
          sortKey
          status
          storyPoints
          submissionCount
          subtasks {
            id
            name
            status
          }
          tags {
            id
            label
            color
          }
          template
          templateTaskId
          workspaceId
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