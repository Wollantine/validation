import { curry1, arrayOrItemToArray } from './utils';
import { Variant } from './ValidationShape';
import { Valid } from './Valid';
import { Invalid } from './Invalid';

export type Validation<E, V> = Valid<any, V> | Invalid<E, V>;

export const valid = <V>(value: V): Valid<any, V> => new Valid(value);

export function invalid<E, V>(value: V): (errors: E | E[]) => Invalid<E, V>;
export function invalid<E, V>(value: V, errors: E | E[]): Invalid<E, V>;
export function invalid<E, V>(
  value: V,
  errors?: E | E[]
): ((errors: E | E[]) => Invalid<E, V>) | Invalid<E, V> {
  const op = (errors2: E | E[]) =>
    new Invalid(value, arrayOrItemToArray(errors2));
  return curry1(op, errors);
}

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

export const of = <E, V>(
  value: V | Validation<E, V>,
  errors?: E[] | null
): Validation<E, V> => {
  if (value instanceof Valid || value instanceof Invalid) {
    return value;
  }
  return errors && errors.length > 0 ? invalid(value, errors) : valid(value);
};

export function fromEither<E, V>(
  initialValue: V
): (either: Either<E | E[], V>) => Validation<E, V>;
export function fromEither<E, V>(
  initialValue: V,
  either: Either<E | E[], V>
): Validation<E, V>;
export function fromEither<E, V>(
  initialValue: V,
  either?: Either<E | E[], V>
): Validation<E, V> | ((either: Either<E | E[], V>) => Validation<E, V>) {
  const op = (either2: Either<E | E[], V>) =>
    either2.fold(invalid(initialValue), valid as (v: V) => Validation<E, V>);
  return curry1(op, either);
}

export function property<T extends { [key: string]: any }>(
  property: string,
  obj: T
): Validation<string, any>;
export function property<T extends { [key: string]: any }>(
  property: string
): (obj: T) => Validation<string, any>;
export function property<T extends { [key: string]: any }>(
  property: string,
  obj?: T
): Validation<string, any> | ((obj: T) => Validation<string, any>) {
  const op = (obj2: T) =>
    obj2[property] === undefined || obj2[property] === null
      ? invalid(obj2[property], `Property "${property}" not found or null.`)
      : valid(obj2[property]);
  return curry1(op, obj);
}

const objWithPropertyIfNotUndefined = (
  obj: { [key: string]: any },
  key: string
) => (value: any): { [key: string]: any } =>
  value === undefined ? obj : { ...obj, [key]: value };

export const allProperties = <E>(obj: {
  [key: string]: Validation<E, any>;
}): Validation<E, { [key: string]: any }> => {
  return Object.keys(obj).reduce(
    (validation, key) =>
      validation.chain(previousProperties =>
        (obj[key] as any)
          .fold((e: E[], v: any) => invalid(undefined, e), valid)
          .map(objWithPropertyIfNotUndefined(previousProperties, key))
      ) as any,
    valid({})
  );
};

export function validateProperties(validations: {
  [key: string]: (v: any) => Validation<string, any>;
}): (obj: { [key: string]: any }) => { [key: string]: Validation<string, any> };
export function validateProperties(
  validations: { [key: string]: (v: any) => Validation<string, any> },
  obj: { [key: string]: any }
): { [key: string]: Validation<string, any> };
export function validateProperties(
  validations: { [key: string]: (v: any) => Validation<string, any> },
  obj?: { [key: string]: any }
):
  | { [key: string]: Validation<string, any> }
  | ((obj: {
      [key: string]: any;
    }) => { [key: string]: Validation<string, any> }) {
  const op = (obj2: { [key: string]: any }) =>
    Object.keys(validations).reduce(
      (acc: { [key: string]: any }, k: string) => ({
        ...acc,
        [k]: (property(k, obj2).chain as any)(validations[k]),
      }),
      {}
    );
  return curry1(op, obj);
}

export function fromPredicateOr<E, V>(
  errorFn: (v: V) => E,
  predicate: (v: V) => boolean
): (value: V) => Validation<E, V>;
export function fromPredicateOr<E, V>(
  errorFn: (v: V) => E
): (predicate: (v: V) => boolean) => (value: V) => Validation<E, V>;
export function fromPredicateOr<E, V>(
  errorFn: (v: V) => E,
  predicate?: (v: V) => boolean
):
  | ((value: V) => Validation<E, V>)
  | ((predicate: (v: V) => boolean) => (value: V) => Validation<E, V>) {
  const op = (predicate2: (v: V) => boolean) => (v: V) =>
    predicate2(v) ? valid(v) : invalid(v, errorFn(v));
  return curry1(op, predicate);
}

export function errorsOr<T>(
  alt: T
): <E>(validation: Validation<E, any>) => E[] | T;
export function errorsOr<E, T>(alt: T, validation: Validation<E, any>): E[] | T;
export function errorsOr<E, T>(
  alt: T,
  validation?: Validation<E, any>
): E[] | T | ((validation: Validation<E, any>) => E[] | T) {
  const op = (v: Validation<E, any>) =>
    v.isValid() ? alt : (v as Invalid<E, any>).errors;
  return curry1(op, validation);
}

export function empty<E, B>(): Validation<E, B[]> {
  return valid([]);
}

export function concat<E, A>(
  listVal: Validation<E, A[]>
): (val: Validation<E, A[]>) => Validation<E, A[]>;
export function concat<E, A>(
  listVal: Validation<E, A[]>,
  val: Validation<E, A[]>
): Validation<E, A[]>;
export function concat<E, A>(
  listVal: Validation<E, A[]>,
  val?: Validation<E, A[]>
): Validation<E, A[]> | ((val: Validation<E, A[]>) => Validation<E, A[]>) {
  const op = (val2: Validation<E, A[]>) =>
    (listVal.concatErr as any)(val2).map(
      val2.isValid()
        ? (a: A[]) => [...listVal.value, ...a]
        : () => listVal.value
    );
  return curry1(op, val);
}

export const sequence = <E, A>(
  validations: Validation<E, A>[]
): Validation<E, A[]> =>
  validations.reduce((acc, b) => b.concat(acc), empty() as Validation<E, A[]>);

export function concatErr<E, B>(
  valB: Validation<E, B>
): (valA: Validation<E, any>) => Validation<E, B>;
export function concatErr<E, B>(
  valB: Validation<E, B>,
  valA: Validation<E, any>
): Validation<E, B>;
export function concatErr<E, B>(
  valB: Validation<E, B>,
  valA?: Validation<E, any>
): Validation<E, B> | ((valA: Validation<E, any>) => Validation<E, B>) {
  const op = (v: Validation<E, any>) => {
    const shouldBeValid = valB.isValid() && v.isValid();
    return shouldBeValid
      ? valB
      : invalid(valB.value, [...v.errorsOr([]), ...valB.errorsOr([])] as E[]);
  };
  return curry1(op, valA);
}

export function map<A, B>(
  fn: (a: A) => B
): <E>(validation: Validation<E, A>) => Validation<E, B>;
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

export function mapErrors<E, E2, V>(
  m: (errors: E[]) => E2 | E2[],
  v: Validation<E, V>
): Validation<E2, V>;
export function mapErrors<E, E2, V>(
  m: (errors: E[]) => E2 | E2[]
): (v: Validation<E, V>) => Validation<E2, V>;
export function mapErrors<E, E2, V>(
  mappingFn: (errors: E[]) => E2 | E2[],
  validation?: Validation<E, V>
): Validation<E2, V> | ((v: Validation<E, V>) => Validation<E2, V>) {
  const op = (validation2: Validation<E, V>) =>
    validation2.isValid()
      ? validation2
      : invalid(validation2.value, mappingFn(validation2.errorsOr([])));
  return curry1(op, validation);
}

export function mapError<E, E2, V>(
  m: (error: E) => E2,
  v: Validation<E, V>
): Validation<E2, V>;
export function mapError<E, E2, V>(
  m: (error: E) => E2
): (v: Validation<E, V>) => Validation<E2, V>;
export function mapError<E, E2, V>(
  mappingFn: (error: E) => E2,
  validation?: Validation<E, V>
): Validation<E2, V> | ((v: Validation<E, V>) => Validation<E2, V>) {
  const op = (validation2: Validation<E, V>) =>
    mapErrors(errors => errors.map(mappingFn), validation2);
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
    return concatErr(newValidation, v);
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
    return concatErr(newVal, validation);
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
  fromEither,
  property,
  allProperties,
  validateProperties,
  fromPredicateOr,
  errorsOr,
  empty,
  concat,
  sequence,
  concatErr,
  map,
  mapErrors,
  mapError,
  ap,
  chain,
  fold,
  validateEither,
  validateEitherList,
  validate,
  validateAll,
};

export default Validation;
