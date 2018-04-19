// tslint:disable:no-unnecessary-class function-name
namespace Mock {

    export class Mock<T> {
        public readonly mockObject: T;

        private static create<T>(genericType: (new () => T)): T {
            return new genericType();
        }

        constructor() {
            this.mockObject = <T>{};


        }

        public Setup<X, Y>(expression: (obj: X) => Y): ISetup<X, Y> {

        }
    }
}