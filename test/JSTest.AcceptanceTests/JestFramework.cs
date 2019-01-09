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
    public class JestFramework : BaseFrameworkTest
    {
        protected override string ContainerExtension
        {
            get
            {
                return "package.json";
            }
        }

        public JestFramework() : base()
        {
            this.ExpectedOutput.ExecutionOutput = new List<string>
            {
                "Passed   suite a > test case a1",
                "Failed   suite a > test case a2",
                "Passed   suite b > test case b1",
                "Failed   suite b > test case b2",
                "Passed   suite c > test case c1",
                "Failed   suite c > test case c2"
            };
            this.ExpectedOutput.ExecutionWithTestsOutput = new List<string>
            {
                "Passed   suite a > test case a1",
                "Skipped  suite a > test case a2",
                "Passed   suite c > test case c1",
                "Skipped  suite c > test case c2",
                "Passed   suite b > test case b1",
                "Skipped  suite b > test case b2"
            };
        }


        [ClassInitialize]
        public static void ClassInitialize(TestContext context)
        {
            JestFramework.InitializeBase("jest", "Jest", "Jest", "23.6.0");
        }

        [TestMethod]
        public void TestExecutionJest()
        {
            this.TestExecution();
        }


        [TestMethod]
        public void TestExecutionWithTestsJest()
        {
            this.TestExecutionWithTests();
        }

        [TestMethod]
        public void TestDiscoveryJest()
        {
            this.TestDiscovery();
        }
    }
}
