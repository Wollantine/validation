import { curry1, arrayOrItemToArray } from './utils';

export enum Variant {
  Valid = 'Valid',
  Invalid = 'Invalid',
}

export interface ValidationShape<E, A> {
  readonly variant: Variant;
  readonly value: A;
  readonly errors?: E[];

  isValid: (this: Validation<E, A>) => this is Valid<E, A>;
  isInvalid: (this: Validation<E, A>) => this is Invalid<E, A>;
  errorsOr: <T>(this: Validation<E, A>, alt: T) => E[] | T;

  concat: <B>(
    this: Validation<E, A>,
    val: Validation<E, B>
  ) => Validation<E, B>;
  map: <B>(this: Validation<E, A>, fn: (a: A) => B) => Validation<E, B>;
  ap: <B>(
    this: Validation<E, A>,
    valAtoB: Validation<E, (a: A) => B>
  ) => Validation<E, B>;
  chain: <B>(
    this: Validation<E, A>,
    fn: (a: A) => Validation<E, B>
  ) => Validation<E, B>;
  fold: <B>(
    this: Validation<E, A>,
    fnInvalid: (e: E[], a: A) => B,
    fnValid: (a: A) => B
  ) => B;
  validateEither: (
    this: Validation<E, A>,
    either: Either<E | E[], A>
  ) => Validation<E, A>;
  validateEitherList: (
    this: Validation<E, A>,
    eitherList: Either<E | E[], A>[]
  ) => Validation<E, A>;
  validate: (
    this: Validation<E, A>,
    validator: (a: A) => Either<E | E[], A>
  ) => Validation<E, A>;
  validateAll: (
    this: Validation<E, A>,
    validators: ((a: A) => Either<E | E[], A>)[]
  ) => Validation<E, A>;
}

export type Validation<E, V> = Valid<any, V> | Invalid<E, V>;

export class Valid<E, V> implements ValidationShape<E, V> {
  readonly variant: Variant.Valid = Variant.Valid;

  readonly value: V;

  constructor(value: V) {
    this.value = value;
  }

  isValid(): this is Valid<E, V> {
    return true;
  }

  isInvalid(): this is Invalid<E, V> {
    return false;
  }

  errorsOr<T>(alt: T): E[] | T {
    return alt;
  }

  concat<B>(val: Validation<E, B>): Validation<E, B> {
    return concat(this as Validation<E, V>, val);
  }

  map<B>(fn: (a: V) => B): Validation<E, B> {
    return map(fn, this as Validation<E, V>);
  }

  ap<B>(validation: Validation<E, (a: V) => B>): Validation<E, B> {
    return ap(validation, this as Validation<E, V>);
  }

  chain<B>(fn: (a: V) => Validation<E, B>): Validation<E, B> {
    return chain(fn, this as Validation<E, V>);
  }

  fold<B>(fnInvalid: (e: E[], a: V) => B, fnValid: (a: V) => B): B {
    return fold(fnInvalid, fnValid, this as Validation<E, V>);
  }

  validateEither<E>(either: Either<E | E[], V>): Validation<E, V> {
    return validateEither(this as Validation<E, V>, either);
  }

  validateEitherList<E>(eitherList: Either<E | E[], V>[]): Validation<E, V> {
    return validateEitherList(this as Validation<E, V>, eitherList);
  }

  validate<E>(validator: (a: V) => Either<E | E[], V>): Validation<E, V> {
    return validate(this as Validation<E, V>, validator);
  }

  validateAll<E>(
    validators: ((a: V) => Either<E | E[], V>)[]
  ): Validation<E, V> {
    return validateAll(this as Validation<E, V>, validators);
  }
}

export class Invalid<E, V> implements ValidationShape<E, V> {
  readonly variant: Variant.Invalid = Variant.Invalid;

  readonly errors: E[];
  readonly value: V;

  constructor(value: V, errors: E[]) {
    if (errors.length === 0) {
      throw new Error(
        'Tried to construct `Invalid` with an empty array of errors'
      );
    }
    this.errors = errors;
    this.value = value;
  }

  isValid(): this is Valid<E, V> {
    return false;
  }

  isInvalid(): this is Invalid<E, V> {
    return true;
  }

  errorsOr<T>(alt: T): T | E[] {
    return errorsOr(alt, this);
  }

  concat<B>(val: Validation<E, B>): Validation<E, B> {
    return concat(this, val);
  }

  map<B>(fn: (a: V) => B): Invalid<E, B> {
    return map(fn, this) as Invalid<E, B>;
  }

  ap<B>(validation: Validation<E, (a: V) => B>): Validation<E, B> {
    return ap(validation, this);
  }

  chain<B>(fn: (a: V) => Validation<E, B>): Validation<E, B> {
    return chain(fn, this);
  }

  fold<B>(fnInvalid: (e: E[], a: V) => B, fnValid: (a: V) => B): B {
    return fold(fnInvalid, fnValid, this);
  }

  validateEither(either: Either<E | E[], V>): Validation<E, V> {
    return validateEither(this, either);
  }

  validateEitherList(eitherList: Either<E | E[], V>[]): Validation<E, V> {
    return validateEitherList(this, eitherList);
  }

  validate(validator: (a: V) => Either<E | E[], V>): Validation<E, V> {
    return validate(this, validator);
  }

  validateAll(validators: ((a: V) => Either<E | E[], V>)[]): Validation<E, V> {
    return validateAll(this, validators);
  }
}

export const valid = <V>(value: V): Valid<any, V> => new Valid(value);

export const invalid = <e, v>(value: v, errors: e[]): Invalid<e, v> =>
  new Invalid(value, errors);

export function isValid<E, V>(
  validation: Validation<any, V>
): validation is Valid<any, V> {
  return validation.variant === Variant.Valid;
}

export function isInvalid<E, V>(
  validation: Validation<E, V>
): validation is Invalid<E, V> {
  return validation.variant === Variant.Invalid;
}

export const of = <e, v>(
  value: v | Validation<e, v>,
  errors?: e[] | null
): Validation<e, v> => {
  if (value instanceof Valid || value instanceof Invalid) {
    return value;
  }
  return errors && errors.length > 0 ? invalid(value, errors) : valid(value);
};

export function errorsOr<E, T>(
  alt: T
): (validation: Validation<E, any>) => E[] | T;
export function errorsOr<E, T>(alt: T, validation: Validation<E, any>): E[] | T;
export function errorsOr<E, T>(
  alt: T,
  validation?: Validation<E, any>
): E[] | T | ((validation: Validation<E, any>) => E[] | T) {
  const op = (v: Validation<E, any>) =>
    v.isValid() ? alt : (v as Invalid<E, any>).errors;
  return curry1(op, validation);
}

export function concat<E, A, B>(
  valA: Validation<E, A>
): (valB: Validation<E, B>) => Validation<E, B>;
export function concat<E, A, B>(
  valA: Validation<E, A>,
  valB: Validation<E, B>
): Validation<E, B>;
export function concat<E, A, B>(
  valA: Validation<E, A>,
  valB?: Validation<E, B>
): Validation<E, B> | ((valB: Validation<E, B>) => Validation<E, B>) {
  const op = (v: Validation<E, B>) => {
    const shouldBeValid = valA.isValid() && v.isValid();
    return shouldBeValid
      ? v
      : invalid(v.value, [...valA.errorsOr([]), ...v.errorsOr([])] as E[]);
  };
  return curry1(op, valB) as <T>(v: Validation<E, T>) => Validation<E, T>;
}

export function map<A, B, E>(
  fn: (a: A) => B
): (validation: Validation<E, A>) => Validation<E, B>;
export function map<A, B, E>(
  fn: (a: A) => B,
  validation: Validation<E, A>
): Validation<E, B>;
export function map<A, B, E>(
  fn: (a: A) => B,
  validation?: Validation<E, A>
): Validation<E, B> | ((validation: Validation<E, A>) => Validation<E, B>) {
  const op = (v: Validation<E, A>) =>
    v.isValid()
      ? valid(fn(v.value))
      : invalid(fn(v.value), (v as Invalid<E, A>).errors);
  return curry1(op, validation);
}

export function ap<A, B, E>(
  valFn: Validation<E, (a: A) => B>
): (valA: Validation<E, A>) => Validation<E, B>;
export function ap<A, B, E>(
  valFn: Validation<E, (a: A) => B>,
  valA: Validation<E, A>
): Validation<E, B>;
export function ap<A, B, E>(
  valFn: Validation<E, (a: A) => B>,
  valA?: Validation<E, A>
): Validation<E, B> | ((valA: Validation<E, A>) => Validation<E, B>) {
  const op = (v: Validation<E, A>) => {
    const shouldBeValid = v.isValid() && valFn.isValid();
    return shouldBeValid
      ? valid(valFn.value(v.value))
      : invalid(valFn.value(v.value), [
          ...v.errorsOr([]),
          ...valFn.errorsOr([]),
        ] as E[]);
  };
  return curry1(op, valA);
}

export function chain<A, B, E>(
  fn: (a: A) => Validation<E, B>
): (validation: Validation<E, A>) => Validation<E, B>;
export function chain<A, B, E>(
  fn: (a: A) => Validation<E, B>,
  validation: Validation<E, A>
): Validation<E, B>;
export function chain<A, B, E>(
  fn: (a: A) => Validation<E, B>,
  validation?: Validation<E, A>
): Validation<E, B> | ((validation: Validation<E, A>) => Validation<E, B>) {
  const op = (v: Validation<E, A>) => {
    const newValidation = fn(v.value);
    return concat(v, newValidation);
  };
  return curry1(op, validation);
}

export function fold<A, E, B>(
  fnInvalid: (e: E[], a: A) => B,
  fnValid: (a: A) => B
): (validation: Validation<E, A>) => B;
export function fold<A, E, B>(
  fnInvalid: (e: E[], a: A) => B,
  fnValid: (a: A) => B,
  validation: Validation<E, A>
): B;
export function fold<A, E, B>(
  fnInvalid: (e: E[], a: A) => B,
  fnValid: (a: A) => B,
  validation?: Validation<E, A>
): B | ((validation: Validation<E, A>) => B) {
  const op = (v: Validation<E, A>) =>
    v.isValid()
      ? fnValid(v.value)
      : fnInvalid((v as Invalid<E, A>).errors, v.value);
  return curry1(op, validation);
}

export type Either<T, U> = {
  fold: <A>(this: Either<T, U>, left: (t: T) => A, right: (u: U) => A) => A;
};

export function validateEither<E, V>(
  validation: Validation<E, V>
): (either: Either<E | E[], V>) => Validation<E, V>;
export function validateEither<E, V>(
  validation: Validation<E, V>,
  either: Either<E | E[], V>
): Validation<E, V>;
export function validateEither<E, V>(
  validation: Validation<E, V>,
  either?: Either<E | E[], V>
): Validation<E, V> | ((either: Either<E | E[], V>) => Validation<E, V>) {
  const op = (e: Either<E | E[], V>) => {
    const newVal = e.fold(
      errors =>
        invalid(validation.value, arrayOrItemToArray(errors)) as Validation<
          E,
          V
        >,
      value => valid(value) as Validation<E, V>
    );
    return concat(validation, newVal);
  };
  return curry1(op, either);
}

export function validateEitherList<E, V>(
  validation: Validation<E, V>
): (eitherList: Either<E | E[], V>[]) => Validation<E, V>;
export function validateEitherList<E, V>(
  validation: Validation<E, V>,
  eitherList: Either<E | E[], V>[]
): Validation<E, V>;
export function validateEitherList<E, V>(
  validation: Validation<E, V>,
  eitherList?: Either<E | E[], V>[]
): Validation<E, V> | ((eitherList: Either<E | E[], V>[]) => Validation<E, V>) {
  const op = (el: Either<E | E[], V>[]): Validation<E, V> =>
    el.reduce((v, e) => validateEither(v, e), validation) as Validation<E, V>;
  return curry1(op, eitherList);
}

export function validate<E, V>(
  validation: Validation<E, V>
): (validator: (a: V) => Either<E | E[], V>) => Validation<E, V>;
export function validate<E, V>(
  validation: Validation<E, V>,
  validator: (a: V) => Either<E | E[], V>
): Validation<E, V>;
export function validate<E, V>(
  validation: Validation<E, V>,
  validator?: (a: V) => Either<E | E[], V>
):
  | Validation<E, V>
  | ((validator: (a: V) => Either<E | E[], V>) => Validation<E, V>) {
  const op = (v: (a: V) => Either<E | E[], V>) =>
    validateEither(validation, v(validation.value));
  return curry1(op, validator);
}

export function validateAll<E, V>(
  validation: Validation<E, V>
): (validators: ((a: V) => Either<E | E[], V>)[]) => Validation<E, V>;
export function validateAll<E, V>(
  validation: Validation<E, V>,
  validators: ((a: V) => Either<E | E[], V>)[]
): Validation<E, V>;
export function validateAll<E, V>(
  validation: Validation<E, V>,
  validators?: ((a: V) => Either<E | E[], V>)[]
):
  | Validation<E, V>
  | ((validators: ((a: V) => Either<E | E[], V>)[]) => Validation<E, V>) {
  const op = (vl: ((a: V) => Either<E | E[], V>)[]) =>
    vl.reduce((v, f) => validate(v, f), validation);
  return curry1(op, validators);
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
};

export default Validation;
