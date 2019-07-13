import { Validation, Either } from './index';
import { Valid } from 'Valid';
import { Invalid } from 'Invalid';

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

  empty: <B>(this: Validation<E, A | B[]>) => Validation<E, B[]>;
  concat: (
    this: Validation<E, A>,
    val: Validation<E, A[]>
  ) => Validation<E, A[]>;
  concatErr: <B>(
    this: Validation<E, A>,
    val: Validation<E, B>
  ) => Validation<E, B>;
  map: <B>(this: Validation<E, A>, fn: (a: A) => B) => Validation<E, B>;
  mapErrors: <B>(
    this: Validation<E, A>,
    fn: (e: E[]) => B | B[]
  ) => Validation<B, A>;
  mapError: <B>(this: Validation<E, A>, fn: (e: E) => B) => Validation<B, A>;
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
