import {expect} from 'chai'
import {valid} from './index'

type TaPutaMare = any

describe('Validation', () => {
    it('should work', () => {
        console.log(valid(42) as TaPutaMare)
    })
})