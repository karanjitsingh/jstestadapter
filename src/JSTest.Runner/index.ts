import { IEnvironment } from './Environment/IEnvironment';
import { EnvironmentProvider } from './Environment/EnvironmentProvider';
import { TestRunner } from './TestRunner/TestRunner';
import { Exception } from './Exceptions';
import { CLIArgs, EqtTraceOptions } from 'TestRunner/CLIArgs';

const environmentProvider = new EnvironmentProvider();

environmentProvider.getEnvironment().then((env: IEnvironment) => {
    try {
        // tslint:disable-next-line
        new TestRunner(env);
    } catch (err) {
        handleError(err);
        env.exit(1);
    }
}, (err) => {
    handleError(err);
});

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
        eqtTraceOptions: <EqtTraceOptions> {
            isErrorEnabled: debugEnabled,
            isInfoEnabled: debugEnabled,
            isVerboseEnabled: debugEnabled,
            isWarningEnabled: debugEnabled
        }
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