# validation
Validation is a [Static Land](https://github.com/rpominov/static-land) compatible monad and ADT (Algebraic Data Type) designed to store immutable validation results while not losing any validation errors nor the validated value.

Its power shines when using atomic validator functions that return Either an error or the value (modified or not).

It implements the algebras Monad (map, ap, of, chain) and Semigroup (concat).

## Type

A Validation can be only one of these:

- A Valid value, or
- An Invalid value with a non empty errors array.

A value and an error can be whatever type you want: strings, booleans, and even objects. All the errors in the array must have the same type though.

## Example

```javascript
import Validation from 'validation'

const trim = str => Either.right(str.trim())
const isNotEmpty = str => str.length > 0 ? Either.right(str) : Either.left('Can`t be empty')
const hasNumbers = str => /[0-9]/.test(str) ? Either.right(str) : Either.left('Must have numbers')

Validation.of('123456').validateAll([isNotEmpty, hasNumbers]) // => Valid('123456')
Validation.of('123456 ').validateAll([trim, isNotEmpty, hasNumbers]) // => Valid('123456')
Validation.of('wrong zipcode').validateAll([isNotEmpty, hasNumbers]) // => Invalid(['Must have numbers'], 'wrong zipcode')
Validation.of('   ').validateAll([trim, isNotEmpty, hasNumbers]) // => Invalid(['Can`t be empty', 'Must have numbers'], '')
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

const v = new Invalid('', ['Empty value'])
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