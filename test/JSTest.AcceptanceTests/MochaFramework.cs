using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace JSTest.AcceptanceTests
{

    [TestClass]
    public class MochaFramework : BaseFrameworkTest
    {

        public MochaFramework() : base()
        {
        }


        [ClassInitialize]
        public static void InitializeNPMModule(TestContext context)
        {
            MochaFramework.InitializeBase();
            MochaFramework.InstallNpmPackage("mocha");
            MochaFramework.CopyRepoItems("Mocha");
        }

        [TestMethod]
        public override void TestDiscovery()
        {
            var files = Directory.EnumerateFiles(MochaFramework.testRepoPath);
            files.Where((file) => file.EndsWith(".js"));

            var cliOptions = new Dictionary<string, string>
            {
                { "listtests", "" }
            };
            var runConfig = new Dictionary<string, string>()
            {
                { "TestFramework", "Jest" }
            };

            var output = this.RunTests(files, cliOptions, runConfig);
            var expectedOutput = new List<string> { "test case a1", "test case a2", "test case b1", "test case b2" };

            this.ValidateOutput(output, expectedOutput);
        }

        [TestMethod]
        public override void TestExecution()
        {
            //var files = Directory.EnumerateFiles(MochaFramework.testRepoPath);
            //files.Where((file) => file.EndsWith(".js"));

            //var cliOptions = new Dictionary<string, string>
            //{
            //    { "listtests", "" }
            //};
            //var runConfig = new Dictionary<string, string>()
            //{
            //    { "TestFramework", "Jest" }
            //};

            //var output = this.RunTests(files, cliOptions, runConfig);
            //////Console.Write(output.StdOut.ReadToEnd());
            ////Console.Write(output.StdErr.ReadToEnd());
            //Assert.Fail();
        }

        private void ValidateOutput(ExecutionOutput output, IEnumerable<string> expectedStdOut, bool failOnStdErr = true)
        {
            if (!string.IsNullOrEmpty(output.StdErr.ReadToEnd().Trim()) && failOnStdErr)
            {
                Assert.Fail("StandardError for execution should have been empty");
            }

            var stdout = output.StdOut.ReadToEnd();

            foreach (var str in expectedStdOut)
            {
                Assert.IsTrue(stdout.Contains(str), "Actual output did not match the expected output");
            }
        }

        private void ValidateOutput(ExecutionOutput output, IEnumerable<string> expectedStdOut, IEnumerable<string> expectedStdErr)
        {
            this.ValidateOutput(output, expectedStdOut, false);

            foreach (var str in expectedStdErr)
            {
                Assert.IsTrue(expectedStdErr.Contains(str), "Actual output did not match the expected output");
            }
        }
    }
}
