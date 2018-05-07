using JSTest.Settings;
using System;
using System.Collections.Generic;
using System.Text;


namespace JSTest
{
    public class TestRunner
    {
        public TestRunEvents TestRunEvents
        {
            private set;
            get;
        }

        public TestRunner()
        {
            this.TestRunEvents = new TestRunEvents();
        }

        public void DiscoverTests(IEnumerable<string> sources, JSTestSettings settings) {
        }
    }
}
