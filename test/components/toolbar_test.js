import { render } from '../support/react.js'
import { Toolbar } from '#internal/components/toolbar.js'

describe('Toolbar', () => {
  it('renders toolbar element', () => {
    expect(render(<Toolbar/>).element()).to.have.class('toolbar')
  })
})
