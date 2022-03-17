import {updateApp, State, view, Event, empty} from "./app";
import {FilterId} from "./tasks";

function updateAll(state: State, events: Event[]): State {
  return events.reduce(updateApp, state);
}

function addTask(title: string): Event[] {
  return [
    {tag: "textField", type: "edit", field: "addTitle", value: title},
    {tag: "textField", field: "addTitle", type: "submit"},
  ];
}

function dragToFilter(id: string, filter: FilterId): Event[] {
  return [
    {tag: "drag", type: "drag", id: {type: "task", id}, x: 100, y: 100},
    {tag: "drag", type: "hover", target: {type: "filter", id: filter}},
    {tag: "drag", type: "drop"},
  ];
}

function switchToFilter(filter: FilterId): Event[] {
  return [{tag: "selectFilter", filter}];
}

describe("adding tasks", () => {
  describe("with empty state", () => {
    test("there are no tasks", () => {
      expect(view(empty).taskList).toEqual([]);
    });
  });

  describe("after adding three new tasks", () => {
    const example = updateAll(empty, [...addTask("Task 1"), ...addTask("Task 2"), ...addTask("Task 3")]);

    test("there are three tasks in the task list", () => {
      expect(view(example).taskList.length).toEqual(3);
    });

    test("they are added from top to bottom", () => {
      expect(view(example).taskList.map((t) => t.title)).toEqual(["Task 1", "Task 2", "Task 3"]);
    });

    test("they are all marked unfinished", () => {
      expect(view(example).taskList.every((t) => !t.done)).toBe(true);
    });

    test("they are marked as stalled", () => {
      expect(view(example).taskList.map((t) => t.badges)).toEqual([["stalled"], ["stalled"], ["stalled"]]);
    });
  });
});

describe("dragging tasks to filters", () => {
  describe("in an example with three tasks", () => {
    const example = updateAll(empty, [
      ...addTask("Task 1"),
      ...addTask("Task 2"),
      ...addTask("Task 3"),
      ...switchToFilter("all"),
    ]);

    test("they are all marked as stalled at first", () => {
      expect(view(example).taskList.map((t) => t.badges)).toEqual([["stalled"], ["stalled"], ["stalled"]]);
    });

    test("they are all marked unfinished at first", () => {
      expect(view(example).taskList.every((t) => !t.done)).toBe(true);
    });

    const action = updateAll(example, dragToFilter(view(example).taskList[0].id, "actions"));
    test("dragging a task to the action filter gives it the action badge", () => {
      expect(view(action).taskList.map((t) => t.badges)).toEqual([["action"], ["stalled"], ["stalled"]]);
    });

    const done = updateAll(example, dragToFilter(view(example).taskList[0].id, "done"));
    test("dragging a task to the done filter marks it as done", () => {
      expect(view(done).taskList.map((t) => t.done)).toEqual([true, false, false]);
    });

    test("dragging a task marked action to stalled gives it the stalled badge again", () => {
      const stalled = updateAll(action, dragToFilter(view(action).taskList[0].id, "stalled"));
      expect(view(stalled).taskList.map((t) => t.badges)).toEqual([["stalled"], ["stalled"], ["stalled"]]);
    });

    test("dragging a task marked done to unfinished marks it as unfinished again", () => {
      const unfinished = updateAll(done, dragToFilter(view(done).taskList[0].id, "not-done"));
      expect(view(unfinished).taskList.every((t) => !t.done)).toBe(true);
    });
  });
});

function reorderTask(source: string, target: string, side: "above" | "below"): Event[] {
  return [
    {tag: "drag", type: "drag", id: {type: "task", id: source}, x: 100, y: 100},
    {
      tag: "drag",
      type: "hover",
      target: {type: "task", id: target, side, indentation: 0},
    },
    {tag: "drag", type: "drop"},
  ];
}

describe("reordering tasks with drag and drop", () => {
  describe("in an example with three tasks", () => {
    const example = updateAll(empty, [...addTask("Task 1"), ...addTask("Task 2"), ...addTask("Task 3")]);

    function testReorder(from: number, to: number, side: "above" | "below", result: number[]): void {
      test(`dragging task ${from} to ${side} ${to}`, () => {
        const moved = updateAll(example, [
          ...reorderTask(view(example).taskList[from - 1].id, view(example).taskList[to - 1].id, side),
        ]);
        expect(view(moved).taskList.map((t) => t.title)).toEqual(result.map((x) => `Task ${x}`));
      });
    }

    describe("dragging task down", () => {
      testReorder(1, 2, "below", [2, 1, 3]);
      testReorder(1, 3, "above", [2, 1, 3]);
    });

    describe("dragging task up", () => {
      testReorder(2, 1, "above", [2, 1, 3]);
      testReorder(3, 1, "below", [1, 3, 2]);
    });

    describe("examples where position isn't changed", () => {
      testReorder(1, 2, "above", [1, 2, 3]);
      testReorder(1, 1, "below", [1, 2, 3]);
      testReorder(1, 1, "above", [1, 2, 3]);
    });
  });
});

describe("nesting tasks with drag and drop", () => {
  describe("in an example with three tasks", () => {
    const example = updateAll(empty, [...addTask("Task 1"), ...addTask("Task 2"), ...addTask("Task 3")]);

    test("the first item has one drop target above it and two drop below it", () => {
      expect(view(example).taskList[0].dropTargets).toEqual([
        {width: "full", indentation: 0, side: "above"},
        {width: 1, indentation: 0, side: "below"},
        {width: "full", indentation: 1, side: "below"},
      ]);
    });

    test("the second item has two drop targets both above and below it", () => {
      expect(view(example).taskList[1].dropTargets).toEqual([
        {width: 1, indentation: 0, side: "above"},
        {width: "full", indentation: 1, side: "above"},
        {width: 1, indentation: 0, side: "below"},
        {width: "full", indentation: 1, side: "below"},
      ]);
    });
  });
});
