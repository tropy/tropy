import { mock } from 'node:test'
import { act, renderHook } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createStore } from '../../support/react.js'
import { create } from '#tropy/common/selection.js'
import { WindowContext } from '#tropy/components/window.js'
import { usePhotoPreview } from '#tropy/components/photo/use-photo-preview.js'

describe('usePhotoPreview', () => {
  let store, quicklook, preview

  beforeEach(() => {
    quicklook = { isVisible: false, show: mock.fn() }

    store = createStore({
      items: { 1: { id: 1, photos: [11, 12, 13] } },
      photos: {
        11: { id: 11, item: 1, notes: [] },
        12: { id: 12, item: 1, notes: [] },
        13: { id: 13, item: 1, notes: [] }
      },
      qr: { items: [1] },
      nav: { item: create([1]), photo: 11 }
    })

    preview = renderHook(() => usePhotoPreview(), {
      wrapper: ({ children }) => (
        <Provider store={store}>
          <WindowContext.Provider value={{ quicklook }}>
            {children}
          </WindowContext.Provider>
        </Provider>
      )
    }).result.current
  })

  let photo = () => store.getState().nav.photo

  it('shows quicklook', () => {
    preview(1)
    expect(quicklook.show.mock.callCount()).to.equal(1)
    expect(photo()).to.equal(11)
  })

  it('cycles through the photos while visible', () => {
    quicklook.isVisible = true

    act(() => { preview(1) })
    expect(photo()).to.equal(12)

    act(() => { preview(-1) })
    act(() => { preview(-1) })
    expect(photo()).to.equal(13)
  })
})
