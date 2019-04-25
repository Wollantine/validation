export const curry1 = <T, U>(
    fn: (t: T) => U,
    a?: T
): U | ((t: T) => U) => (
    a === undefined
        ? (a2: T) => fn(a2)
        : fn(a)
)
