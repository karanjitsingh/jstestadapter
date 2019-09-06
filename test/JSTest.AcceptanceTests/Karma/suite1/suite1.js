//!
//! Copyright (C) Microsoft Corporation.  All rights reserved.
//!

// This test suite acts as an example test suite, illustrating how to write 
// tests using ScriptTestOrchestrator. See also the *.testsuite.js file in this folder.

QUnit.module("test suite one");

QUnit.test('one alpha', function (assert) {
    assert.ok(1 + 1 == 2, "1 + 1 == 2");
});

QUnit.test('one beta', function (assert) {
    assert.ok(!(null), "not null");
});

