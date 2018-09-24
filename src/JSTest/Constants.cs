using JSTest.Settings;
using System;
using System.Collections.Generic;
using System.Text;

namespace JSTest
{
    internal static class Constants
    {
        public const int VsTestNodeStartInfiniteTimout = -1;
        public const int DefaultVsTestNodeStartTimeout = 30000;
        public const string VsTestNodeStartTimeout = "VsTestNodeStartTimeout";
        public const int MessageProtocolVersion = 1;
        public const int StreamBufferSize = 16384;

        public static class TestFrameworkStrings
        {
            public const string Jasmine = "jasmine";
            public const string Mocha = "mocha";
            public const string Jest = "jest";
        }

        public static class JavaScriptRuntimeStrings
        {
            public const string NodeJS = "node";
        }
    }
}
