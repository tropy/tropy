import { render, withStore } from '../../support/react.js'
import { ThumbnailProvider } from '#tropy/components/photo/thumbnail.js'
import { createPhotoStore } from './store.js'

describe('ThumbnailProvider', () => {
  // Photo 1 of the store, its image failing to load.
  let setup = (figure) => {
    let store = createPhotoStore()
    let { container } = render(
      <ThumbnailProvider>{figure}</ThumbnailProvider>,
      withStore(store))

    container.querySelector('img')
      .dispatchEvent(new Event('error'))

    return store.getState().photos[1]
  }

  it('reports image errors of thumbnails', () => {
    let photo = setup(
      <figure className="thumbnail" data-id="1"><img/></figure>)

    expect(photo.broken).to.be.true
  })

  it('ignores broken thumbnails', () => {
    let photo = setup(
      <figure className="thumbnail"><img/></figure>)

    expect(photo.broken).not.to.be.true
  })
})
