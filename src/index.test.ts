import {expect} from 'chai'
import Validation, {valid, invalid, concat} from './index'

describe('Readme examples', () => {
    it('should behave the same with methods and functions', () => {
        const a = Validation.valid(42).map(x => x + 1)
        const b = Validation.map(x => x + 1, Validation.valid(42))
        expect(a).to.deep.equal(b)
    })
})

describe('isValid', () => {
    it('should be true for Valid', () => {
        const actual = valid('username').isValid()
        expect(actual).to.be.true
    })

    it('should be false for Invalid', () => {
        const actual = invalid('', ['Empty value']).isValid()
        expect(actual).to.be.false
    })
})

describe('isInvalid', () => {
    it('should be false for Valid', () => {
        const actual = valid('username').isInvalid()
        expect(actual).to.be.false
    })

    it('should be true for Invalid', () => {
        const actual = invalid('', ['Empty value']).isInvalid()
        expect(actual).to.be.true
    })
})

describe('value', () => {
    it('should be available in Valid', () => {
        const actual = valid('test').value
        expect(actual).to.equal('test')
    })

    it('should be available in Invalid', () => {
        const actual = invalid('', ['Empty value']).value
        expect(actual).to.equal('')
    })
})

describe('errorsOr', () => {
    it('should be alt for a Valid', () => {
        const actual = valid('username').errorsOr([])
        expect(actual).to.deep.equal([])
    })

    it('should be errors for Invalid', () => {
        const actual = invalid('', ['Empty value']).errorsOr([])
        expect(actual).to.deep.equal(['Empty value'])
    })
})

describe('concat', () => {
    it('should change the value', () => {
        const actual = valid('discarded value').concat(valid('new value'))
        expect(actual).to.deep.equal(valid('new value'))
    })

    it('should concatenate errors', () => {
        const actual = invalid('...', ['hello']).concat(invalid('test', ['world']))
        expect(actual).to.deep.equal(invalid('test', ['hello', 'world']))
    })

    it('should work with (valid, invalid)', () => {
        const actual = valid(23).concat(invalid('test', ['world']))
        expect(actual).to.deep.equal(invalid('test', ['world']))
    })

    it('should work with (invalid, valid)', () => {
        const actual = invalid('test', ['world']).concat(valid(23))
        expect(actual).to.deep.equal(invalid(23, ['world']))
    })

    it('should have the correct order in the function style', () => {
        const actual = concat(invalid('...', ['hello']), invalid('test', ['world']))
        expect(actual).to.deep.equal(invalid('test', ['hello', 'world']))
    })
})

describe('map', () => {
    it('should modify the value of a Valid', () => {
        const actual = valid(42).map(x => x + 1)
        expect(actual).to.deep.equal(valid(43))
    })

    it('should modify the value of an Invalid', () => {
        const actual = invalid(42, ['error']).map(x => x + 1)
        expect(actual).to.deep.equal(invalid(43, ['error']))
    })
})

describe('ap', () => {
    it('should apply a valid to a valid', () => {
        const actual = valid(4).ap(valid(x => x + 1))
        expect(actual).to.deep.equal(valid(5))
    })
    it('should apply a valid to an invalid', () => {
        const actual = invalid(42, ['error']).ap(valid(x => x + 1))
        expect(actual).to.deep.equal(invalid(43, ['error']))
    })
    it('should apply an invalid to a valid', () => {
        const actual = valid('test').ap(invalid(s => s.length, ['hello']))
        expect(actual).to.deep.equal(invalid(4, ['hello']))
    })
    it('should apply an invalid to an invalid', () => {
        const actual = invalid('test', ['hello']).ap(invalid(s => s.length, ['world']))
        expect(actual).to.deep.equal(invalid(4, ['hello', 'world']))
    })
})

describe('chain', () => {
    it('should return the result of the function', () => {
        const actual = valid('test').chain(str => invalid(str.length, ['error']))
        expect(actual).to.deep.equal(invalid(4, ['error']))
    })

    it('should concatenate errors to the invalid result', () => {
        const actual = invalid('', ['Has no numbers']).chain(
            str => str.length === 0 ? invalid(str, ['Empty value']) : valid(str)
        )
        expect(actual).to.deep.equal(invalid('', ['Has no numbers', 'Empty value']))
    })

    it('should keep the errors when chaining a valid to an invalid', () => {
        const actual = invalid('hi', ['Has no numbers']).chain(
            str => str.length === 0 ? invalid(str, ['Empty value']) : valid(str)
        )
        expect(actual).to.deep.equal(invalid('hi', ['Has no numbers']))
    })
})

describe('fold', () => {
    it('should return the result of fnValid if it is Valid', () => {
        const actual = valid('test').fold(
            (e, v) => `Value "${v}" has failed these validations: ${e}`,
            v => `Value "${v}" is OK!`,
        )
        expect(actual).to.deep.equal('Value "test" is OK!')
    })

    it('should return the result of fnInvalid if it is Invalid', () => {
        const actual = invalid('test', ['contain-numbers']).fold(
            (e, v) => `Value "${v}" has failed these validations: ${e}`,
            v => `Value "${v}" is OK!`,
        )
        expect(actual).to.deep.equal('Value "test" has failed these validations: contain-numbers')
    })
})

describe('validateEither', () => {
    const Left = x => ({
        fold: (leftFn, rightFn) => leftFn(x)
    })
    const Right = x => ({
        fold: (leftFn, rightFn) => rightFn(x)
    })

    it('should concatenate errors of Either.Left to a Valid', () => {
        const actual = valid('').validateEither(Left(['Empty value']))
        expect(actual).to.deep.equal(invalid('', ['Empty value']))
    })

    it('should concatenate errors of Either.Left to an Invalid', () => {
        const actual = invalid('', ['error']).validateEither(Left(['Empty value']))
        expect(actual).to.deep.equal(invalid('', ['error', 'Empty value']))
    })

    it('should keep the value of Either.Right in a Valid', () => {
        const actual = valid(42).validateEither(Right(10))
        expect(actual).to.deep.equal(valid(10))
    })

    it('should keep the value of Either.Right in an Invalid', () => {
        const actual = invalid(42, ['error']).validateEither(Right(10))
        expect(actual).to.deep.equal(invalid(10, ['error']))
    })
})
