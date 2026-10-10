import { render, inWindowContext } from '../../support/react.js'
import { PhotoList } from '#tropy/components/photo/list.js'

describe('PhotoList', () => {
  const photos = [
    { id: 1, item: 1, selections: [] },
    { id: 2, item: 1, selections: [] }
  ]

  it('renders an empty list by default', () => {
    expect(
      render(
        <PhotoList photos={[]}/>,
        inWindowContext
      ).element())
      .to.have.class('photo-list')
      .and.not.have.descendants('li.photo')
  })

  it('renders photos', () => {
    expect(
      render(
        <PhotoList photos={photos} expandedPhotos={{}}/>,
        inWindowContext
      ).element())
      .to.have.descendants('li.photo').with.length(2)
  })
})
