import { Worker, Job } from "bullmq";
import { createRedisConnection, type RedisConnection } from "./connection";
import type { JobData, JobResult } from "./jobs";

export interface WorkerConfig {
  queueName: string;
  concurrency?: number;
  lockDuration?: number;
  maxStalledCount?: number;
}

export abstract class BaseWorker {
  protected worker: Worker | null = null;
  protected connection: RedisConnection;
  protected config: WorkerConfig;

  constructor(config: WorkerConfig) {
    this.config = config;
    this.connection = createRedisConnection();
  }

  abstract process(job: Job<JobData>): Promise<JobResult>;

  start(): void {
    this.worker = new Worker(
      this.config.queueName,
      async (job: Job<JobData>) => {
        try {
          return await this.process(job);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return { success: false, error: message };
        }
      },
      {
        connection: this.connection,
        concurrency: this.config.concurrency ?? 1,
        lockDuration: this.config.lockDuration ?? 30000,
        maxStalledCount: this.config.maxStalledCount ?? 3,
      }
    );
  }

  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
  }
}
