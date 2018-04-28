import { SupportedFramework } from '../TestFrameworks/TestFrameworkFactory';
import { ExceptionType, Exception } from '../../Exceptions/Exception';

const endpointRegex = /^(?!.*\.$)((?!0\d)(1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}:[0-9]+$/;

export class ArgumentProcessor  {

    public readonly ip: string;
    public readonly port: number;
    public readonly testFramework: SupportedFramework;

    constructor(cliargs: Array<string>) {
        this.processArguments(cliargs);
        const endpoint = cliargs[2].split(':');
        this.ip = endpoint[0];
        this.port = Number(endpoint[1]);
        
        switch (cliargs[3] === undefined || cliargs[3].toLowerCase()) {
            case 'mocha':
                this.testFramework = SupportedFramework.Mocha;
                break;
            case 'jasmine':
                this.testFramework = SupportedFramework.Jasmine;
                break;
        }
    }

    private processArguments(args: Array<string>) {
        if (args.length < 4) {
            throw new Exception('Insufficient arguments', ExceptionType.InvalidArgumentsException);
        }

        if (args[2] === undefined || (args[2].match(endpointRegex) && Number(args[2].split(':')[0]) < 65536)) {
            throw new Exception('Invalid endpoint.', ExceptionType.InvalidArgumentsException);
        }

        if (args[3] !== undefined && args[3].match(/^[a-z]+$/i)) {
            switch (args[3].toLowerCase()) {
                case 'mocha':
                case 'jasmine':
                    break;
                default:
                    throw new Exception(`Unknown test framework '${args[4]}'.`, ExceptionType.InvalidArgumentsException);
            }
        } else {
            throw new Exception('Missing test framework argument.', ExceptionType.InvalidArgumentsException);
        }

    }
}