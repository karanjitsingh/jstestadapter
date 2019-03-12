using JSTest.Communication.Payloads;
using System;
using System.Collections.Generic;
using System.Text;

namespace JSTest.Interfaces
{
    public interface ITestRunEvents
    {
        event EventHandler<TestCaseStartEventArgs> onTestCaseStart;
        event EventHandler<TestCaseEndEventArgs> onTestCaseEnd;
        event EventHandler<TestCaseFoundEventArgs> onTestCaseFound;
        event EventHandler<TestMessagePayload> onTestMessageReceived;
        event EventHandler<EventArgs> onTestSessionEnd;
        event EventHandler<TestRunAttachmentPayload> onTestRunAttachmentReceived;
    }
}
