using System;
using JSTest.Communication.Payloads;
using JSTest.Interfaces;

namespace JSTest
{
    internal class TestRunEvents : ITestRunEvents
    {
        public event EventHandler<TestCaseStartEventArgs> onTestCaseStart;
        public event EventHandler<TestCaseEndEventArgs> onTestCaseEnd;
        public event EventHandler<TestCaseFoundEventArgs> onTestCaseFound;
        public event EventHandler<TestMessagePayload> onTestMessageReceived;
        public event EventHandler<EventArgs> onTestSessionEnd;

        internal Boolean DisableInvoke = false;

        internal void InvokeTestCaseStart(object sender, TestCaseStartEventArgs args)
        {
            if (!this.DisableInvoke && this.onTestCaseStart != null)
            {
                this.onTestCaseStart.Invoke(sender, args);
            }
        }

        internal void InvokeTestCaseEnd(object sender, TestCaseEndEventArgs args)
        {
            if (!this.DisableInvoke && this.onTestCaseEnd != null)
            {
                this.onTestCaseEnd.Invoke(sender, args);
            }
        }

        internal void InvokeTestCaseFound(object sender, TestCaseFoundEventArgs args)
        {
            if (!this.DisableInvoke && this.onTestCaseFound != null)
            {
                this.onTestCaseFound.Invoke(sender, args);
            }
        }

        internal void InvokeMessageReceived(object sender, TestMessagePayload args)
        {
            if (!this.DisableInvoke && this.onTestMessageReceived != null)
            {
                this.onTestMessageReceived.Invoke(sender, args);
            }
        }

        internal void InvokeTestSessionEnd(object sender)
        {
            if (!this.DisableInvoke && this.onTestSessionEnd != null)
            {
                this.onTestSessionEnd.Invoke(sender, null);
            }
        }
    }
}
