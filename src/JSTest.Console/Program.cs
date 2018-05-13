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

            runner.StartExecution(new string[] { @"D:\JSTestAdapter\test\JSTest.Runner.UnitTests\bin\test\JSTest.Runner.UnitTests\Environment\EnvironmentProviderTests.js" }, new JSTestSettings(), null);

            System.Console.WriteLine(runner != null);
            System.Console.ReadLine();

            runner.Dispose();
        }
    }
}
