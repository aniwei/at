import { test, expect} from 'vitest'
import { At } from '../../at/at'

test('At 初始化测试', async () => {
  await expect(At.ensure())
})