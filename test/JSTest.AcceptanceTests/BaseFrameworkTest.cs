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
        protected static string testRepoPath { get; private set; }
        protected static string jstestPackage { get; private set; }
        protected static string vstestPath { get; private set; }
        protected static string testExecutionDirectory { get; private set; }

        #region Constructor

        public BaseFrameworkTest()
        {
           }

        #endregion

        #region Protected Methods

        protected ExecutionOutput RunTests(IEnumerable<string> files, IDictionary<string, string> cliOptions, IDictionary<string, string> runConfig)
        {
            var process = new Process();
            var startInfo = new ProcessStartInfo();
            
            startInfo.UseShellExecute = false;
            startInfo.WindowStyle = ProcessWindowStyle.Hidden;
            startInfo.FileName = BaseFrameworkTest.vstestPath;
            startInfo.Arguments = this.BuildVSTestArgs(files, cliOptions, runConfig);
            startInfo.RedirectStandardError = true;
            startInfo.RedirectStandardOutput = true;

            process.StartInfo = startInfo;
            process.StartInfo.UseShellExecute = false;

            Console.Write($"{startInfo.FileName} {startInfo.Arguments}");

            process.Start();
            process.WaitForExit(20000);

            return new ExecutionOutput(process);
        }

        protected static void InstallNpmPackage(string package)
        {
            var process = new Process();
            var startInfo = new ProcessStartInfo();

            startInfo.UseShellExecute = false;
            startInfo.WindowStyle = ProcessWindowStyle.Hidden;
            startInfo.FileName = "cmd.exe";
            startInfo.WorkingDirectory = BaseFrameworkTest.testRepoPath;
            startInfo.Arguments = $"/C npm install {package} --silent";
            startInfo.RedirectStandardError = true;
            startInfo.RedirectStandardOutput = true;

            process.StartInfo = startInfo;
            process.StartInfo.UseShellExecute = false;

            process.OutputDataReceived += (sender, data) => BaseFrameworkTest.PrintOutputToConsole(data);
            process.ErrorDataReceived += (sender, data) => BaseFrameworkTest.PrintOutputToConsole(data, true);

            process.Start();

            process.BeginErrorReadLine();
            process.BeginOutputReadLine();

            process.WaitForExit();
        }

        protected static void CopyRepoItems(string testFrameworkName)
        {
            var testFrameworkItems = Path.Combine(MochaFramework.testExecutionDirectory, testFrameworkName);

            if (!Directory.Exists(testFrameworkItems))
            {
                throw new Exception("Could not find items for test framework " + testFrameworkName);
            }

            //Create Directories
            foreach (string dirPath in Directory.GetDirectories(testFrameworkItems, "*",
                SearchOption.AllDirectories))
                Directory.CreateDirectory(dirPath.Replace(testFrameworkItems, MochaFramework.testRepoPath));

            //Copy all the files
            foreach (string newPath in Directory.GetFiles(testFrameworkItems, "*.*",
                SearchOption.AllDirectories))
                File.Copy(newPath, newPath.Replace(testFrameworkItems, MochaFramework.testRepoPath), true);
        }

        protected static void InitializeBase()
        {
            BaseFrameworkTest.InitializePaths();
            BaseFrameworkTest.InitializeTempFolder();
        }

        #endregion

        #region Private Methods

        private string BuildVSTestArgs(IEnumerable<string> files, IDictionary<string, string> cliOptions, IDictionary<string, string> runConfig)
        {
            var args = $"--Inisolation --TestAdapterPath:{Path.Combine(testRepoPath, "node_modules", "jstestadapter")}";

            foreach(var entry in cliOptions)
            {
                args += " --" + entry.Key + (!string.IsNullOrEmpty(entry.Value)? ":" + entry.Value: string.Empty);
            }

            foreach (var file in files)
            {
                args += $" {file}";
            }

            if (runConfig.Count > 0)
            {
                args += " --";
            }

            foreach (var entry in runConfig)
            {
                args += $" JSTest.{entry.Key}={entry.Value}";
            }

            return args;
        }

        private static void PrintOutputToConsole(DataReceivedEventArgs data, bool error = false)
        {
            if (error)
            {
                Console.Error.Write(data.Data + Environment.NewLine);
            }
            else
            {
                Console.Write(data.Data + Environment.NewLine);
            }
        }

        private static void InitializePaths()
        {
            do
            {
                BaseFrameworkTest.testRepoPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
            } while (Directory.Exists(testRepoPath));

            // This dll resides in folder: ...\JSTestAdapter\test\JSTest.AcceptanceTests\bin\Debug
            var projectFolder = Directory.GetParent(Assembly.GetExecutingAssembly().Location).Parent.Parent.Parent.Parent.FullName;

#if DEBUG
            var config = "Debug";
#else
            var config = "Release";
#endif
            var jstestPackageFolder = Path.Combine(projectFolder, "artifacts", config);
            var packages = Directory.EnumerateFiles(jstestPackageFolder, "*.tgz", SearchOption.TopDirectoryOnly);

            BaseFrameworkTest.jstestPackage = packages.First();
            BaseFrameworkTest.vstestPath = Path.Combine(Path.GetDirectoryName(Process.GetCurrentProcess().MainModule.FileName), "vstest.console.exe");

            if (!File.Exists(BaseFrameworkTest.vstestPath))
            {
                throw new Exception($"Could not find {BaseFrameworkTest.vstestPath}");
            }

            BaseFrameworkTest.testExecutionDirectory = Directory.GetParent(Assembly.GetExecutingAssembly().Location).FullName;
        }

        private static void InitializeTempFolder()
        {
            Directory.CreateDirectory(testRepoPath);
            BaseFrameworkTest.InstallNpmPackage(BaseFrameworkTest.jstestPackage);
        }

        #endregion

        #region TestMethods

        [ClassCleanup]
        public void Cleanup()
        {
            Directory.Delete(BaseFrameworkTest.testRepoPath, true);
        }

        [TestMethod]
        public abstract void TestDiscovery();

        [TestMethod]
        public abstract void TestExecution();

        #endregion

    }
}
 