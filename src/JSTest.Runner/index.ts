import { IEnvironment } from './Environment/IEnvironment';
import { EnvironmentProvider } from './Environment/EnvironmentProvider';
import { TestRunner } from './TestRunner/TestRunner';
import { Exception } from './Exceptions';
import { CLIArgs } from './TestRunner/CLIArgs';
import { EqtTrace } from './ObjectModel/EqtTrace';

function processCLIArgs(env: IEnvironment): CLIArgs {

    let debugEnabled = false;

    for (let i = 4; i < env.argv.length; i++) {
        if (env.argv[i].startsWith('--')) {
            switch (env.argv[i].substr(2).toLowerCase()) {
                case 'diag':
                    debugEnabled = true;
                    break;
                default:
                    console.error('Unknown option ' + env.argv[i]);
            }
        } else {
            console.error('Invalid option ' + env.argv[i]);
        }
    }

    return <CLIArgs> {
        ip: env.argv[2],
        port: Number(env.argv[3]),
        traceEnabled: debugEnabled
    };
}

function handleError(err: any) {
    if (err instanceof Exception) {
        const ex = <Exception> err;
        console.error(`JSTest Runner threw an exception of type ${ex.exceptionName}: ${ex.message}`);
    } else {
        console.error(`JSTest Runner ran into an internal error: ${err.message}`);
    }
}

const environmentProvider = new EnvironmentProvider();

environmentProvider.getEnvironment().then((env: IEnvironment) => {
    const cliArgs = processCLIArgs(env);

    try {
        if (cliArgs.traceEnabled) {
            EqtTrace.initialize(env.getDebugLogger());
        }
        
        EqtTrace.info('environment started');

        // tslint:disable-next-line
        new TestRunner(env, cliArgs);
    } catch (err) {
        handleError(err);
        env.exit(1);
    }
}, (err) => {
    handleError(err);
});