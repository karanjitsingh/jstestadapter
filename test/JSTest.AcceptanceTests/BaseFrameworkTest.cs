using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using JSTest.Settings;
using System.IO;
using System.Reflection;
using System.Linq;
using System.Diagnostics;
using System.Collections;
using System.Collections.Generic;

namespace JSTest.AcceptanceTests
{
    [TestClass]
    public abstract class BaseFrameworkTest
    {
        protected readonly string testRepoPath = "test-repo";
        protected readonly string jstestPackage;

        public BaseFrameworkTest()
        {
            do
            {
                testRepoPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
            } while (Directory.Exists(testRepoPath));

            // ...\JSTestAdapter\test\JSTest.AcceptanceTests\bin\Debug
            var projectFolder = Directory.GetParent(Assembly.GetExecutingAssembly().Location).Parent.Parent.Parent.Parent.FullName;

#if DEBUG
            var config = "Debug";
#else
            var config = "Release";
#endif
            var jstestPackageFolder = Path.Combine(projectFolder, "artifacts", config);
            var packages = Directory.EnumerateFiles(jstestPackageFolder, "*.tgz", SearchOption.TopDirectoryOnly);

            this.jstestPackage = packages.Last();
        }

        private void PrintOutputToConsole(DataReceivedEventArgs data, bool error = false)
        {
            if (error)
            {
                Console.Error.Write(data);
            }
            else
            {
                Console.Write(data);
            }
        }

        protected void InstallNpmPackage(string package)
        {
            var process = new Process();
            var startInfo = new ProcessStartInfo();

            startInfo.WindowStyle = ProcessWindowStyle.Hidden;
            startInfo.FileName = "cmd.exe";
            startInfo.WorkingDirectory = this.testRepoPath;
            startInfo.Arguments = $"npm install {package}";
            startInfo.RedirectStandardError = true;
            startInfo.RedirectStandardOutput = true;

            process.StartInfo = startInfo;

            process.OutputDataReceived += (sender, data) => this.PrintOutputToConsole(data);
            process.ErrorDataReceived += (sender, data) => this.PrintOutputToConsole(data, true);

            process.Start();

            process.BeginErrorReadLine();
            process.BeginOutputReadLine();

            process.WaitForExit();

            //while (!process.StandardOutput.EndOfStream || !process.StandardError.EndOfStream) { }
        }

        protected void RunVSTest(IEnumerable<string> files, IDictionary<string, string> runConfig)
        { 

        }

        [TestInitialize]
        public void InitializeTempFolder()
        {
            Directory.CreateDirectory(testRepoPath);
            this.InstallNpmPackage(this.jstestPackage);
        }

        [TestCleanup]
        public void Cleanup()
        {
            Directory.Delete(testRepoPath, true);
        }

        [TestInitialize]
        public abstract void InitializeNPMModule();

        [TestMethod]
        public abstract void TestDiscovery();

        [TestMethod]
        public abstract void TestExecution();

    }
}
 