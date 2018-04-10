import Event, { IEventArgs } from "Events/Event";

interface BaseTestEventArgs extends IEventArgs {
    Source: string;
    StartTime: Date;
    InProgress: boolean;
    EndTime: Date;
}

export interface TestCaseEventArgs extends BaseTestEventArgs {
    Name: string;
    Fullname: string;
    Message: string;
    StackTrace: string;
    Passed: boolean;
}

export interface TestSuiteEventArgs extends BaseTestEventArgs {
    Name: string;
}

export interface TestSessionEventArgs extends BaseTestEventArgs {

}