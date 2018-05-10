using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using System;
using System.Collections.Generic;
using System.Text;

namespace JSTest.Communication.Payloads
{
    [Serializable]
    public class TestCaseStartEventArgs : EventArgs
    {
        public TestCase TestCase;
    }

    [Serializable]
    public class TestCaseFoundEventArgs : TestCaseStartEventArgs
    {
    }

    [Serializable]
    public class TestCaseEndEventArgs : EventArgs
    {
        public TestResult TestResult;
    }
}
