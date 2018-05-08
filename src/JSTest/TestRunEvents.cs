using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace JSTest
{
    public class TestRunEvents
    {
        public event EventHandler<EventArgs> onTestCaseStart;
        public event EventHandler<EventArgs> onTestCaseEnd;
        public event EventHandler<EventArgs> onTestSessionEnd;
        public event EventHandler<TestCaseFoundEventArgs> onTestCaseFound;
        public event EventHandler<TestMessageReceivedEventArgs> onTestMessageReceived;
    }

    public class TestCaseFoundEventArgs : EventArgs
    {
        public TestCase TestCase {
            private set;
            get;
        }

        public TestCaseFoundEventArgs(TestCase testCase)
        {
            this.TestCase = testCase;
        }
    }

    public class TestMessageReceivedEventArgs : EventArgs
    {
        public string Message { private set; get; }
        public TestMessageLevel MessageLevel { private set; get; }

        public TestMessageReceivedEventArgs(Message message)
        {

        }
    }

}
