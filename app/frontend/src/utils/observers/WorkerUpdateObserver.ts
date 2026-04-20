import { Observer } from "../../types/Observer";
import { workerManager } from "../workerManager";

export class WorkerUpdateObserver implements Observer {
  onPosition(id: string, x: number, y: number): void {
    // fire-and-forget; worker handles queueing/non-blocking
    workerManager.updateEvent(id, { x, y }).catch(() => {});
  }
}


