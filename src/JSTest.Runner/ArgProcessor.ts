import { IEnvironment } from './Environment/IEnvironment';
import { CLIArgs } from './TestRunner/CLIArgs';

 export namespace ArgProcessor {

     export function processCLIArgs(env: IEnvironment): CLIArgs {

        let runInDomain = false;
        let debugEnabled = false;
        let debugFilePath = '';

         for (let i = 4; i < env.argv.length; i++) {
            if (env.argv[i].startsWith('--')) {
                switch (env.argv[i].substr(2).toLowerCase()) {
                    case 'runindomain':
                        runInDomain = true;
                        break;
                    case 'diag':
                        debugEnabled = true;
                        if (env.argv[++i]) {
                            debugFilePath = unescape(env.argv[i]);
                        }
                        break;
                    default:
                        throw new Error('Unknown option ' + env.argv[i]);
                }
            } else {
                throw new Error('Invalid option ' + env.argv[i]);
            }
        }

         return <CLIArgs> {
            ip: env.argv[2],
            port: Number(env.argv[3]),
            traceEnabled: debugEnabled,
            traceFilePath: debugFilePath,
            runInDomain: runInDomain
        };
    }
} 