import { ValidationShape, Variant } from './ValidationShape';
import Validation, {
  empty,
  concat,
  map,
  concatErr,
  mapErrors,
  mapError,
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
import { Invalid } from './Invalid';

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

  empty<B>(): Validation<E, B[]> {
    return empty();
  }

  concat(val: Validation<E, V[]>): Validation<E, V[]> {
    return concat(val, map(arrayOrItemToArray, this));
  }

  concatErr<B>(val: Validation<E, B>): Validation<E, B> {
    return concatErr(val, this);
  }

  map<B>(fn: (a: V) => B): Validation<E, B> {
    return map(fn, this as Validation<E, V>);
  }

  mapErrors<B>(fn: (e: E[]) => B | B[]): Validation<B, V> {
    return mapErrors(fn, this);
  }

  mapError<B>(fn: (e: E) => B): Validation<B, V> {
    return mapError(fn, this);
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
