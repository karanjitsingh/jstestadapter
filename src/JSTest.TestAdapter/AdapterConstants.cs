using System;
using System.Collections.Generic;
using System.Text;

namespace JSTest.TestAdapter
{
    public static class JSTestAdapterConstants
    {
        public const string ExecutorUri = "executor://JSTestAdapter/v1";
        public const string SettingsName = "JSTest";

        internal static class FileExtensions
        {
            public const string JavaScript = ".js";
            public const string JSON = ".json";
        }
    }
}
