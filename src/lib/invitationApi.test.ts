import { expect, it } from 'vitest'
import { invitationApiBase } from './invitationApi'

it('uses open prefix when universal', () => {
  expect(invitationApiBase(true, 'abc')).toBe('/api/invitation/open/abc')
  expect(invitationApiBase(false, 'abc')).toBe('/api/invitation/abc')
})
