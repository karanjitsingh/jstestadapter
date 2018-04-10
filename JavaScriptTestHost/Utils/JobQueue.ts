import { start } from "repl";

interface Job {
    Action: () => void,
    Callback?: (e?:Error) => void
}

export default class JobQueue {
    private jobQueue: Array<Job>;
    private isRunning: boolean;
    public Autostart: boolean;

    constructor() {
        this.jobQueue = <Array<Job>>[];
        this.isRunning = false;
        this.Autostart = true;
    }

    public QueueJob(action: () => void, callback?: (e?: Error) => void) {
        this.jobQueue.push(<Job> {
            Action: action,
            Callback: callback
        });

        if(!this.isRunning && this.Autostart) {
            this.Start();
        }
    }

    public Start() {
        this.isRunning = true;
        this.ProcessJobs();
    }

    public Pause() {
        this.isRunning = false;
    }

    private ProcessJobs() {
        if(!this.isRunning || this.jobQueue.length == 0) {
            this.isRunning = false;
            return;
        }

        this.ExecuteJob().then(() => {
            this.JobFinished(null);
        },
        (err:Error) => {
            this.JobFinished(err);
        });
    }

    private JobFinished(err?: Error) {
        if(err) {
            // log error
        }

        let job = this.jobQueue.pop();
        if(job.Callback) {
            job.Callback(err ? err : null);
        }

        this.ProcessJobs();
    }

    private async ExecuteJob() {
        let job = this.jobQueue[0];
        job.Action();
    }
}