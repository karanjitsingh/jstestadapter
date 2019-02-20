const assert = require('assert');
const fs = require('fs');
const jstestcontext = require('jstestcontext');
const path = require('path');
describe('suite c', function () {
    it('test case c1', function () {

    });
    it('test case c2', function () {
        assert.fail('failure');
    });
    it('test case c3', function () {
        const attachmentsDir = jstestcontext.TestContext.Attachments.getTestAttachmentDirectory();
        fs.writeFileSync(path.join(attachmentsDir, "suite-c.file1.log"), "attachment1 saved");
        fs.writeFileSync(path.join(attachmentsDir, "suite-c.file2.log"), "attachment2 saved");
    });
})