import { makeAutoObservable } from 'mobx';

export class BoardUIStore {
  isDragging = false;
  draggingTaskId: string | null = null;
  openTaskId: string | null = null;
  isAddingColumn = false;
  addingTaskInColumnId: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  startDrag(taskId: string) {
    this.isDragging = true;
    this.draggingTaskId = taskId;
  }

  endDrag() {
    this.isDragging = false;
    this.draggingTaskId = null;
  }

  openTask(taskId: string) {
    this.openTaskId = taskId;
  }

  closeTask() {
    this.openTaskId = null;
  }

  setAddingColumn(value: boolean) {
    this.isAddingColumn = value;
  }

  setAddingTaskInColumn(columnId: string | null) {
    this.addingTaskInColumnId = columnId;
  }
}
