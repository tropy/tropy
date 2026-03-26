import { render, inWindowContext } from '../../support/react.cjs'
import { PhotoList } from '#tropy/components/photo/list.js'

describe('PhotoList', () => {
  it('renders an empty list by default', () => {
    expect(
      render(
        <PhotoList photos={[]}/>,
        inWindowContext
      ).element())
      .to.have.class('photo-list')
      .and.not.have.descendants('li.photo')
  })
})
