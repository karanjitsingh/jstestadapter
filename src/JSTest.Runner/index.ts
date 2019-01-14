import { ArgProcessor } from './ArgProcessor';
import { EnvironmentProvider } from './Environment/EnvironmentProvider';
import { IEnvironment } from './Environment/IEnvironment';
import { Exception } from './Exceptions';
import { EqtTrace } from './ObjectModel/EqtTrace';
import { TestRunner } from './TestRunner/TestRunner';

function handleError(err: any) {
    if (err instanceof Exception) {
        const ex = <Exception> err;
        console.error(`JSTest Runner threw an exception of type ${ex.exceptionName}: ${ex.message}${ex.stack ? '\n' + ex.stack : '' }`);
    } else {
        console.error(`JSTest Runner ran into an internal error: ${err}`);
    }
}

const environmentProvider = new EnvironmentProvider();

environmentProvider.getEnvironment().then((env: IEnvironment) => {
    const cliArgs = ArgProcessor.processCLIArgs(env);

    try {
        if (cliArgs.traceEnabled) {
            EqtTrace.initialize(env.getDebugLogger(), cliArgs.traceFilePath);
        }
        
        EqtTrace.info(`Index: Environment started for ${env.environmentType} with process arguments ${env.argv}.` );

        // Remove arguments for test runner since jest reads arguments from environment
        env.argv.splice(1);

        // tslint:disable-next-line
        new TestRunner(env, cliArgs);
    } catch (err) {
        handleError(err);
        EqtTrace.error(`Error in test runner`, err);
        env.exit(1);
    }
}, (err) => {
    EqtTrace.error(`Index: Promise rejection for environmentProvider.getEnvironment.`, err);
    handleError(err);
});