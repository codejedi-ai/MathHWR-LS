import { Observer } from "../../types/Observer";
import { deletionManager } from "../deletionManager";

export class WorkerDeleteObserver implements Observer {
  async onDelete(id: string): Promise<void> {
    try { await deletionManager.deleteEvent(id); } catch {}
  }
}


