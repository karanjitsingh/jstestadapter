using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using JSTest.Settings;

namespace JSTest.AcceptanceTests
{
    [TestClass]
    public class FrameworkTests
    {
        [TestInitialize]
        public void InitializeNPMModules()
        {
            foreach(var framework in Enum.GetValues(typeof(JSTestFramework)))
            {

            }
        }

        [TestMethod]
        public void TestDiscovery()
        {
        }

        [TestMethod]
        public void MochaTestExecution()
        {
        }

        [TestMethod]
        public void MochaTestExecutionWithTestCaseFilter()
        {
        }

        [TestCleanup]
        public void DeleteTestfolder()
        {

        }
    }
}
 