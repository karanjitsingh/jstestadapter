export declare enum EnvironmentType {
    NodeJS,
    Browser
}


export default interface IEnvironment {
    environmentType: EnvironmentType;
}
