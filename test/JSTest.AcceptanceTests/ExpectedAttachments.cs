
using System.Collections.Generic;

namespace JSTest.AcceptanceTests
{
    public class ExpectedAttachments
    {
        public ExpectedAttachments(List<string> Attachments)
        {
            this.Attachments = Attachments;
        }

        public List<string> Attachments;
    }
}