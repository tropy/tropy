import { render, inWindowContext } from '../support/react'
import { IconLock } from '../../src/components/icons'

describe('IconLock', () => {
  it('renders the lock icon SVG', () => {
    expect(
      render(<IconLock/>, inWindowContext).element())
      .to.have.class('icon')
      .and.class('icon-lock')
      .and.have.descendant('svg')
  })
})
