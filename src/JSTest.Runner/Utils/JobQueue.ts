interface Job {
    Action: () => void;
    Promise: Promise<any>;
    Callback?: (e?: Error) => void;
}

export class JobQueue {
    private jobQueue: Array<Job>;
    private isRunning: boolean;
    public autoStart: boolean;

    constructor() {
        this.jobQueue = <Array<Job>>[];
        this.isRunning = false;
        this.autoStart = true;
    }

    public queueJob(action: () => void, callback?: (e?: Error) => void) {
        this.jobQueue.push(<Job> {
            Action: action,
            Callback: callback
        });

        if (!this.isRunning && this.autoStart) {
            this.start();
        }
    }

    public queuePromise(promise: Promise<any>, callback?: (e?: Error) => void) {
        this.jobQueue.push(<Job> {
            Promise: promise,
            Callback: callback
        });

        if (!this.isRunning && this.autoStart) {
            this.start();
        }
    }

    public start() {
        this.isRunning = true;
        this.processJobs();
    }

    public pause() {
        this.isRunning = false;
    }

    private processJobs() {
        if (!this.isRunning || this.jobQueue.length === 0) {
            this.isRunning = false;
            return;
        }

        this.executeJob().then(() => {
            this.jobFinished(null);
        },
        (err: Error) => {
            this.jobFinished(err);
        });
    }

    private jobFinished(err?: Error) {
        if (err) {
            // console.error(err);
        }

        const job = this.jobQueue.pop();
        if (job.Callback) {
            job.Callback(err ? err : null);
        }

        this.processJobs();
    }

    private async executeJob() {
        const job = this.jobQueue[0];
        if (job.Action) {
            job.Action();
        } else if (job.Promise) {
            await job.Promise;
        }
    }
}