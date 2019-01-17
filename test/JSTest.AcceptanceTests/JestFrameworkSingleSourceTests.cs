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
    public class JestFrameworkSingleSourceTests : BaseFrameworkTest
    {
        protected override string ContainerExtension
        {
            get
            {
                return "package.json";
            }
        }

        public JestFrameworkSingleSourceTests() : base()
        {
            this.ExpectedOutput.DiscoveryOutput = new List<string>
            {
                "suite a > test case a1",
                "suite a > test case a2",
                "suite b > test case b1",
                "suite b > test case b2",
                "suite c > test case c1",
                "suite c > test case c2"
            };

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
                "Failed   suite a > test case a2",
                "Passed   suite c > test case c1",
                "Skipped  suite c > test case c2",
                "Passed   suite b > test case b1",
                "Skipped  suite b > test case b2"
            };
        }


        [ClassInitialize]
        public static void ClassInitialize(TestContext context)
        {
            JestFrameworkMultipleSourceTests.InitializeBase("jest", "Jest", "Jest", "23.6.0");
        }

        [TestMethod]
        public void TestExecutionJest_SingleSource()
        {
            this.TestExecution();
        }

        [TestMethod]
        public void TestExecutionWithTestsJest_SingleSource()
        {
            this.TestExecutionWithTests();
        }

        [TestMethod]
        public void TestDiscoveryJest_SingleSource()
        {
            this.TestDiscovery();
        }
    }
}
