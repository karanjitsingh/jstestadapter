using System;
using JSTest;
using JSTest.Settings;

namespace JSTest.Console
{
    class Program
    {
        static void Main(string[] args)
        {
            var runner = new TestRunner();

            runner.StartExecution(new string[] { @"D:\JSTestAdapter\test\JSTestHost.UnitTests\bin\test\JSTestHost.UnitTests\Environment\EnvironmentProviderTests.js" }, new JSTestSettings());

            System.Console.WriteLine(runner != null);
            System.Console.ReadLine();

            runner.Dispose();
        }
    }
}
