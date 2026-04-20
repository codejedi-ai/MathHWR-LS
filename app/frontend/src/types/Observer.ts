export interface Observer {
  onPosition?(id: string, x: number, y: number): void;
  onDelete?(id: string): void;
}

export abstract class Subject {
  private observers: Observer[] = [];

  addObserver(observer: Observer) {
    this.observers.push(observer);
  }

  removeObserver(observer: Observer) {
    this.observers = this.observers.filter(o => o !== observer);
  }

  protected notifyPosition(id: string, x: number, y: number) {
    this.observers.forEach(o => o.onPosition && o.onPosition(id, x, y));
  }

  protected notifyDelete(id: string) {
    this.observers.forEach(o => o.onDelete && o.onDelete(id));
  }
}


