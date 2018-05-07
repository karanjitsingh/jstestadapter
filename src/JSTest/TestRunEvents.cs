using Microsoft.VisualStudio.TestPlatform.ObjectModel;
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
        public event EventHandler<EventArgs> onMessage;
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

}
