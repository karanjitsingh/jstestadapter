"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//!
//! Copyright (C) Microsoft Corporation.  All rights reserved.
//!
//tslint:disable:prefer-type-cast
if (require.polyfill) {
    require._current = 'to/lib/PromiseAdaptors';
}
//tslint:disable:prefer-type-cast
/**
 *  Provides adaptor functions for interacting with node and mocha using promises.
 */
/**
 * Constructs a node style callback (separate error and non-error arguments) that fulfills a promise.
 */
var NodePromise = /** @class */ (function () {
    function NodePromise() {
        var _this = this;
        this.promise = new Promise(function (fulfill, reject) {
            _this.callback = function (err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    fulfill(result);
                }
            };
        });
    }
    return NodePromise;
}());
exports.NodePromise = NodePromise;
/**
 * Constructs a simple callback (no error handling) that fulfills a promise.
 */
var CallbackPromise = /** @class */ (function () {
    function CallbackPromise() {
        var _this = this;
        this.promise = new Promise(function (fulfill, _) {
            _this.callback = fulfill;
        });
    }
    return CallbackPromise;
}());
exports.CallbackPromise = CallbackPromise;
/*
 * Returns a promise that completes after the specified interval.
 */
function delay(duration) {
    var p = new CallbackPromise();
    setTimeout(p.callback, duration);
    return p.promise;
}
exports.delay = delay;
//# sourceMappingURL=PromiseAdaptors.js.map