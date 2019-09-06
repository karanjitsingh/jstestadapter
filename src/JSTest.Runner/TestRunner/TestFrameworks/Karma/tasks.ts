import * as path from 'path';
import * as fs from 'fs';
import { ITaskSet } from './TaskController';
import { NodePromise } from './PromiseAdaptors';

export const tasks = {
    testSuite: async function (configFile: any) {
        const config = await loadTests(configFile);
        //const config = ts.then((config) => config.ScriptTestOrchestrator);
        return {
            init: function (ctx: any) {
                // Test suites are permitted to require additional modules. These will only be loaded if the test suite
                // task is loaded though, to accelerate execution of test passes that don't require these modules.
                // Module authors should take care to make sure their module doesn't have any side effects on load.
                if (config.ScriptTestOrchestrator !== undefined && config.ScriptTestOrchestrator.modules !== undefined
                    && config.ScriptTestOrchestrator.modules.length > 0) {
                    for (const mod of config.ScriptTestOrchestrator.modules) {
                        const modPath = path.resolve(path.dirname(configFile), mod);
                        ctx.logVerbose(`Loading module ${modPath} at request of test suite ${configFile}`);
                        ctx.addTasksFromFile(modPath);
                    }
                }
            },
            dependencies: config.ScriptTestOrchestrator && config.ScriptTestOrchestrator.dependencies || []
        };
    },

    cleanup: {
        init: function (ctx) {
            if (ctx.variables.cleanupTasks) {
                this.dependencies = ctx.variables.cleanupTasks;
            }
        }
    }
} as ITaskSet;

class Config {
    //tslint:disable:no-reserved-keywords
    public set(vars: any) {
        /*
        for (const key in vars) {
            this[key] = vars[key];
        }
        */

        for (const key of Object.keys(vars)) {
            this[key] = vars[key];
        }
    }
    //tslint:disable:no-reserved-keywords
}

export async function loadTests(file: any): Promise<any> {
    const np = new NodePromise<string>();
    fs.readFile(file, 'utf8', np.callback);
    const data = await np.promise;
    //const data = fs.readFileSync(file, 'utf8');

    const signature = data.match(/config.set|exports.mochaConfig/);
    if (signature[0] === 'config.set') {
        //tslint:disable:non-literal-require
        const configProc = require(path.resolve(file));
        //tslint:disable:non-literal-require
        const config = new Config();
        configProc(config);
        return config;
    } else if (signature[0] === 'exports.mochaConfig') {
        //tslint:disable:non-literal-require
        const configProc = require(path.resolve(file));
        //tslint:disable:non-literal-require
        const config = new Config();
        configProc(config);
        return config;
    } else {
        throw new Error(`Could not detect test suite type for '${file}'`);
    }
}
