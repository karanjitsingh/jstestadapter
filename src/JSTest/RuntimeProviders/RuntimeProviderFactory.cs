using JSTest.Settings;

namespace JSTest.RuntimeProviders
{
    internal static class RuntimeProviderFactory
    {
        public static IRuntimeProvider GetRuntime(JavaScriptRuntime javaScriptRuntime)
        {
            switch(javaScriptRuntime)
            {
                case JavaScriptRuntime.NodeJS:
                    return new NodeRuntimeProvider();
            }

            return null;
        }
    }
}
