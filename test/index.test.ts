import Validation, {valid, invalid, concat} from '../src/index'

describe('Readme examples', () => {
    it('should behave the same with methods and functions', () => {
        const a = Validation.valid(42).map(x => x + 1)
        const b = Validation.map(x => x + 1, Validation.valid(42))
        expect(a).toEqual(b)
    })
})

describe('isValid', () => {
    it('should be true for Valid', () => {
        const actual = valid('username').isValid()
        expect(actual).toBe(true)
    })

    it('should be false for Invalid', () => {
        const actual = invalid('', ['Empty value']).isValid()
        expect(actual).toBe(false)
    })
})

describe('isInvalid', () => {
    it('should be false for Valid', () => {
        const actual = valid('username').isInvalid()
        expect(actual).toBe(false)
    })

    it('should be true for Invalid', () => {
        const actual = invalid('', ['Empty value']).isInvalid()
        expect(actual).toBe(true)
    })
})

describe('value', () => {
    it('should be available in Valid', () => {
        const actual = valid('test').value
        expect(actual).toBe('test')
    })

    it('should be available in Invalid', () => {
        const actual = invalid('', ['Empty value']).value
        expect(actual).toBe('')
    })
})

describe('errorsOr', () => {
    it('should be alt for a Valid', () => {
        const actual = valid('username').errorsOr([])
        expect(actual).toEqual([])
    })

    it('should be errors for Invalid', () => {
        const actual = invalid('', ['Empty value']).errorsOr([])
        expect(actual).toEqual(['Empty value'])
    })
})

describe('concat', () => {
    it('should change the value', () => {
        const actual = valid('discarded value').concat(valid('new value'))
        expect(actual).toEqual(valid('new value'))
    })

    it('should concatenate errors', () => {
        const actual = invalid('...', ['hello']).concat(invalid('test', ['world']))
        expect(actual).toEqual(invalid('test', ['hello', 'world']))
    })

    it('should work with (valid, invalid)', () => {
        const actual = valid(23).concat(invalid('test', ['world']))
        expect(actual).toEqual(invalid('test', ['world']))
    })

    it('should work with (invalid, valid)', () => {
        const actual = invalid('test', ['world']).concat(valid(23))
        expect(actual).toEqual(invalid(23, ['world']))
    })

    it('should have the correct order in the function style', () => {
        const actual = concat(invalid('...', ['hello']), invalid('test', ['world']))
        expect(actual).toEqual(invalid('test', ['hello', 'world']))
    })
})

describe('map', () => {
    it('should modify the value of a Valid', () => {
        const actual = valid(42).map(x => x + 1)
        expect(actual).toEqual(valid(43))
    })

    it('should modify the value of an Invalid', () => {
        const actual = invalid(42, ['error']).map(x => x + 1)
        expect(actual).toEqual(invalid(43, ['error']))
    })
})

describe('ap', () => {
    it('should apply a valid to a valid', () => {
        const actual = valid(4).ap(valid(x => x + 1))
        expect(actual).toEqual(valid(5))
    })
    it('should apply a valid to an invalid', () => {
        const actual = invalid(42, ['error']).ap(valid(x => x + 1))
        expect(actual).toEqual(invalid(43, ['error']))
    })
    it('should apply an invalid to a valid', () => {
        const actual = valid('test').ap(invalid(s => s.length, ['hello']))
        expect(actual).toEqual(invalid(4, ['hello']))
    })
    it('should apply an invalid to an invalid', () => {
        const actual = invalid('test', ['hello']).ap(invalid(s => s.length, ['world']))
        expect(actual).toEqual(invalid(4, ['hello', 'world']))
    })
})

describe('chain', () => {
    it('should return the result of the function', () => {
        const actual = valid('test').chain(str => invalid(str.length, ['error']))
        expect(actual).toEqual(invalid(4, ['error']))
    })

    it('should concatenate errors to the invalid result', () => {
        const actual = invalid('', ['Has no numbers']).chain(
            str => str.length === 0 ? invalid(str, ['Empty value']) : valid(str)
        )
        expect(actual).toEqual(invalid('', ['Has no numbers', 'Empty value']))
    })

    it('should keep the errors when chaining a valid to an invalid', () => {
        const actual = invalid('hi', ['Has no numbers']).chain(
            str => str.length === 0 ? invalid(str, ['Empty value']) : valid(str)
        )
        expect(actual).toEqual(invalid('hi', ['Has no numbers']))
    })
})

describe('fold', () => {
    it('should return the result of fnValid if it is Valid', () => {
        const actual = valid('test').fold(
            (e, v) => `Value "${v}" has failed these validations: ${e}`,
            v => `Value "${v}" is OK!`,
        )
        expect(actual).toEqual('Value "test" is OK!')
    })

    it('should return the result of fnInvalid if it is Invalid', () => {
        const actual = invalid('test', ['contain-numbers']).fold(
            (e, v) => `Value "${v}" has failed these validations: ${e}`,
            v => `Value "${v}" is OK!`,
        )
        expect(actual).toEqual('Value "test" has failed these validations: contain-numbers')
    })
})

const Left = (x: any) => ({
    fold: (leftFn: Function, rightFn: Function) => leftFn(x)
})
const Right = (x: any) => ({
    fold: (leftFn: Function, rightFn: Function) => rightFn(x)
})

describe('validateEither', () => {

    it('should concatenate errors of Either.Left to a Valid', () => {
        const actual = valid('').validateEither(Left(['Empty value']))
        expect(actual).toEqual(invalid('', ['Empty value']))
    })

    it('should concatenate errors of Either.Left to an Invalid', () => {
        const actual = invalid('', ['error']).validateEither(Left(['Empty value']))
        expect(actual).toEqual(invalid('', ['error', 'Empty value']))
    })

    it('should keep the value of Either.Right in a Valid', () => {
        const actual = valid(42).validateEither(Right(10))
        expect(actual).toEqual(valid(10))
    })

    it('should keep the value of Either.Right in an Invalid', () => {
        const actual = invalid(42, ['error']).validateEither(Right(10))
        expect(actual).toEqual(invalid(10, ['error']))
    })
})

describe('validateEitherList', () => {
    it('should keep a Valid when concatenating an empty list', () => {
        const validation = valid(10)
        const actual = validation.validateEitherList([])
        expect(actual).toEqual(validation)
    })

    it('should keep an Invalid when concatenating an empty list', () => {
        const validation = invalid(10, ['Must have letters'])
        const actual = validation.validateEitherList([])
        expect(actual).toEqual(validation)
    })
    
    it('should concatenate errors of all the Either.Left to a Valid', () => {
        const actual = valid('wrong zipcode').validateEitherList([
            Left(['Must be one word']),
            Right(''),
            Left(['Must have numbers']),
        ])
        expect(actual.errorsOr([])).toEqual(['Must be one word', 'Must have numbers'])
    })
    
    it('should concatenate errors of all the Either.Left to an Invalid', () => {
        const actual = invalid('wrong zipcode', ['Must have numbers']).validateEitherList([
            Left(['Must be one word']),
            Right(''),
        ])
        expect(actual.errorsOr([])).toEqual(['Must have numbers', 'Must be one word'])
    })
    
    it('should keep the value of the last Either.Right in a Valid', () => {
        const actual = valid('wrong zipcode').validateEitherList([
            Left(['Must be one word']),
            Right(''),
            Left(['Must have numbers']),
            Right('10')
        ])
        expect(actual.value).toBe('10')
    })
    
    it('should keep the value of the last Either.Right in an Invalid', () => {
        const actual = invalid('wrong zipcode', ['Must have numbers']).validateEitherList([
            Left(['Must be one word']),
            Right(''),
            Right('10')
        ])
        expect(actual.value).toBe('10')
    })

    it('should work with the example', () => {
        const actual = valid('wrong zipcode').validateEitherList([
            Left(['Must have numbers']),
            Right(''),
        ])
        expect(actual).toEqual(invalid('', ['Must have numbers']))
    })
})

describe('validate', () => {
    const isNotEmpty = (str: string) => str.length > 0 ? Right(str) : Left('Can`t be empty')
    const hasNumbers = (str: string) => /[0-9]/.test(str) ? Right(str) : Left('Must have numbers')

    it('should validate a Valid with a Right validator as a Valid', () => {
        const actual = valid('wrong zipcode').validate(isNotEmpty)
        expect(actual).toEqual(valid('wrong zipcode'))
    })

    it('should validate a Valid with a Left validator as an Invalid', () => {
        const actual = valid('wrong zipcode').validate(hasNumbers)
        expect(actual).toEqual(invalid('wrong zipcode', ['Must have numbers']))
    })

    it('should validate an Invalid with a Right validator as an Invalid', () => {
        const actual = invalid('wrong zipcode', ['Must have numbers']).validate(isNotEmpty)
        expect(actual).toEqual(invalid('wrong zipcode', ['Must have numbers']))
    })

    it('should validate an Invalid with a Left validator as an Invalid', () => {
        const actual = invalid('', ['Can`t be empty']).validate(hasNumbers)
        expect(actual).toEqual(invalid('', ['Can`t be empty', 'Must have numbers']))
    })
})

describe('validateAll', () => {
    const trim = (str: string) => Right(str.trim())    
    const isNotEmpty = (str: string) => str.length > 0 ? Right(str) : Left('Can`t be empty')
    const hasNumbers = (str: string) => /[0-9]/.test(str) ? Right(str) : Left('Must have numbers')

    it('should keep a valid when validating an empty list', () => {
        const actual = valid('10').validateAll([])
        expect(actual).toEqual(valid('10'))
    })

    it('should keep an invalid when concatenating an empty list', () => {
        const actual = invalid('', ['Can`t be empty']).validateAll([])
        expect(actual).toEqual(invalid('', ['Can`t be empty']))
    })

    it('should keep a Valid when all validators are successful', () => {
        const actual = valid('10').validateAll([isNotEmpty, hasNumbers])
        expect(actual).toEqual(valid('10'))
    })

    it('should concatenate errors of all failing validators to a Valid', () => {
        const actual = valid('wrong zipcode').validateAll([isNotEmpty, hasNumbers])
        expect(actual).toEqual(invalid('wrong zipcode', ['Must have numbers']))
    })

    it('should concatenate errors of all failing validators to an Invalid', () => {
        const actual = invalid('', ['Must have numbers']).validateAll([isNotEmpty, hasNumbers])
        expect(actual).toEqual(invalid('', ['Must have numbers', 'Can`t be empty', 'Must have numbers']))
    })

    it('should keep the value of the last successful validator in a Valid', () => {
        const actual = valid(' hi ').validateAll([trim, hasNumbers])
        expect(actual).toEqual(invalid('hi', ['Must have numbers']))
    })

    it('should keep the value of the last successful validator in an Invalid', () => {
        const actual = invalid('  ', ['Must have numbers']).validateAll([trim, isNotEmpty])
        expect(actual).toEqual(invalid('', ['Must have numbers', 'Can`t be empty']))
    })

    it('should work with the examples', () => {
        const validators = [trim, isNotEmpty, hasNumbers]
        expect(Validation.of('123456').validateAll(validators))
            .toEqual(valid('123456'))
        expect(Validation.of('123456 ').validateAll(validators))
            .toEqual(valid('123456'))
        expect(Validation.of('wrong zipcode').validateAll(validators))
            .toEqual(invalid('wrong zipcode', ['Must have numbers']))
        expect(Validation.of('   ').validateAll(validators))
            .toEqual(invalid('', ['Can`t be empty', 'Must have numbers']))
    })
})
