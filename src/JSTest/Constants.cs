namespace JSTest
{
    internal static class Constants
    {
        public const int VsTestNodeStartInfiniteTimout = -1;
        public const int DefaultVsTestNodeStartTimeout = 30000;
        public const int DefaultVsTestConnectionTimeout = 60000;
        public const string VsTestNodeStartTimeout = "VsTestNodeStartTimeout";
        public const string VsTestConnectionTimeout = "VsTestConnectionTimeout";
        public const int MessageProtocolVersion = 2;
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