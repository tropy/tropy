import { render, inWindowContext } from '../support/react'
import { IconTropy } from '../../src/components/icons'

describe('IconTropy', () => {
  it('renders the Tropy icon SVG', () => {
    expect(
      render(<IconTropy/>, inWindowContext).element())
        .to.have.class('icon')
        .and.class('icon-tropy')
        .and.have.descendant('svg')
  })
})
