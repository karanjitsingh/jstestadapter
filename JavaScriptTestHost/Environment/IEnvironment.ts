import ICommunicationManager from "../CommunicationUtils/ICommunicationManager";

export enum EnvironmentType {
    NodeJS,
    Browser
}

export default interface IEnvironment {
    readonly environmentType: EnvironmentType;
    readonly argv: Array<string>;
    GetCommunicationManager(): ICommunicationManager;
}