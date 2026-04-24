import { SnapshotManager } from "./SnapshotManager";

export class PersistenceService {
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private snapshotManager: SnapshotManager,
    private getStore: () => Map<string, any>,
    private intervalMs: number
  ) {}

  start() {
    this.intervalId = setInterval(() => {
      this.snapshotManager.save(this.getStore());
    }, this.intervalMs);

    console.log(`Auto-save started (every ${this.intervalMs} ms)`);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log("Auto-save stopped");
    }
  }
}