import {Task} from "./tasks";

export function loadTasks() {
  const tasks = window.localStorage.getItem("tasks");
  return tasks
    ? JSON.parse(tasks)
    : [
        {id: "0", title: "Task 1", done: false},
        {id: "1", title: "Task 2", done: true},
        {id: "2", title: "Task 3", done: false},
      ];
}

export function saveTasks(tasks: Task[]) {
  window.localStorage.setItem("tasks", JSON.stringify(tasks));
}
