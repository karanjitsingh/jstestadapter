QUnit.module("Qunit test suite one");

QUnit.test('one alpha', function (assert) {
    assert.ok(1 + 1 == 2, "1 + 1 == 2");
});

QUnit.test('one beta', function (assert) {
    assert.ok(!(null), "not null");
});