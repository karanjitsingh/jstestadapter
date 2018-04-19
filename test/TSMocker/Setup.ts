namespace Mock {
    export interface IReturnsResult<T> {
        Returns(T: T): T;
    }

    class ReturnsResult<T> {
        public Returns(T: T): T {
            return T;
        }
    }

    export interface Setup<X, Y> {

    }
}