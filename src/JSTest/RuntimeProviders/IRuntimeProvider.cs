namespace JSTest.RuntimeProviders
{
    using System.Diagnostics;
    using Microsoft.VisualStudio.TestPlatform.PlatformAbstractions.Interfaces;
    using JSTest.Settings;
    using Microsoft.VisualStudio.TestPlatform.ObjectModel;

    internal interface IRuntimeProvider
    {
        TestProcessStartInfo GetRuntimeProcessInfo(IEnvironment environment, bool debugEnabled);
    }
}
