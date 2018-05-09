namespace JSTest.JSRuntime
{
    using System.Diagnostics;
    using Microsoft.VisualStudio.TestPlatform.PlatformAbstractions.Interfaces;
    using JSTest.Settings;

    internal interface IRuntimeProvider
    {
        ProcessStartInfo GetRuntimeProcessInfo(JSTestSettings settings, IEnvironment environment);
    }
}
