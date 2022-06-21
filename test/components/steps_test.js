import { render } from '../support/react'
import { Step, Steps } from '../../src/components/steps'

describe('Steps', () => {
  it('renders steps element', () => {
    expect(render(<Steps/>).element()).to.have.class('steps')
  })

  describe('Step', () => {
    it('renders step element', () => {
      expect(render(<Step/>).element()).to.have.class('step')
    })
  })
})
