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

            runner.StartExecution(new string[0] { }, new JSTestSettings());

            System.Console.WriteLine(runner != null);
            System.Console.ReadLine();

            runner.Dispose();
        }
    }
}
