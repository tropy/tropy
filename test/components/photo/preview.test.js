import { mock } from 'node:test'
import { act, render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createStore } from '../../support/react.js'
import { QuickLook } from '#tropy/components/quicklook.js'
import { WindowContext } from '#tropy/components/window.js'
import { PhotoPreview } from '#tropy/components/photo/preview.js'

describe('PhotoPreview', () => {
  it('previews the selected photo with rotation and adjustments', async () => {
    let win = { quicklook: { update: mock.fn(), resize: mock.fn() } }

    let store = createStore({
      photos: {
        1: {
          id: 1,
          filename: 'a.jpg',
          path: '/a.jpg',
          angle: 90,
          width: 400,
          height: 300,
          brightness: 10,
          negative: true
        }
      },
      nav: { photo: 1 }
    })

    await act(async () => {
      render(
        <Provider store={store}>
          <WindowContext.Provider value={win}>
            <QuickLook>
              <PhotoPreview/>
            </QuickLook>
          </WindowContext.Provider>
        </Provider>)
    })

    let [size] = win.quicklook.resize.mock.calls.at(-1).arguments
    let [html] = win.quicklook.update.mock.calls.at(-1).arguments

    expect(size).to.eql({ width: 300, height: 400 })
    expect(html).to.include('<h1 class="quicklook-title">a.jpg</h1>')
    expect(html).to.include('filter: brightness(1.1) invert(1)')
  })
})
