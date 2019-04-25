# validation
Validation is a [Static Land](https://github.com/rpominov/static-land) compatible monad and ADT (Algebraic Data Type) designed to store immutable validation results while not losing any validation errors nor the validated value.

Its power shines when using atomic validator functions that return Either an error or the value (modified or not).

It implements the algebras Monad (map, ap, of, chain) and Semigroup (concat).

## Type

A Validation can be only one of these:

- A `Valid<T>` value of type T, or
- An `Invalid<E, T>` value of type T with a non empty errors array of type E[].

A value and an error can be whatever type you want: strings, booleans, and even objects. All the errors in the array must have the same type though.

## Example

```javascript
import Validation from 'validation'

const trim = str => Either.right(str.trim())
const isNotEmpty = str => str.length > 0 ? Either.right(str) : Either.left('Can`t be empty')
const hasNumbers = str => /[0-9]/.test(str) ? Either.right(str) : Either.left('Must have numbers')

const validators = [trim, isNotEmpty, hasNumbers]

Validation.of('123456').validateAll(validators) // => Valid('123456')
Validation.of('123456 ').validateAll(validators) // => Valid('123456')
Validation.of('wrong zipcode').validateAll(validators) // => Invalid(['Must have numbers'], 'wrong zipcode')
Validation.of('   ').validateAll(validators) // => Invalid(['Can`t be empty', 'Must have numbers'], '')
```

## API

### Constructors

#### - `new Valid(value: T): Valid<T>`
Returns a Valid type.

```javascript
import {Valid} from 'validation'

const v = new Valid(42)
```

#### - `valid<T>(value: T): Valid<T>`
Returns a Valid type.

```javascript
import {valid} from 'validation'

const v = valid(42)
```

#### - `new Invalid(value: T, errors: E[]): Invalid<E, T>`
Returns an Invalid type. Throws if errors is an empty array.

```javascript
import {Invalid} from 'validation'

const i = new Invalid('', ['Empty value'])
```

#### - `invalid(value: T, errors: E[]): Invalid<E, T>`
Returns an Invalid type. Throws if errors is an empty array.

```javascript
import {invalid} from 'validation'

const i = invalid('', ['Empty value'])
```

#### - `of(value: T, errors?: E[]): Validation<E, T>`
If errors is empty or a nil value, returns a Valid type, otherwise returns an Invalid type with the errors.

```javascript
import {of} from 'validation'

const valid = of(42, [])
const invalid = of('', ['Empty value'])
```

### Other methods

All these functions are available both as methods of Valid and Invalid types and also as functions.

Example:

```javascript
import {valid, map} from 'validation'

// These are the same
valid(42).map(x => x + 1)
map(x => x + 1, valid(42))
```

**The types `Valid<T>` and `Invalid<T, E>` are assumed as the `this` in the following definitions.**

#### - `isValid(): boolean`
Returns true only if validation is Valid.

```javascript
valid('username').isValid() // => true
invalid('', ['Empty value']).isValid() // => false
```

#### - `isInvalid(): boolean`
Returns true only if validation is Invalid.

```javascript
valid('username').isInvalid() // => false
invalid('', ['Empty value']).isInvalid() // => true
```

#### - `value: T`
Returns the value wrapped in the type. Both Valid and Invalid store the value always, so it can be read safely.

```javascript
valid('username').value // => 'username'
invalid('', ['Empty value']).value // => ''
```

#### - `errorsOr(alt: T): E[] | T`
Returns the errors if validation is Invalid, alt otherwise.

```javascript
valid('username').errorsOr([]) // => []
invalid('', ['Empty value']).errorsOr([]) // => ['Empty value']
```

#### - `concat(v: Validation<E, U>): Validation<E, U>`
Returns a validation result of concatenating the errors of both validations, and keeps the value of the second validation (`v`).
Therefore, if both validations are valid, it returns `v`.

Note that the order of parameters is reversed from the other functions, to make it natural with the concatenation order.

```javascript
import {concat} from 'validation'

valid('discarded value').concat(valid('new value')) // => Valid('new value')
invalid('...', ['hello']).concat(invalid('test', ['world'])) // => Invalid('test', ['hello', 'world'])

// Unlike the other functions, the validation subject comes first, so the order feels natural
concat(invalid('...', ['hello']), invalid('test', ['world'])) // => Invalid('test', ['hello', 'world'])
```

#### - `map(fn: T => U): Validation<E, U>`
Applies a function to the value and returns a new validation equally valid or invalid (with the same errors).

```javascript
valid(42).map(x => x + 1) // => Valid(43)
invalid(42, ['error']).map(x => x + 1) // => Invalid(43, ['error'])
```

#### - `ap(val: Validation<E, (t: T) => U>): Validation<E, U>`
When passed a validation that contains a function as a value, applies that function to its value and returns a new validation with the concatenated errors of both.

```javascript
invalid(42, ['error']).ap(valid(x => x + 1)) // => Invalid(43, ['error'])
invalid('test', ['hello']).ap(invalid(s => s.length, ['world'])) // => Invalid(4, ['hello', 'world'])
```

#### - `chain(fn: (t: T) => Validation<E, U>): Validation<E, U>`
Applies a validation returning function to the value and returns a new validation with the concatenated errors of both this validation and the returned one, as well as the returned validation's value.

```javascript
valid('test').chain(str => invalid(str.length, ['error'])) // => Invalid(4, ['error'])
invalid('', ['Has no numbers']).chain(
    str => str.length === 0 ? invalid(str, ['Empty value']) : valid(str)
) // => Invalid('', ['Has no numbers', 'Empty value'])
```

#### - `fold(fnValid: (t: T) => U, fnInvalid: (t: T, e: E[]) => U): U`
If it is a Valid value, returns the result of applying fnValid to its value.
If it is an Invalid value, returns the result of applying fnInvalid to its value and errors.

```javascript
invalid('test', ['contain-numbers']).fold(
    v => `Value ${v} is OK!`,
    (v, e) => `Value "${v}" has failed these validations: ${e}`
) // => 'Value "test" has failed these validations: ["contain-numbers"]'
```

## Either adapters

**Note:** You can use any type as Either here, as long as it has a function with the following signature:
```javascript
type Either<T, U> = {
    fold: <A>(this: Either<T, U>, left: (t: T) => A, right: (u: U) => A) => A
}
```

#### - `validateEither(either: Either<E[], T>): Validation<E, T>`
If the either is a Left, concatenates the errors to their own.
If the either is a Right, modifies the value.

```javascript
valid(42).validateEither(Right(42)) // => Valid(42)
valid('').validateEither(Left(['Empty value'])) // => Invalid('', ['Empty value'])
```

#### - `validateEitherList(eitherList: Either<E[], T>[]): Validation<E, T>`
Concatenates the errors of all the Left eithers in the list and keeps the value of the last Right either, or the validation value if none.

```javascript
valid('wrong zipcode').validateEitherList([
    Left(['Must have numbers']),
    Right(''),
]) // => Invalid('', ['Must have numbers'])
```

#### - `validate(validator: (t: T) => Either<E[], T>): Validation<E, T>`
Validates the value against the validator. If it returns a Right (passes), the new value is kept. If it returns a Left (fails), the errors are concatenated.

```javascript
const isNotEmpty = str => str.length > 0 ? Either.right(str) : Either.left('Can`t be empty')
const hasNumbers = str => /[0-9]/.test(str) ? Either.right(str) : Either.left('Must have numbers')

valid('wrong zipcode').validate(isNotEmpty) // => Valid('wrong zipcode')
valid('wrong zipcode').validate(hasNumbers) // => Invalid('wrong zipcode', ['Must have numbers'])
```

#### - `validateAll(validators: ((t: T) => Either<E[], T>)[]): Validation<E, T>`
Concatenates the errors returned by all failing validators (returning Left) and keeps the value of the last passing validator (returning Right), or the validation value if none.

```javascript
const trim = str => Either.right(str.trim())
const isNotEmpty = str => str.length > 0 ? Either.right(str) : Either.left('Can`t be empty')
const hasNumbers = str => /[0-9]/.test(str) ? Either.right(str) : Either.left('Must have numbers')

const validators = [trim, isNotEmpty, hasNumbers]

Validation.of('123456').validateAll(validators) // => Valid('123456')
Validation.of('123456 ').validateAll(validators) // => Valid('123456')
Validation.of('wrong zipcode').validateAll(validators) // => Invalid(['Must have numbers'], 'wrong zipcode')
Validation.of('   ').validateAll(validators) // => Invalid(['Can`t be empty', 'Must have numbers'], '')
```
