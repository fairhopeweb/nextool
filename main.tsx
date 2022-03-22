import * as React from "react";
import * as ReactDOM from "react-dom";
import {
  updateApp,
  State,
  Event,
  SelectFilterEvent,
  View,
  view,
  DropId,
  empty,
  FilterView,
  SideBarSectionView,
  Send,
} from "./app";
import {loadTasks, saveTasks} from "./storage";
import {Button} from "./ui";
import {TaskEditor} from "./task-editor";
import {TextField, value as textFieldValue} from "./text-field";
import * as Drag from "./drag";
import {TaskList} from "./task-list";

import style from "./main.module.scss";

const AppContext = React.createContext<State>(null as any);

function useApp(): State {
  return React.useContext(AppContext);
}

function AddTask(props: {send(ev: Event): void}) {
  const textFields = useApp().textFields;
  return (
    <div className={style.newTask}>
      <TextField
        field="addTitle"
        placeholder="New Task"
        value={textFieldValue(textFields, "addTitle")}
        send={props.send}
      />
      <Button onClick={() => props.send({tag: "add"})}>Add Task</Button>
    </div>
  );
}

function Filter(props: {filter: FilterView; send(ev: SelectFilterEvent | Drag.DragEvent<never, DropId>): void}) {
  const inner = (
    <button
      onClick={() => props.send({tag: "selectFilter", filter: props.filter.filter})}
      className={props.filter.selected ? style.selected : ""}
    >
      <span className={style.label}>{props.filter.label}</span>
    </button>
  );

  return props.filter.dropTarget ? (
    <Drag.DropTarget id={props.filter.dropTarget} send={props.send}>
      {inner}
    </Drag.DropTarget>
  ) : (
    inner
  );
}

function FilterSelector(props: {filters: FilterView[]; send: Send}) {
  return (
    <div className={style.filterSelector}>
      {props.filters.map((filter, i) => (
        <Filter key={i} filter={filter} send={props.send} />
      ))}
    </div>
  );
}

function SideBarSection(props: {section: SideBarSectionView; send: Send}) {
  return (
    <>
      <h1>{props.section.title}</h1>
      <FilterSelector filters={props.section.filters} send={props.send} />
    </>
  );
}

function SideBar(props: {sections: SideBarSectionView[]; send: Send}) {
  return (
    <div className={style.sidebar}>
      {props.sections.map((section) => (
        <SideBarSection section={section} send={props.send} />
      ))}
    </div>
  );
}

function Main() {
  const [app, setApp] = React.useState<State>(empty);

  const view_ = view(app);

  React.useEffect(() => {
    setApp((app) => ({...app, tasks: loadTasks()}));
  }, []);

  const send = React.useCallback((ev: Event) => {
    setApp((app) => {
      const app_ = updateApp(app, ev);
      saveTasks(app_.tasks);
      return app_;
    });
  }, []);

  return (
    <AppContext.Provider value={app}>
      <div className={style.outerContainer}>
        <div className={style.topBar} />
        <SideBar sections={view_.sideBar} send={send} />
        <div className={style.innerContainer}>
          <div className={style.left}>
            <TaskList view={view_.taskList} send={send} />
            <AddTask send={send} />
          </div>
          <div className={style.right}>
            <TaskEditor view={view_.editor} send={send} />
          </div>
        </div>
      </div>
    </AppContext.Provider>
  );
}

ReactDOM.render(<Main />, document.getElementById("root"));
