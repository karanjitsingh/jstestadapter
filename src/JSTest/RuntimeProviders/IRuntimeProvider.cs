namespace JSTest.RuntimeProviders
{
    using System.Diagnostics;
    using Microsoft.VisualStudio.TestPlatform.PlatformAbstractions.Interfaces;
    using JSTest.Settings;
    using Microsoft.VisualStudio.TestPlatform.ObjectModel;

    internal interface IRuntimeProvider
    {
        TestProcessStartInfo GetRuntimeProcessInfo(JSTestSettings settings, IEnvironment environment, bool debugEnabled);
    }
}
