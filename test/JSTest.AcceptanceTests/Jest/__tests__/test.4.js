const assert = require('assert');
const fs = require('fs');
const jstestcontext = require('jstestcontext');
const path = require('path');
describe('suite ax', () => {
    it('test case a1', () => {

    });
    it('test case a2', () => {
        assert.fail('failure');
    });
    it('test case a3', function () {
        const attachmentsDir = jstestcontext.TestContext.Attachments.getTestAttachmentDirectory();
        fs.writeFileSync(path.join(attachmentsDir, "suite-ax.file1.log"), "attachment1 saved");
        fs.writeFileSync(path.join(attachmentsDir, "suite-ax.file2.log"), "attachment2 saved");
        fs.writeFileSync(path.join(attachmentsDir, "suite-ax.file3.log"), "attachment3 saved");
    });
})