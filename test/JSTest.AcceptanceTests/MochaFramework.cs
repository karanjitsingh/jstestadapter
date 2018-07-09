using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Diagnostics;
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


        [TestInitialize]
        public override void InitializeNPMModule()
        {
            this.InstallNpmPackage("mocha");
        }

        [TestMethod]
        public override void TestDiscovery()
        {
            
        }

        [TestMethod]
        public override void TestExecution()
        {

        }
    }
}
