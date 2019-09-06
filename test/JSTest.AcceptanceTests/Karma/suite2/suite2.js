//!
//! Copyright (C) Microsoft Corporation.  All rights reserved.
//!

QUnit.module("test suite two, freestanding");
QUnit.test('two alpha', function (assert) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://localhost:3000/", false);
    xhr.send();

    assert.ok(xhr.responseText == "Hello World");
});

QUnit.module("test suite two, nesting", function () {
    QUnit.test('two beta', function (assert) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "http://localhost:3000/name/Javascript/", false);
        xhr.send();

        assert.ok(xhr.responseText == "Hello Javascript");
    });

    QUnit.module("nested group of tests", function () {
        QUnit.test("nested group test case", function (assert) {
            assert.strictEqual(1, 1);
        });
    });
});
