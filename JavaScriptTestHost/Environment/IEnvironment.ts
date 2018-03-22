import ISocket from "./ISocket";

export declare enum EnvironmentType {
    NodeJS,
    Browser
}

export default interface IEnvironment {
    readonly environmentType: EnvironmentType;
    readonly argv: Array<string>;
    getSocket(): ISocket;
}