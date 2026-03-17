import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

interface Job {
  id: string;
  type: string;
  data: any;
  handler: (data: any) => Promise<void>;
}

class SimpleQueue extends EventEmitter {
  private queue: Job[] = [];
  private processing = false;

  async add(id: string, type: string, data: any, handler: (data: any) => Promise<void>): Promise<void> {
    this.queue.push({ id, type, data, handler });
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const job = this.queue.shift()!;
    try {
      logger.info(`Processing job ${job.id} of type ${job.type}`);
      await job.handler(job.data);
      this.emit('completed', job.id);
    } catch (error) {
      logger.error(`Job ${job.id} failed:`, error);
      this.emit('failed', job.id, error);
    } finally {
      this.processing = false;
      this.processNext();
    }
  }
}

export const resignQueue = new SimpleQueue();
