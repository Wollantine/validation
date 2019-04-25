import { curry1 } from './utils';

export enum Variant {
    Valid = 'Valid',
    Invalid = 'Invalid',
}

export interface Validation<E, A> {
    readonly variant: Variant
    readonly value: A

    isValid: (this: Validation<E, A>) => this is Valid<A>
    isInvalid: (this: Validation<E, A>) => this is Invalid<E, A>
    errorsOr: <T>(this: Validation<E, A>, alt: T) => E[] | T

    concat: <B>(this: Validation<E, A>, val: Validation<E, B>) => Validation<E, B>
    map: <B>(this: Validation<E, A>, fn: (a: A) => B) => Validation<E, B>
    ap: <B>(this: Validation<E, A>, valAtoB: Validation<E, (a: A) => B>) => Validation<E, B>
    chain: <B>(this: Validation<E, A>, fn: (a: A) => Validation<E, B>) => Validation<E, B>
    fold: <B>(this: Validation<E, A>, fnValid: (a: A) => B, fnInvalid: (a: A, e: E[]) => B) => B
    validateEither: (this: Validation<E, A>, either: Either<E[], A>) => Validation<E, A>
    validateEitherList: (this: Validation<E, A>, eitherList: Either<E[], A>[]) => Validation<E, A>
    validate: (this: Validation<E, A>, validator: (a: A) => Either<E[], A>) => Validation<E, A>
    validateAll: (this: Validation<E, A>, validators: ((a: A) => Either<E[], A>)[]) => Validation<E, A>
}

export class Valid<V> implements Validation<never, V> {
    readonly variant: Variant.Valid = Variant.Valid

    readonly value: V

    constructor(value: V) {
        this.value = value
    }

    isValid(): this is Valid<V> {
        return true
    }

    isInvalid(): this is Invalid<never, V> {
        return false
    }

    errorsOr<T>(alt: T): never[] | T {
        return errorsOr(alt, this) as T
    }

    concat<E, B>(val: Validation<E, B>): Validation<E, B> {
        return concat(this as Validation<E, V>, val)
    }

    map<B>(fn: (a: V) => B): Valid<B> {
        return map(fn, this) as Valid<B>
    }

    ap<E, B>(validation: Validation<E, (a: V) => B>): Validation<E, B> {
        return ap(validation, this as Validation<E, V>)
    }

    chain<E, B>(fn: (a: V) => Validation<E, B>): Validation<E, B> {
        return chain(fn, this as Validation<E, V>)
    }

    fold<E, B>(fnValid: (a: V) => B, fnInvalid: (a: V, e: E[]) => B): B {
        return fold(fnValid, fnInvalid, this)
    }

    validateEither<E>(either: Either<E[], V>): Validation<E, V> {
        return validateEither(this as Validation<E, V>, either)
    }

    validateEitherList<E>(eitherList: Either<E[], V>[]): Validation<E, V> {
        return validateEitherList(this as Validation<E, V>, eitherList)
    }

    validate<E>(validator: (a: V) => Either<E[], V>): Validation<E, V> {
        return validate(this as Validation<E, V>, validator)
    }

    validateAll<E>(validators: ((a: V) => Either<E[], V>)[]): Validation<E, V> {
        return validateAll(this as Validation<E, V>, validators)
    }
}

export class Invalid<E, V> implements Validation<E, V> {
    readonly variant: Variant.Invalid = Variant.Invalid

    readonly errors: E[]
    readonly value: V

    constructor(value: V, errors: E[]) {
        if (errors.length === 0) {
            throw new Error('Tried to construct `Invalid` with an empty array of errors')
        }
        this.errors = errors
        this.value = value
    }

    isValid(): this is Valid<V> {
        return false
    }

    isInvalid(): this is Invalid<E, V> {
        return true
    }

    errorsOr<T>(alt: T): T | E[] {
        return errorsOr(alt, this)
    }

    concat<B>(val: Validation<E, B>): Validation<E, B> {
        return concat(this, val)
    }

    map<B>(fn: (a: V) => B): Invalid<E, B> {
        return map(fn, this) as Invalid<E, B>
    }

    ap<B>(validation: Validation<E, (a: V) => B>): Validation<E, B> {
        return ap(validation, this)
    }

    chain<B>(fn: (a: V) => Validation<E, B>): Validation<E, B> {
        return chain(fn, this)
    }

    fold<B>(fnValid: (a: V) => B, fnInvalid: (a: V, e: E[]) => B): B {
        return fold(fnValid, fnInvalid, this)
    }

    validateEither(either: Either<E[], V>): Validation<E, V> {
        return validateEither(this, either)
    }

    validateEitherList(eitherList: Either<E[], V>[]): Validation<E, V> {
        return validateEitherList(this, eitherList)
    }

    validate(validator: (a: V) => Either<E[], V>): Validation<E, V> {
        return validate(this, validator)
    }

    validateAll(validators: ((a: V) => Either<E[], V>)[]): Validation<E, V> {
        return validateAll(this, validators)
    }
}

export const valid = <V>(value: V): Valid<V> => (
    new Valid(value)
)

export const invalid = <e, v>(value: v, errors: e[]): Invalid<e, v> => (
    new Invalid(value, errors)
)

export function isValid<V>(validation: Validation<any, V>): validation is Valid<V> {
    return validation.variant === Variant.Valid
}

export function isInvalid<E, V>(validation: Validation<E, V>): validation is Invalid<E, V> {
    return validation.variant === Variant.Invalid
}

export const of = <e, v>(value: v, errors?: e[] | null): Validation<e, v> => (
    errors && errors.length > 0
        ? invalid(value, errors)
        : valid(value)
)

export function errorsOr<E, T>(alt: T): (validation: Validation<E, any>) => E[] | T
export function errorsOr<E, T>(alt: T, validation: Validation<E, any>): E[] | T
export function errorsOr<E, T>(
    alt: T,
    validation?: Validation<E, any>
): E[] | T | ((validation: Validation<E, any>) => E[] | T) {
    const op = (v: Validation<E, any>) => (
        v.isValid()
            ? alt
            : (v as Invalid<E, any>).errors
    )
    return curry1(op, validation)
}

export function concat<E, A, B>(valA: Validation<E, A>): (valB: Validation<E, B>) => Validation<E, B>
export function concat<E, A, B>(valA: Validation<E, A>, valB: Validation<E, B>): Validation<E, B>
export function concat<E, A, B>(
    valA: Validation<E, A>,
    valB?: Validation<E, B>
): Validation<E, B> | ((valB: Validation<E, B>) => Validation<E, B>) {
    const op = (v: Validation<E, B>) => {
        const shouldBeValid = valA.isValid() && valB.isValid()
        return shouldBeValid
            ? valB
            : invalid(
                valB.value,
                [...valA.errorsOr([]), ...valB.errorsOr([])]
            )
    }
    return curry1(op, valB)
}

export function map<A, B, E>(fn: (a: A) => B): (validation: Validation<E, A>) => Validation<E, B>
export function map<A, B, E>(fn: (a: A) => B, validation: Validation<E, A>): Validation<E, B>
export function map<A, B, E>(
    fn: (a: A) => B,
    validation?: Validation<E, A>
): Validation<E, B> | ((validation?: Validation<E, A>) => Validation<E, B>) {
    const op = (v: Validation<E, A>) => (
        v.isValid()
            ? valid(fn(v.value))
            : invalid(fn(v.value), (v as Invalid<E, A>).errors)
    )
    return curry1(op, validation)
}

export function ap<A, B, E>(valFn: Validation<E, (a: A) => B>): (valA: Validation<E, A>) => Validation<E, B>
export function ap<A, B, E>(valFn: Validation<E, (a: A) => B>, valA: Validation<E, A>): Validation<E, B>
export function ap<A, B, E>(
    valFn: Validation<E, (a: A) => B>,
    valA?: Validation<E, A>
): Validation<E, B> | ((valA: Validation<E, A>) => Validation<E, B>) {
    const op = (v: Validation<E, A>) => (
        v.isValid()
            ? valid(valFn.value(v.value))
            : invalid(
                valFn.value(v.value),
                [...valFn.errorsOr([]), ...v.errorsOr([])]
            )
    )
    return curry1(op, valA)
}

export function chain<A, B, E>(fn: (a: A) => Validation<E, B>): (validation: Validation<E, A>) => Validation<E, B>
export function chain<A, B, E>(fn: (a: A) => Validation<E, B>, validation: Validation<E, A>): Validation<E, B>
export function chain<A, B, E>(
    fn: (a: A) => Validation<E, B>,
    validation?: Validation<E, A>
): Validation<E, B> | ((validation: Validation<E, A>) => Validation<E, B>) {
    const op = (v: Validation<E, A>) => {
        const newValidation = fn(v.value)
        return concat(v, newValidation)
    }
    return curry1(op, validation)
}

export function fold<A, E, B>(fnValid: (a: A) => B, fnInvalid: (a: A, e: E[]) => B): (validation: Validation<E, A>) => B
export function fold<A, E, B>(fnValid: (a: A) => B, fnInvalid: (a: A, e: E[]) => B, validation: Validation<E, A>): B
export function fold<A, E, B>(
    fnValid: (a: A) => B,
    fnInvalid: (a: A, e: E[]) => B,
    validation?: Validation<E, A>
):  B | ((validation: Validation<E, A>) => B) {
    const op = (v: Validation<E, A>) => (
        v.isValid()
            ? fnValid(v.value)
            : fnInvalid(v.value, (v as Invalid<E, A>).errors)
    )
    return curry1(op, validation)
}

export type Either<T, U> = {
    fold: <A>(this: Either<T, U>, left: (t: T) => A, right: (u: U) => A) => A
}

export function validateEither<E, V>(validation: Validation<E, V>): (either: Either<E[], V>) => Validation<E, V>
export function validateEither<E, V>(validation: Validation<E, V>, either: Either<E[], V>): Validation<E, V>
export function validateEither<E, V>(
    validation: Validation<E, V>,
    either?: Either<E[], V>
): Validation<E, V> | ((either: Either<E[], V>) => Validation<E, V>) {
    const op = (e: Either<E[], V>) => {
        const newVal = e.fold(
            errors => invalid(validation.value, errors) as Validation<E, V>,
            value => valid(value) as Validation<E, V>
        )
        return validation.concat(newVal)
    }
    return curry1(op, either)
}

export function validateEitherList<E, V>(validation: Validation<E, V>): (eitherList: Either<E[], V>[]) => Validation<E, V>
export function validateEitherList<E, V>(validation: Validation<E, V>, eitherList: Either<E[], V>[]): Validation<E, V>
export function validateEitherList<E, V>(
    validation: Validation<E, V>,
    eitherList?: Either<E[], V>[]
): Validation<E, V> | ((eitherList: Either<E[], V>[]) => Validation<E, V>) {
    const op = (el: Either<E[], V>[]) => (
        el.reduce((v, e) => validateEither(v, e), validation)
    )
    return curry1(op, eitherList)
}

export function validate<E, V>(validation: Validation<E, V>): (validator: (a: V) => Either<E[], V>) => Validation<E, V>
export function validate<E, V>(validation: Validation<E, V>, validator: (a: V) => Either<E[], V>): Validation<E, V>
export function validate<E, V>(
    validation: Validation<E, V>,
    validator?: (a: V) => Either<E[], V>
): Validation<E, V> | ((validator: (a: V) => Either<E[], V>) => Validation<E, V>) {
    const op = (v: (a: V) => Either<E[], V>) => (
        validateEither(validation, v(validation.value))
    )
    return curry1(op, validator)
}

export function validateAll<E, V>(validation: Validation<E, V>): (validators: ((a: V) => Either<E[], V>)[]) => Validation<E, V>
export function validateAll<E, V>(validation: Validation<E, V>, validators: ((a: V) => Either<E[], V>)[]): Validation<E, V>
export function validateAll<E, V>(
    validation: Validation<E, V>,
    validators?: ((a: V) => Either<E[], V>)[]
): Validation<E, V> | ((validators: ((a: V) => Either<E[], V>)[]) => Validation<E, V>) {
    const op = (vl: ((a: V) => Either<E[], V>)[]) => (
        vl.reduce((v, f) => validate(v, f), validation)
    )
    return curry1(op, validators)
}

export const Validation = {
    Variant,
    Valid,
    Invalid,
    valid,
    invalid,
    isValid,
    isInvalid,
    of,
    errorsOr,
    concat,
    map,
    ap,
    chain,
    fold,
    validateEither,
    validateEitherList,
    validate,
    validateAll,
}

export default Validation
