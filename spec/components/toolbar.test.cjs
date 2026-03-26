import { render } from '../support/react.cjs'
import { Toolbar } from '#tropy/components/toolbar.js'

describe('Toolbar', () => {
  it('renders toolbar element', () => {
    expect(render(<Toolbar/>).element()).to.have.class('toolbar')
  })
})
