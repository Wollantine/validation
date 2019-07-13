import { ValidationShape, Variant } from './ValidationShape';
import Validation, {
  empty,
  concat,
  map,
  concatErr,
  mapErrors,
  mapError,
  errorsOr,
  ap,
  chain,
  fold,
  Either,
  validateEither,
  validateEitherList,
  validate,
  validateAll,
} from './index';
import { arrayOrItemToArray } from './utils';
import { Valid } from './Valid';

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

  empty<B>(): Validation<E, B[]> {
    return empty();
  }

  concat(val: Validation<E, V[]>): Validation<E, V[]> {
    return concat(val, map(arrayOrItemToArray, this));
  }

  concatErr<B>(val: Validation<E, B>): Validation<E, B> {
    return concatErr(val, this);
  }

  map<B>(fn: (a: V) => B): Invalid<E, B> {
    return map(fn, this) as Invalid<E, B>;
  }

  mapErrors<B>(fn: (e: E[]) => B | B[]): Validation<B, V> {
    return mapErrors(fn, this);
  }

  mapError<B>(fn: (e: E) => B): Validation<B, V> {
    return mapError(fn, this);
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
