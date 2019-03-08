import { ITestFramework, TestSessionEventArgs, TestSuiteEventArgs, TestSpecEventArgs,
         TestErrorMessageEventArgs, TestRunAttachmentEventArgs} from '../../ObjectModel/TestFramework';

export interface TestFrameworkEventHandlers {
    Subscribe: (framework: ITestFramework) => void;
    TestSessionStart?: (sender: object, args: TestSessionEventArgs) => void;
    TestSessionEnd?: (sender: object, args: TestSessionEventArgs) => void;
    TestSuiteStart?: (sender: object, args: TestSuiteEventArgs) => void;
    TestSuiteEnd?: (sender: object, args: TestSuiteEventArgs) => void;
    TestCaseStart?: (sender: object, args: TestSpecEventArgs) => void;
    TestCaseEnd?: (sender: object, args: TestSpecEventArgs) => void;
    TestRunAttachment?: (sender: object, args: TestRunAttachmentEventArgs) => void;
    TestErrorMessage: (sender: object, args: TestErrorMessageEventArgs) => void;
}