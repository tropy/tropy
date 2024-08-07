import { render, inWindowContext } from '../support/react.js'
import { IconLock } from '#internal/components/icons.js'

describe('IconLock', () => {
  it('renders the lock icon SVG', () => {
    expect(
      render(<IconLock/>, inWindowContext).element())
      .to.have.class('icon')
      .and.class('icon-lock')
      .and.have.descendant('svg')
  })
})
