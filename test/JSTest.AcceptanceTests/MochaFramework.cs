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

        protected override string ContainerExtension
        {
            get
            {
                return ".js";
            }
        }

        public MochaFramework() : base()
        {
        }


        [ClassInitialize]
        public static void ClassInitialize(TestContext context)
        {
            MochaFramework.InitializeBase("mocha", "Mocha", "Mocha");
        }

        [TestMethod]
        public void TestExecutionMocha()
        {
            this.TestExecution();
        }

        [TestMethod]
        public void TestDiscoveryMocha()
        {
            this.TestDiscovery();
        }
    }
}
