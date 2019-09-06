import * as path from 'path';
import { Whitelist } from './Whitelist';

export interface ITaskSpecDefinite {
    precondition?: (ctx: ITaskControllerContext) => boolean | Promise<boolean>;
    dependencies?: TaskInvocation[];
    execute?: (ctx: ITaskControllerContext) => any | Promise<any>;
    init?: (ctx: ITaskControllerContext) => any | Promise<any>;
}

export interface ITaskInvocationWithArguments {
    name: string;
    //tslint:disable:no-banned-terms
    arguments: any[];
    //tslint:disable:no-banned-terms
}

export type TaskInvocation = string | ITaskInvocationWithArguments;

export type TaskSpec = ITaskSpecDefinite | { (...args: any[]): ITaskSpecDefinite; };
export interface ITaskSet { [taskName: string]: TaskSpec; }

/**
 * Context interface for tasks to use when running.
 *
 * Regarding log levels, use these rules of thumb:
 * - Important/minimal: use for errors that fail a task, or if the purpose of the
 *   task is to report some information (e.g. querying which tasks exist)
 * - Text/default: use for messages that occur once or twice per task, e.g.
 *   the summary line of a test run. Also use for extra error information that is generally
 *   helpful for triage but not strictly required to know that something failed. E.g. each
 *   failed test case.
 * - Verbose/full: use for messages that are generally noise, but can sometimes be useful
 *   when the user is looking for more information.
 *   e.g. a line per passed test cases, where there might be hundreds or thousands of cases.
 */
export interface ITaskControllerContext {
    variables: { [key: string]: any };
    log(level: VerbosityLevel, message: string): void;
    logImportant(message: string): void; // Equivalent to log('minimal', ...)
    logText(message: string): void;      // Equivalent to log('default', ...)
    logVerbose(message: string): void;   // Equivalent to log('full', ...)
    verbosity: VerbosityLevel;
}

export type VerbosityLevel = 'minimal' | 'default' | 'full';

const taskInvocationSchema = new Whitelist(['name', 'arguments']);

const verbosityMap = {
    'minimal': 0,
    'default': 1,
    'full': 2
};

/**
 * TaskController
 *
 * Controls dependency order and serial execution of tasks that have been requested. A 'task'
 * describes preconditions and other tasks it depends on. Tasks can only be run once. A task can take
 * arguments, in which case each unique set of arguments will be run exactly once.
 *
 * A task goes through a couple phases of consideration:
 * - definition: A task is defined by loading it's module, or explicitly defining the task via addTask(). A defined task
 *   remains in this state until either an execute() call requests the task be scheduled, or it's transitively a dependency of
 *   a task which has been scheduled.
 * - precondition: if precondition is not met, it's skipped entirely, but other tasks can be scheduled as if this task already ran.
 * - initialization: if the precondition is met or not defined, the task is then initialized. This is where the task can set up
 *   any state that other tasks rely on (e.g. preconditions for other tasks) and add any computed dependencies.
 * - pending: After the task is initialized, its dependency list is considered. A task cannot execute until all its dependencies
 *   have executed. This requires each dependency go through the definition, precondition, initialization, and execution process.
 * - execution: The task finally executes.
 *
 * Tasks are generally authored as Node modules. The module will export a 'tasks' property, implementing
 * the ITaskSet interface. Here's an example such module:
 *
 * ```js
 *  exports.tasks = {
 *      nop: {
 *          init: function (ctx) {
 *              ctx.variables.nopInitialized = true;
 *          },
 *          execute: function (ctx) {
 *              console.log('nop ran');
 *              ctx.variables.nop = 'ran';
 *          }
 *      },
 *      nop_cleanup = {
 *          precondition: (ctx) => ctx.variables.nopInitialized;
 *          execute: console.log.bind(console, 'nop cleanup ran');
 *      },
 *      nop_all = {
 *          dependencies: [ 'nop', 'nop_cleanup' ]
 *      }
 *  };
 * ```
 * Usage of the above:
 *  tc.execute('nop')
 *      ---> prints 'nop ran'
 *  tc.execute('nop_cleanup')
 *      ---> nothing happens. Since 'nop' was never scheduled, nop_cleanup's precondition fails, so it's not scheduled either.
 *  tc.executeAll(['nop', 'nop_cleanup'])
 *      ---> prints 'nop ran' then 'nop cleanup ran'
 *  tc.execute('nop_all')
 *      ---> prints 'nop ran' then 'nop cleanup ran'
 *  tc.dryrun = true; tc.execute('nop_all')
 *      ---> nothing happens. (but verbose logging would say that nop and nop_cleanup targets would be considered)
 */
export class TaskController implements ITaskControllerContext {
    private loadedFiles: { [fileName: string]: boolean };
    private tasks: { [taskName: string]: TaskSpec };
    private taskmemo: { [taskName: string]: ITaskState };

    public variables: { [variableName: string]: any };
    public dryrun: boolean;
    public verbosity: VerbosityLevel = 'default';

    public logger: (message: string) => void = console.log.bind(console);

    constructor() {
        this.loadedFiles = Object.create(null);
        this.tasks = Object.create(null);
        this.taskmemo = Object.create(null);
        this.variables = Object.create(null); // scratch space for tasks
        this.dryrun = false;
    }

    public log(verbosity: VerbosityLevel, message: string): void {
        if (!(verbosity in verbosityMap)) {
            this.logImportant(`Bad logging! Invalid verbosity '${verbosity}'`);
        }

        if (verbosityMap[this.verbosity] >= verbosityMap[verbosity]) {
            //tslint:disable:no-string-literal
            const datePrefix = verbosityMap[this.verbosity] >= verbosityMap['full'] ? `${(new Date()).toISOString()}: ` : '';
            this.logger(`${datePrefix}${message}`);
            //tslint:disable:no-string-literal
        }
    }

    public logImportant(message: string): void {
        return this.log('minimal', message);
    }

    public logText(message: string): void {
        return this.log('default', message);
    }

    public logVerbose(message: string): void {
        return this.log('full', message);
    }

    public addTasks(taskSet: ITaskSet): void {

        for (const taskName of Object.keys(taskSet)) {
        //for (const taskName in taskSet) {
            const taskspec = taskSet[taskName];
            if (taskName in this.tasks) {
                throw new Error(`Task name collision, '${taskName}'`);
            }
            this.logVerbose(`addTask: Defining task ${JSON.stringify(taskName)}`);
            this.tasks[taskName] = taskspec;
        }
    }

    public addTasksFromFile(filepath: string) {
        const fullpath = path.resolve(process.cwd(), filepath);

        if (fullpath in this.loadedFiles) {
            return;
        }

        this.logVerbose(`addTasksFromFile: ${JSON.stringify(filepath)}`);
        //tslint:disable:no-reserved-keywords
        //tslint:disable:no-require-imports
        const module = require(fullpath);
        //tslint:disable:no-require-imports
        //tslint:disable:no-reserved-keywords
        if (!module.tasks) {
            throw new Error(`Task file '${filepath}' missing 'tasks' export`);
        }
        this.addTasks(module.tasks);
        this.loadedFiles[fullpath] = true;
    }

    public async execute(taskName: TaskInvocation): Promise<any> {
        const parsed = parseTaskInvocation(taskName);
        const state = await this.getTaskState(parsed);
        return await this.executeSchedule([state]);
    }

    public async executeAll(taskNames: string[]): Promise<void> {
        const schedule = [];
        for (const taskName of taskNames) {
            schedule.push(await this.getTaskState(parseTaskInvocation(taskName)));
        }
        return await this.executeSchedule(schedule);
    }

    public async getState(taskName: string): Promise<any> {
        const parsed = parseTaskInvocation(taskName);
        const state = await this.getTaskState(parsed);
        return await state;
    }

    private async getTaskState(taskInvocation: ITaskInvocationWithArguments): Promise<ITaskState> {
        const key = JSON.stringify(taskInvocation);

        let taskState = this.taskmemo[key];
        if (!taskState) {
            const taskDef = this.tasks[taskInvocation.name];
            if (!taskDef) {
                throw new Error(`Task not found: ${taskInvocation.name}`);
            }
            if (typeof taskDef === 'function') {
                taskState = {
                    invocation: taskInvocation,
                    state: 'created',
                    spec: await taskDef.apply(null, taskInvocation.arguments)
                };
            } else if (typeof taskDef === 'object') {
                if (taskInvocation.arguments && taskInvocation.arguments.length > 0) {
                    throw new Error('Trying to pass arguments to task that does not accept arguments');
                }
                taskState = {
                    invocation: taskInvocation,
                    state: 'created',
                    spec: taskDef
                };
            } else {
                throw new Error(`Invalid task definition found for task ${JSON.stringify(taskInvocation)}`);
            }

            this.taskmemo[key] = taskState;
        }
        return taskState;
    }

    private async executeSchedule(schedule: ITaskState[]): Promise<void> {
        this.logVerbose('Scheduled tasks:');
        for (const t of schedule) {
            this.logVerbose('  ' + JSON.stringify(t.invocation));
        }
        await this.analyzeDependenciesInSchedule(schedule);
        await this.runTasksInSchedule(schedule);
    }

    /**
     * Analyzes the schedule, initializes any tasks that have been discovered, and
     * adds missing dependencies.
     *
     * Postcondition: all tasks in schedule are either skipped or waiting
     * Postcondition: all waiting tasks appear after their dependencies
     *
     * @param schedule
     */
    private async analyzeDependenciesInSchedule(schedule: ITaskState[]): Promise<void> {
        this.logVerbose('Analyzing dependencies:');
        for (let i = 0; i < schedule.length;) {
            const taskState = schedule[i];
            if (taskState.state === 'created') {
                // init the task, in case it has any delayed initializers to run.
                if (taskState.spec.init) {
                    this.logVerbose(`Initializing task ${JSON.stringify(taskState.invocation)}`);
                    try {
                        await taskState.spec.init(this);
                        taskState.state = 'initialized';
                    } catch (e) {
                        taskState.state = 'failed';
                        throw e;
                    }
                }
                taskState.state = 'initialized';
            }
            if (taskState.state === 'initialized') {
                if (taskState.spec.precondition && !await taskState.spec.precondition(this)) {
                    // skip to skipped state
                    taskState.state = 'skipped';
                    this.logVerbose(`Skipped due to precondition: ${JSON.stringify(taskState.invocation)}`);
                } else {
                    // insert dependencies
                    taskState.state = 'waiting';
                    const dependencies = taskState.spec.dependencies || [];

                    if (dependencies.length > 0) {
                        this.logVerbose(`Task ${JSON.stringify(taskState.invocation)} waiting
                                  for ${dependencies.length} dependencies to complete.`);

                        let insertAt = i;
                        for (const dependency of dependencies) {
                            const parsed = parseTaskInvocation(dependency);
                            const dts = await this.getTaskState(parsed);
                            schedule.splice(insertAt++, 0, dts);
                        }
                    }
                }
            } else {
                // task is ready to run. Look at next task
                i++;
            }
        }
    }

    /**
     * Runs the tasks in the schedule. It's assumed that tasks are already in dependency order.
     *
     * Postcondition: all tasks are 'skipped' or 'complete', or the run failed with an exception.
     *
     * @param schedule - list of task states to be run.
     */
    private async runTasksInSchedule(schedule: ITaskState[]): Promise<void> {
        if (this.verbosity === 'full') {
            this.logVerbose('Schedule:');
            for (const taskState of schedule) {
                this.logVerbose(`  ${JSON.stringify(taskState.invocation)}`);
            }
        }

        this.logVerbose('Running tasks:');

        for (let i = 0; i < schedule.length; ++i) {
            const taskState = schedule[i];

            if (taskState.state === 'waiting') {
                // check that all dependencies completed
                const dependencies = taskState.spec.dependencies || [];

                for (const dependency of dependencies) {
                    const dependencyParsed = parseTaskInvocation(dependency);
                    const dependencyTaskState = this.taskmemo[JSON.stringify(dependencyParsed)];

                    if (dependencyTaskState.state === 'completed' || dependencyTaskState.state === 'skipped') {
                        continue;
                    }

                    // Found an incomplete dependency. Fail.
                    const message = `Could not run task ${JSON.stringify(taskState.invocation)},
                                    as dependency ${JSON.stringify(dependencyTaskState.invocation)} is ${dependencyTaskState.state}`;
                    this.logVerbose(message);
                    taskState.state = 'failed';
                    throw new Error(message);
                }
            }
            if (taskState.state === 'waiting' || taskState.state === 'initialized') {
                // run the task
                taskState.state = 'running';
                if (this.dryrun) {
                    this.logText(`Dryrun: ${JSON.stringify(taskState.invocation)}`);
                } else if (taskState.spec.execute) {
                    this.logText(`Running task: ${JSON.stringify(taskState.invocation)}`);
                    try {
                        await taskState.spec.execute(this);
                    } catch (e) {
                        taskState.state = 'failed';
                        throw e;
                    }
                }
                taskState.state = 'completed';
            }
        }
        this.logVerbose('Finished execution of scheduled tasks');
    }

    public getTasks(): string[] {
        return Object.keys(this.tasks);
    }
}

interface ITaskState {
    invocation: TaskInvocation;
    state: 'created' | 'initialized' | 'waiting' | 'skipped' | 'completed' | 'failed' | 'running';
    spec: ITaskSpecDefinite;
}

function parseTaskInvocation(taskInvocation: TaskInvocation): ITaskInvocationWithArguments {
    if (typeof taskInvocation === 'string') {
        let match;
        // For command line use, strings beginning with '{' are assumed to be
        // json serialized JSON objects of type ITaskInvocationWithArguments.
        if (taskInvocation[0] === '{') {
            // parse json object
            taskInvocation = JSON.parse(taskInvocation) as ITaskInvocationWithArguments;
        }
        // For convenience, simple invocations like {name: 'testSuite',
        // arguments: ['path/to/suite.js' ] } can instead be written
        // as the string 'testSuite[path/to/suite.js]'.
        else if (match = taskInvocation.match(/^(.*)\[(.*)\]$/)) {
            taskInvocation = { name: match[1], arguments: match[2].split(',') };
        }
        // Default case - task with no arguments.
        else {
            taskInvocation = { name: taskInvocation, arguments: [] };
        }
    }
    taskInvocationSchema.verifyObject(taskInvocation, 'Bad task invocation');
    return taskInvocation;
}
