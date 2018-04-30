import { SupportedFramework } from '../TestFrameworks/TestFrameworkFactory';
import { ExceptionType, Exception } from '../../Exceptions';
import { TestHostSettings } from '../TestHostSettings';

const endpointIpRegex = /^(?!.*\.$)((?!0\d)(1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/;

interface Argument {
    Option: string;
    Value: string;
}

enum Option {
    TestFrameworkArgument = '--framework',
    EndpointArgument = '--endpoint',
    RoleArgument = '--role',
    ParentProcessIdArgument = '--parentprocessid',
    LogFileArgument = '--diag',
    DataCollectionPortArgument = '--datacollectionport',
    TelemetryOptedIn = '--telemetryoptedin'
}

export namespace ArgumentProcessor  {
    const requiredArguments: Array<Option> = [
        Option.TestFrameworkArgument,
        Option.EndpointArgument
    ];

    export function processArguments(args: Array<string>): TestHostSettings {
        const optionRegex = /^--[a-z]+$/i;
        const options = new Map<string, Argument>();
        const testHostSettings: TestHostSettings = <TestHostSettings>{
            TestFramework: null,
            Port: null,
            EndpointIP: null,
            Role: null,
            PPID: null,
            LogFile: null,
            DataCollectionPort: null,
            TelemetryOptedIn: null
        };

        let argument: Argument = null;

        args.slice(2).forEach((arg) => {
            if (arg.match(optionRegex)) {
                argument = {
                    Option: arg.toLowerCase(),
                    Value: null
                };
                options.set(arg.toLowerCase(), argument);
            } else {
                if (!argument.Value) {
                    argument.Value = arg;
                    options.set(argument.Option, argument);
                } else {
                    throw new Exception('Invalid argument \'' + arg + '\'.', ExceptionType.InvalidArgumentsException);
                }
            }
        });

        validateRequiredArguments(options);

        options.forEach(option => {
            validateArgument(option);
            switch (option.Option) {
                case Option.TestFrameworkArgument:
                    switch (option.Value) {
                        case 'mocha':
                            testHostSettings.TestFramework = SupportedFramework.Mocha;
                            break;
                        case 'jasmine':
                            testHostSettings.TestFramework = SupportedFramework.Jasmine;
                            break;
                        default:
                            throw new Exception('Unknown framework \'' + option.Value + '\'', ExceptionType.InvalidArgumentsException);
                    }
                    break;
                case Option.EndpointArgument:
                    const endpoint = option.Value.split(':');
                    const ip = endpoint[0];
                    const port = endpoint[1];
                    if (ip.match(endpointIpRegex)) {
                        testHostSettings.EndpointIP = ip;
                    } else {
                        throw new Exception('Invalid enpoint.', ExceptionType.InvalidArgumentsException);
                    }

                    if (port && port.match(/[0-9]+/) && Number(port) < 65536) {
                        testHostSettings.Port = Number(port);
                    } else {
                        throw new Exception('Invalid port.', ExceptionType.InvalidArgumentsException);
                    }
                    break;
                case Option.DataCollectionPortArgument:
                    if (option.Value.match(/[0-9]+/) && Number(option.Value) < 65536) {
                        testHostSettings.DataCollectionPort = Number(option.Value);
                    } else {
                        throw new Exception('Invalid data collection port.', ExceptionType.InvalidArgumentsException);
                    }
                    break;
            }
        });

        return testHostSettings;
    }

    function validateRequiredArguments(options: Map<string, Argument>) {
        requiredArguments.forEach(arg => {
            if (!options.has(arg.toLowerCase())) {
                throw new Exception('Required option ' + arg + ' not given.', ExceptionType.InvalidArgumentsException);
            }
        });
    }

    function validateArgument(option: Argument) {
        switch (option.Option) {
            case Option.TestFrameworkArgument:
            case Option.EndpointArgument:
            case Option.RoleArgument:
            case Option.ParentProcessIdArgument:
            case Option.LogFileArgument:
            case Option.DataCollectionPortArgument:
            case Option.TelemetryOptedIn:
                if (option.Value === null) {
                    throw new Exception('Option ' + option.Option + ' requires a value.', ExceptionType.InvalidArgumentsException);
                }
                break;
        }
    }
}