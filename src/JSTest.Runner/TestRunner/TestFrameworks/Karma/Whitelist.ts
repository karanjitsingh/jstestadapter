export type StringPredicate = (key: string) => boolean;

/**
 * Validates that an object's keys correspond to the expected key schema.
 *
 * e.g.
 *
 *     const wl = new Whitelist([
 *         "a",
 *         /b|c/,
 *         function (s) { return s[0] === "d"; }
 *     ]);
 *     console.log(wl.verifyObject({ a: 1, b: 2}));  // true
 *     console.log(wl.verifyKey("a"));               // true
 *     console.log(wl.verifyKey("dog"));             // true
 *     console.log(wl.verifyKey("anything else"));   // false
 */
export class Whitelist {
    private allowed: { [key: string]: boolean };
    private predicates: StringPredicate[];
    private regexps: RegExp[];

    public constructor(allowedKeys: (string | StringPredicate | RegExp)[]) {
        this.allowed = Object.create(null);
        this.predicates = [];
        this.regexps = [];

        for (const item of allowedKeys) {
            if (typeof item === 'string') {
                this.allowed[item] = true;
            } else if (typeof item === 'function') {
                this.predicates.push(item);
            } else if (item instanceof RegExp) {
                this.regexps.push(item);
            }
        }
    }

    /**
     * Verifies that all keys on the object are allowed by the whitelist.
     */
    public verifyObject(obj: any): boolean;
    public verifyObject(obj: any, onError: string): true;
    public verifyObject<T>(obj: any, onError: (key: string) => T): true | T;
    public verifyObject<T>(obj: any, onError?: string | ((key: string) => T)): boolean | T {
        for (const key of Object.keys(obj)) {
        //for (const key in obj) {
            //tslint:disable:prefer-type-cast
            const result = this.verifyKey(key as string, onError as any);
            //tslint:disable:prefer-type-cast
            if (result !== true) {
                return result;
            }
        }
        return true;
    }

    /**
     * Verifies that the string specified by 'key' is allowed by the whitelist.
     */
    public verifyKey(key: string): boolean;
    public verifyKey(key: string, onError: string): true;
    public verifyKey<T>(key: string, onError: (key: string) => T): true | T;
    public verifyKey<T>(key: string, onError?: string | ((key: string) => T)): boolean | T {
        if (key in this.allowed) {
            return true;
        }
        for (const predicate of this.predicates) {
            if (predicate(key)) {
                return true;
            }
        }
        for (const regexp of this.regexps) {
            if (key.match(regexp)) {
                return true;
            }
        }
        if (typeof onError === 'function') {
            return onError(key);
        }
        else if (typeof onError === 'string') {
            throw new Error(onError);
        }
        return false;
    }
}
