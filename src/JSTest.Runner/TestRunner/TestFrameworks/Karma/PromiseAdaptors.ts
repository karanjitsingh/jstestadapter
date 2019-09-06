//tslint:disable:prefer-type-cast
if ((require as any).polyfill) { (require as any)._current = 'to/lib/PromiseAdaptors'; }
//tslint:disable:prefer-type-cast
/**
 *  Provides adaptor functions for interacting with node and mocha using promises.
 */

/**
 * Constructs a node style callback (separate error and non-error arguments) that fulfills a promise.
 */
export class NodePromise<T> {
    public callback: (err: Error, result: T) => void;
    public readonly promise: Promise<T>;

    constructor() {
        this.promise = new Promise<T>((fulfill, reject) => {
            this.callback = (err: Error, result: T) => {
                if (err) {
                    reject(err);
                }
                else {
                    fulfill(result);
                }
            };
        });
    }
}

/**
 * Constructs a simple callback (no error handling) that fulfills a promise.
 */
export class CallbackPromise<T> {
    public callback: (result: T) => void;
    public readonly promise: Promise<T>;

    constructor() {
        this.promise = new Promise<T>((fulfill, _) => {
            this.callback = fulfill;
        });
    }
}

/*
 * Returns a promise that completes after the specified interval.
 */
export function delay(duration: number): Promise<void> {
    const p = new CallbackPromise<void>();
    setTimeout(p.callback, duration);
    return p.promise;
}
