using System;
using System.Collections.Generic;
using System.Text;

namespace JSTest.Communication
{
    internal static class MessageType
    {
        public const string TestRunSettings = "JSTest.TestRunSettings";
        public const string VersionCheck = "ProtocolVersion";
        public const string TestCaseFound = "JSTest.TestCaseFound";
        public const string TestCaseStart = "JSTest.TestCaseStart";
        public const string TestCaseEnd = "JSTest.TestCaseEnd";
        public const string DiscoveryComplete = "JSTest.DiscoveryComplete";
        public const string ExecutionComplete = "JSText.ExecutionComplete";
        public const string TestRunRequestWithSources = "JSTest.TestRunRequestWithSources";
        public const string TestMessage = "JSTest.TestMessage";
        public const string ConsoleMessage = "JSTest.ConsoleMessage";
        public const string StartTestExecutionWithSources = "JSTest.StartWithSources";
        public const string StartTestExecutionWithTests = "JSTest.StartWithTests";
        public const string StartDiscovery = "JSTest.StartDiscovery";
        public const string RunAttachments = "JSTest.RunAttachments";
    }
}
