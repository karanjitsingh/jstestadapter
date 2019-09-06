//!
//! Copyright (C) Microsoft Corporation.  All rights reserved.
//!

describe("test suite three", function () {
    it('calls a hello world server', function () {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "http://localhost:3000/", false);
        xhr.send();

        expect(xhr.responseText).to.equal("Hello World");
    });

    it('calls a hello world server with a name', function () {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "http://localhost:3000/name/Javascript/", false);
        xhr.send();

        expect(xhr.responseText).to.equal("Hello Javascript");
    });

    describe("nested group of tests", function () {
        it("nested group test case", function () {
            expect(1).to.equal(1);
        });
    });
});
