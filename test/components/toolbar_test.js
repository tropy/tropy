import { render } from '../support/react'
import { Toolbar } from '../../src/components/toolbar'

describe('Toolbar', () => {
  it('renders toolbar element', () => {
    expect(render(<Toolbar/>).element()).to.have.class('toolbar')
  })
})
