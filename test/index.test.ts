import Validation, {
  valid,
  invalid,
  errorsOr,
  concatErr,
  map,
  of,
  isValid,
  isInvalid,
  fromEither,
  allProperties,
  property,
  fromPredicateOr,
  validateProperties,
  empty,
  concat,
  sequence,
} from '../src/index';

const Left = (x: any) => ({
  fold: (leftFn: Function, rightFn: Function) => leftFn(x),
});
const Right = (x: any) => ({
  fold: (leftFn: Function, rightFn: Function) => rightFn(x),
});

describe('Readme examples', () => {
  it('should behave the same with methods and functions', () => {
    const a = Validation.valid(42).map(x => x + 1);
    const b = Validation.map((x: number) => x + 1, Validation.valid(42));
    expect(a).toEqual(b);
  });
});

describe('invalid', () => {
  it('should throw when trying to create an Invalid with no errors', () => {
    const actual = () => invalid(10, []);
    expect(actual).toThrow();
  });

  it('should accept non-array errors as a single element errors array', () => {
    const actual = invalid(10, 'error');
    expect(actual).toEqual(invalid(10, ['error']));
  });

  it('should be curried', () => {
    const actual = invalid(10);
    expect(actual('error')).toEqual(invalid(10, ['error']));
  });
});

describe('of', () => {
  it('should wrap the value in a Valid when it is not a Validation', () => {
    expect(of(10)).toEqual(valid(10));
  });

  it('should wrap the value in an Invalid when errors are supplied', () => {
    expect(of(10, ['hi'])).toEqual(invalid(10, ['hi']));
  });

  it('should not wrap the value in a Validation when the value is already a Valid', () => {
    const validation = valid(10);
    expect(of(validation)).toEqual(validation);
  });

  it('should not wrap the value in a Validation when the value is already an Invalid', () => {
    const validation = invalid(10, ['hi']);
    expect(of(validation)).toEqual(validation);
  });

  it('should return a valid when passing an empty array of errors', () => {
    expect(of(10, [])).toEqual(valid(10));
  });
});

describe('fromEither', () => {
  it('should create a Valid from a Right and ignore the initialValue', () => {
    const actual = fromEither(3, Right(10));
    expect(actual).toEqual(valid(10));
  });

  it('should create an Invalid from a Left using the initialValue', () => {
    const actual = fromEither(3, Left(['errorMessage']));
    expect(actual).toEqual(invalid(3, ['errorMessage']));
  });

  it('should create an Invalid wrapping the Left in an array', () => {
    const actual = fromEither(3, Left('errorMessage'));
    expect(actual).toEqual(invalid(3, ['errorMessage']));
  });

  it('should be curried', () => {
    const actual = fromEither(3)(Left('errorMessage'));
    expect(actual).toEqual(invalid(3, ['errorMessage']));
  });
});

describe('property', () => {
  it('should return a Valid with the value of the property if it was present', () => {
    const obj = { propName: 10 };
    const actual = property('propName', obj);
    expect(actual).toEqual(valid(10));
  });

  it('should return an Invalid with undefined and an explanatory message if the property was not present', () => {
    const obj = { propName: 10 };
    const actual = property('x', obj);
    expect(actual).toEqual(
      invalid(undefined, ['Property "x" not found or null.'])
    );
  });

  it('should return an Invalid with null and an explanatory message if the property was null', () => {
    const obj = { propName: null };
    const actual = property('propName', obj);
    expect(actual).toEqual(
      invalid(null, ['Property "propName" not found or null.'])
    );
  });

  it('should return an Invalid with undefined and an explanatory message if the property was undefined', () => {
    const obj = { propName: undefined };
    const actual = property('propName', obj);
    expect(actual).toEqual(
      invalid(undefined, ['Property "propName" not found or null.'])
    );
  });

  it('should be curried', () => {
    const obj = { propName: 10 };
    const actual = property('propName')(obj);
    expect(actual).toEqual(valid(10));
  });
});

describe('allProperties', () => {
  it('should map an object of Valids into a Valid of object', () => {
    const obj = {
      a: valid(10),
      b: valid('hi'),
    };
    const expected = valid({ a: 10, b: 'hi' });
    expect(allProperties(obj)).toEqual(expected);
  });

  it('should map an object of Invalids into an Invalid of object keeping the errors', () => {
    const obj = {
      a: invalid(10, 'error1'),
      b: invalid('hi', 'error2'),
    };
    const expected = invalid({}, ['error1', 'error2']);
    expect(allProperties(obj)).toEqual(expected);
  });

  it('should omit undefined values in invalid properties, but keep the errors', () => {
    const obj = {
      a: invalid(undefined, 'error1'),
      b: valid('hi'),
    };
    const expected = invalid({ b: 'hi' }, ['error1']);
    expect(allProperties(obj)).toEqual(expected);
  });

  it('should omit values in invalid properties, but keep the errors', () => {
    const obj = {
      a: invalid(10, 'error1'),
      b: valid('hi'),
    };
    const expected = invalid({ b: 'hi' }, ['error1']);
    expect(allProperties(obj)).toEqual(expected);
  });

  it('should keep undefined values in valid properties', () => {
    const obj = {
      a: invalid(undefined, 'error1'),
      b: valid(undefined),
    };
    const expected = invalid({ b: undefined }, ['error1']);
    expect(allProperties(obj)).toEqual(expected);
  });
});

describe('fromPredicateOr', () => {
  it('should return a Valid when the predicate evaluates to true', () => {
    const isEven = (x: number) => x % 2 === 0;
    const validateEven = fromPredicateOr(() => 'Must be even', isEven);
    expect(validateEven(2)).toEqual(valid(2));
  });

  it('should return an Invalid with the error when the predicate evaluates to false', () => {
    const isEven = (x: number) => x % 2 === 0;
    const validateEven = fromPredicateOr(() => 'Must be even', isEven);
    expect(validateEven(3)).toEqual(invalid(3, ['Must be even']));
  });

  it('should call errorFn with the value', () => {
    const isEven = (x: number) => x % 2 === 0;
    const validateEven = fromPredicateOr(v => `${v} is not even.`, isEven);
    expect(validateEven(3)).toEqual(invalid(3, ['3 is not even.']));
  });

  it('should be curried', () => {
    const isEven = (x: number) => x % 2 === 0;
    const validateEven = fromPredicateOr<string, number>(
      v => `${v} is not even.`
    )(isEven);
    expect(validateEven(3)).toEqual(invalid(3, ['3 is not even.']));
  });
});

describe('validateProperties', () => {
  it('should validate the presence of the properties using Validation.property', () => {
    const obj = {
      a: 10,
      b: 'hi',
    };
    const actual = validateProperties({ a: valid, b: valid, c: valid }, obj);
    const expected = {
      a: valid(10),
      b: valid('hi'),
      c: invalid(undefined, 'Property "c" not found or null.'),
    };
    expect(actual).toEqual(expected);
  });

  it('should chain the passed validations', () => {
    const obj = {
      a: 10,
      b: 'hi',
    };
    const actual = validateProperties(
      {
        a: fromPredicateOr(() => 'Must be below 10', v => v <= 10),
        b: value => invalid(value, 'Must not have b'),
        c: valid,
      },
      obj
    );
    const expected = {
      a: valid(10),
      b: invalid('hi', ['Must not have b']),
      c: invalid(undefined, ['Property "c" not found or null.']),
    };
    expect(actual).toEqual(expected);
  });

  it('should be curried', () => {
    const actual = validateProperties({ a: valid })({ a: 10 });
    expect(actual).toEqual({ a: valid(10) });
  });
});

describe('isValid', () => {
  it('should be true for Valid', () => {
    const actual = valid('username').isValid();
    expect(actual).toBe(true);
  });

  it('should be false for Invalid', () => {
    const actual = invalid('', ['Empty value']).isValid();
    expect(actual).toBe(false);
  });

  it('should be true when called as a method with a Valid', () => {
    const actual = isValid(valid(10));
    expect(actual).toBe(true);
  });

  it('should be false when called as a method with an Invalid', () => {
    const actual = isValid(invalid('hi', ['error']));
    expect(actual).toBe(false);
  });
});

describe('isInvalid', () => {
  it('should be false for Valid', () => {
    const actual = valid('username').isInvalid();
    expect(actual).toBe(false);
  });

  it('should be true for Invalid', () => {
    const actual = invalid('', ['Empty value']).isInvalid();
    expect(actual).toBe(true);
  });

  it('should be false when called as a method with a Valid', () => {
    const actual = isInvalid(valid('test'));
    expect(actual).toBe(false);
  });

  it('should be true when called as a method with an Invalid', () => {
    const actual = isInvalid(invalid('test', ['error']));
    expect(actual).toBe(true);
  });
});

describe('value', () => {
  it('should be available in Valid', () => {
    const actual = valid('test').value;
    expect(actual).toBe('test');
  });

  it('should be available in Invalid', () => {
    const actual = invalid('', ['Empty value']).value;
    expect(actual).toBe('');
  });
});

describe('errorsOr', () => {
  it('should be alt for a Valid', () => {
    const actual = valid('username').errorsOr([]);
    expect(actual).toEqual([]);
  });

  it('should be errors for Invalid', () => {
    const actual = invalid('', ['Empty value']).errorsOr([]);
    expect(actual).toEqual(['Empty value']);
  });

  it('should curry with a Valid', () => {
    const errorsOrEmptyArray = errorsOr([]);
    expect(errorsOrEmptyArray(valid(10))).toEqual([]);
  });

  it('should curry with an Invalid', () => {
    const errorsOrEmptyArray = errorsOr([]);
    expect(errorsOrEmptyArray(invalid(10, ['test']))).toEqual(['test']);
  });
});

describe('empty', () => {
  it('should return valid([])', () => {
    expect(empty()).toEqual(valid([]));
  });

  it('should empty an existing Valid (immutably)', () => {
    const v = valid(10);
    expect(v.empty()).toEqual(valid([]));
    expect(v).toEqual(valid(10));
  });

  it('should empty an existing Invalid (immutably)', () => {
    const v = invalid(10, 'hi');
    expect(v.empty()).toEqual(valid([]));
    expect(v).toEqual(invalid(10, 'hi'));
  });
});

describe('concat', () => {
  it('should append a valid value to an array', () => {
    const actual = concat(valid([1, 2]), valid([3]));
    expect(actual).toEqual(valid([1, 2, 3]));
  });

  it('should concat an array of arrays to another array of arrays', () => {
    const actual = concat(valid([[1]]), valid([[2]]));
    expect(actual).toEqual(valid([[1], [2]]));
  });

  it('should concat only the errors of an invalid', () => {
    const actual = concat(valid([2]), invalid([3], ['error']));
    expect(actual).toEqual(invalid([2], ['error']));
  });

  it('should preserve the errors of an invalid when concatenating a valid', () => {
    const actual = concat(invalid([2], ['error1']), valid([3]));
    expect(actual).toEqual(invalid([2, 3], ['error1']));
  });

  it('should preserve the errors of an invalid when concatenating an invalid', () => {
    const actual = concat(invalid([2], ['error1']), invalid([3], ['error2']));
    expect(actual).toEqual(invalid([2], ['error1', 'error2']));
  });

  it('should be an identity function when concatenating empty to a valid', () => {
    const validation = valid([10]);
    const actual = concat(validation, empty() as any);
    expect(actual).toEqual(validation);
  });

  it('should be an identity function when concatenating a valid to empty', () => {
    const validation = valid([10]);
    const actual = concat(empty(), validation);
    expect(actual).toEqual(validation);
  });

  it('should have the correct parameter order when using it as a method', () => {
    const validation = valid(2);
    const actual = validation.concat(valid([1]));
    expect(actual).toEqual(valid([1, 2]));
  });

  it('should cast a non-array value to array when called as a method', () => {
    const actual = valid(2).concat(valid([1]));
    expect(actual).toEqual(valid([1, 2]));
  });

  it('should concatenate only the errors when used as a method on an Invalid', () => {
    const validation = invalid(3, 'error');
    const actual = validation.concat(valid([1]));
    expect(actual).toEqual(invalid([1], ['error']));
  });
});

describe('sequence', () => {
  it('should return a Valid from an empty sequence', () => {
    expect(sequence([])).toEqual(valid([]));
  });

  it('should return a Valid of an array from an array of Valids', () => {
    const actual = sequence([valid(1), valid(2), valid(3)]);
    expect(actual).toEqual(valid([1, 2, 3]));
  });

  it('should return an Invalid of the valid values and the errors from a mixed array', () => {
    const actual = sequence([
      valid(10),
      invalid(-5, ['Too low']),
      invalid(12, ['Too high']),
      valid(8),
    ]);
    expect(actual).toEqual(invalid([10, 8], ['Too low', 'Too high']));
  });

  it('should return an Invalid of an empty array and all the errors from an array of Invalids', () => {
    const actual = sequence([
      invalid(1, 'error1'),
      invalid(2, 'error2'),
      invalid(3, 'error3'),
    ]);
    expect(actual).toEqual(invalid([], ['error1', 'error2', 'error3']));
  });
});

describe('concatErr', () => {
  it('should change the value', () => {
    const actual = valid('discarded value').concatErr(valid('new value'));
    expect(actual).toEqual(valid('new value'));
  });

  it('should concatenate errors', () => {
    const actual = invalid('...', ['hello']).concatErr(
      invalid('test', ['world'])
    );
    expect(actual).toEqual(invalid('test', ['hello', 'world']));
  });

  it('should work with (valid, invalid)', () => {
    const actual = valid(23).concatErr(invalid('test', ['world']));
    expect(actual).toEqual(invalid('test', ['world']));
  });

  it('should work with (invalid, valid)', () => {
    const actual = invalid('test', ['world']).concatErr(valid(23));
    expect(actual).toEqual(invalid(23, ['world']));
  });

  it('should have the correct order in the function style', () => {
    const actual = concatErr(
      invalid('test', ['world']),
      invalid('...', ['hello'])
    );
    expect(actual).toEqual(invalid('test', ['hello', 'world']));
  });

  it('should curry in the right order', () => {
    const concatWorld = concatErr(invalid(10, ['world']));
    expect(concatWorld(invalid(12, ['hello']))).toEqual(
      invalid(10, ['hello', 'world'])
    );
  });
});

describe('map', () => {
  it('should modify the value of a Valid', () => {
    const actual = valid(42).map(x => x + 1);
    expect(actual).toEqual(valid(43));
  });

  it('should modify the value of an Invalid', () => {
    const actual = invalid(42, ['error']).map(x => x + 1);
    expect(actual).toEqual(invalid(43, ['error']));
  });

  it('should curry with Valid', () => {
    const mapToLength = map((x: string) => x.length);
    expect(mapToLength(valid('test'))).toEqual(valid(4));
  });

  it('should curry with Invalid', () => {
    const mapToLength = map((x: string) => x.length);
    expect(mapToLength(invalid('test', ['hi']))).toEqual(invalid(4, ['hi']));
  });
});

describe('mapErrors', () => {
  it('should be an identity function on a Valid type', () => {
    const v = valid(10);
    const actual = v.mapErrors(errors => ['error']);
    expect(actual).toEqual(v);
  });

  it('should map all errors in an Invalid type with mappingFn', () => {
    const inv = invalid(3, ['Invalid address', 'Missing number']);
    const actual = inv.mapErrors(e => e[0]);
    const expected = invalid(3, ['Invalid address']);
    expect(actual).toEqual(expected);
  });

  it('should cast result to an array', () => {
    const actual = invalid(3, ['error']).mapErrors(() => 'error2');
    expect(actual).toEqual(invalid(3, ['error2']));
  });

  it('should throw when mapping to an empty array', () => {
    const actual = () => invalid(3, ['error']).mapErrors(() => []);
    expect(actual).toThrow();
  });
});

describe('mapError', () => {
  it('should be an identity function on a Valid type', () => {
    const v = valid(10);
    const actual = v.mapError(e => 'Error: ' + e);
    expect(actual).toEqual(v);
  });

  it('should map each error in an Invalid type with mappingFn', () => {
    const inv = invalid(3, ['Invalid address', 'Missing number']);
    const actual = inv.mapError(e => 'Error: ' + e);
    const expected = invalid(3, [
      'Error: Invalid address',
      'Error: Missing number',
    ]);
    expect(actual).toEqual(expected);
  });
});

describe('ap', () => {
  it('should apply a valid to a valid', () => {
    const actual = valid(4).ap(valid(x => x + 1));
    expect(actual).toEqual(valid(5));
  });
  it('should apply a valid to an invalid', () => {
    const actual = invalid(42, ['error']).ap(valid(x => x + 1));
    expect(actual).toEqual(invalid(43, ['error']));
  });
  it('should apply an invalid to a valid', () => {
    const actual = valid('test').ap(invalid(s => s.length, ['hello']));
    expect(actual).toEqual(invalid(4, ['hello']));
  });
  it('should apply an invalid to an invalid', () => {
    const actual = invalid('test', ['hello']).ap(
      invalid(s => s.length, ['world'])
    );
    expect(actual).toEqual(invalid(4, ['hello', 'world']));
  });
});

describe('chain', () => {
  it('should return the result of the function', () => {
    const actual = valid('test').chain(str => invalid(str.length, ['error']));
    expect(actual).toEqual(invalid(4, ['error']));
  });

  it('should concatenate errors to the invalid result', () => {
    const actual = invalid('', ['Has no numbers']).chain(str =>
      str.length === 0 ? invalid(str, ['Empty value']) : valid(str)
    );
    expect(actual).toEqual(invalid('', ['Has no numbers', 'Empty value']));
  });

  it('should keep the errors when chaining a valid to an invalid', () => {
    const actual = invalid('hi', ['Has no numbers']).chain(str =>
      str.length === 0 ? invalid(str, ['Empty value']) : valid(str)
    );
    expect(actual).toEqual(invalid('hi', ['Has no numbers']));
  });
});

describe('fold', () => {
  it('should return the result of fnValid if it is Valid', () => {
    const actual = valid('test').fold(
      (e, v) => `Value "${v}" has failed these validations: ${e}`,
      v => `Value "${v}" is OK!`
    );
    expect(actual).toEqual('Value "test" is OK!');
  });

  it('should return the result of fnInvalid if it is Invalid', () => {
    const actual = invalid('test', ['contain-numbers']).fold(
      (e, v) => `Value "${v}" has failed these validations: ${e}`,
      v => `Value "${v}" is OK!`
    );
    expect(actual).toEqual(
      'Value "test" has failed these validations: contain-numbers'
    );
  });
});

describe('validateEither', () => {
  it('should concatenate errors of Either.Left to a Valid', () => {
    const actual = valid('').validateEither(Left(['Empty value']));
    expect(actual).toEqual(invalid('', ['Empty value']));
  });

  it('should concatenate errors of Either.Left to an Invalid', () => {
    const actual = invalid('', ['error']).validateEither(Left(['Empty value']));
    expect(actual).toEqual(invalid('', ['error', 'Empty value']));
  });

  it('should keep the value of Either.Right in a Valid', () => {
    const actual = valid(42).validateEither(Right(10));
    expect(actual).toEqual(valid(10));
  });

  it('should keep the value of Either.Right in an Invalid', () => {
    const actual = invalid(42, ['error']).validateEither(Right(10));
    expect(actual).toEqual(invalid(10, ['error']));
  });
});

describe('validateEitherList', () => {
  it('should keep a Valid when concatenating an empty list', () => {
    const validation = valid(10);
    const actual = validation.validateEitherList([]);
    expect(actual).toEqual(validation);
  });

  it('should keep an Invalid when concatenating an empty list', () => {
    const validation = invalid(10, ['Must have letters']);
    const actual = validation.validateEitherList([]);
    expect(actual).toEqual(validation);
  });

  it('should concatenate errors of all the Either.Left to a Valid', () => {
    const actual = valid('wrong zipcode').validateEitherList([
      Left(['Must be one word']),
      Right(''),
      Left(['Must have numbers']),
    ]);
    expect(actual.errorsOr([])).toEqual([
      'Must be one word',
      'Must have numbers',
    ]);
  });

  it('should concatenate errors of all the Either.Left to an Invalid', () => {
    const actual = invalid('wrong zipcode', [
      'Must have numbers',
    ]).validateEitherList([Left(['Must be one word']), Right('')]);
    expect(actual.errorsOr([])).toEqual([
      'Must have numbers',
      'Must be one word',
    ]);
  });

  it('should keep the value of the last Either.Right in a Valid', () => {
    const actual = valid('wrong zipcode').validateEitherList([
      Left(['Must be one word']),
      Right(''),
      Left(['Must have numbers']),
      Right('10'),
    ]);
    expect(actual.value).toBe('10');
  });

  it('should keep the value of the last Either.Right in an Invalid', () => {
    const actual = invalid('wrong zipcode', [
      'Must have numbers',
    ]).validateEitherList([Left(['Must be one word']), Right(''), Right('10')]);
    expect(actual.value).toBe('10');
  });

  it('should work with the example', () => {
    const actual = valid('wrong zipcode').validateEitherList([
      Left(['Must have numbers']),
      Right(''),
    ]);
    expect(actual).toEqual(invalid('', ['Must have numbers']));
  });
});

describe('validate', () => {
  const isNotEmpty = (str: string) =>
    str.length > 0 ? Right(str) : Left('Can`t be empty');
  const hasNumbers = (str: string) =>
    /[0-9]/.test(str) ? Right(str) : Left('Must have numbers');

  it('should validate a Valid with a Right validator as a Valid', () => {
    const actual = valid('wrong zipcode').validate(isNotEmpty);
    expect(actual).toEqual(valid('wrong zipcode'));
  });

  it('should validate a Valid with a Left validator as an Invalid', () => {
    const actual = valid('wrong zipcode').validate(hasNumbers);
    expect(actual).toEqual(invalid('wrong zipcode', ['Must have numbers']));
  });

  it('should validate an Invalid with a Right validator as an Invalid', () => {
    const actual = invalid('wrong zipcode', ['Must have numbers']).validate(
      isNotEmpty
    );
    expect(actual).toEqual(invalid('wrong zipcode', ['Must have numbers']));
  });

  it('should validate an Invalid with a Left validator as an Invalid', () => {
    const actual = invalid('', ['Can`t be empty']).validate(hasNumbers);
    expect(actual).toEqual(
      invalid('', ['Can`t be empty', 'Must have numbers'])
    );
  });
});

describe('validateAll', () => {
  const trim = (str: string) => Right(str.trim());
  const isNotEmpty = (str: string) =>
    str.length > 0 ? Right(str) : Left('Can`t be empty');
  const hasNumbers = (str: string) =>
    /[0-9]/.test(str) ? Right(str) : Left('Must have numbers');

  it('should keep a valid when validating an empty list', () => {
    const actual = valid('10').validateAll([]);
    expect(actual).toEqual(valid('10'));
  });

  it('should keep an invalid when concatenating an empty list', () => {
    const actual = invalid('', ['Can`t be empty']).validateAll([]);
    expect(actual).toEqual(invalid('', ['Can`t be empty']));
  });

  it('should keep a Valid when all validators are successful', () => {
    const actual = valid('10').validateAll([isNotEmpty, hasNumbers]);
    expect(actual).toEqual(valid('10'));
  });

  it('should concatenate errors of all failing validators to a Valid', () => {
    const actual = valid('wrong zipcode').validateAll([isNotEmpty, hasNumbers]);
    expect(actual).toEqual(invalid('wrong zipcode', ['Must have numbers']));
  });

  it('should concatenate errors of all failing validators to an Invalid', () => {
    const actual = invalid('', ['Must have numbers']).validateAll([
      isNotEmpty,
      hasNumbers,
    ]);
    expect(actual).toEqual(
      invalid('', ['Must have numbers', 'Can`t be empty', 'Must have numbers'])
    );
  });

  it('should keep the value of the last successful validator in a Valid', () => {
    const actual = valid(' hi ').validateAll([trim, hasNumbers]);
    expect(actual).toEqual(invalid('hi', ['Must have numbers']));
  });

  it('should keep the value of the last successful validator in an Invalid', () => {
    const actual = invalid('  ', ['Must have numbers']).validateAll([
      trim,
      isNotEmpty,
    ]);
    expect(actual).toEqual(
      invalid('', ['Must have numbers', 'Can`t be empty'])
    );
  });

  it('should work with the examples', () => {
    const validators = [trim, isNotEmpty, hasNumbers];
    expect(Validation.of('123456').validateAll(validators)).toEqual(
      valid('123456')
    );
    expect(Validation.of('123456 ').validateAll(validators)).toEqual(
      valid('123456')
    );
    expect(Validation.of('wrong zipcode').validateAll(validators)).toEqual(
      invalid('wrong zipcode', ['Must have numbers'])
    );
    expect(Validation.of('   ').validateAll(validators)).toEqual(
      invalid('', ['Can`t be empty', 'Must have numbers'])
    );
  });
});
