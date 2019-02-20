const assert = require('assert');
const fs = require('fs');
const jstestcontext = require('jstestcontext');
const path = require('path');
describe('suite a', () => {
    it('test case a1', () => {

    });
    it('test case a2', () => {
        assert.fail('failure');
    });
    it('test case a3', function () {
        const attachmentsDir = jstestcontext.TestContext.Attachments.getTestAttachmentDirectory();
        fs.writeFileSync(path.join(attachmentsDir, "suite-a.file1.log"), "attachment1 saved");
    });
})