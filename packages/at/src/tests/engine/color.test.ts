import { test, expect} from 'vitest'
import { Color } from '../../at/engine/color'


test('Color 测试用例',()=>{
  expect(Color.fromString('#ffffff').value).toBe(0xffffffff)
})