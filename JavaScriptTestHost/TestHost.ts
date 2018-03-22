import {IEnvironment, ISocket} from "./Environment"
import {default as Exception, ExceptionType} from "./Exceptions/Exception";

export default class TestHost {
    private environment:IEnvironment;
    private socket: ISocket;

    constructor(environment: IEnvironment) {
        this.environment = environment;
        this.socket = environment.getSocket();
        this.validateArguments(this.environment.argv);
    }
    
    public setupCommunication() {
        this.socket.connect(Number(this.environment.argv[0]), "127,0,0,1", this.onSocketConnected);
    }

    private onSocketConnected() {
        console.log("socket connected");
    }

    private validateArguments(args: Array<string>) {
        if(isNaN(Number(args[0]))) {
            throw new Exception("Invalid Port", ExceptionType.InvalidArgumentsException);
        }
    }
}