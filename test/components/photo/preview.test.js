import { mock } from 'node:test'
import { ipcRenderer } from 'electron'
import { act, render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createStore } from '../../support/react.js'
import { QuickLook } from '#tropy/components/quicklook.js'
import { WindowContext } from '#tropy/components/window.js'
import { PhotoPreview } from '#tropy/components/photo/preview.js'
import * as actions from '#tropy/actions/index.js'
import ARGS, { update } from '#tropy/args.js'

describe('PhotoPreview', () => {
  let root, store, win, decoded
  let { cache } = ARGS

  before(() => update({ cache: '/cache' }))
  after(() => update({ cache }))

  // Resolves pending image decodes by src.
  let decode = async (name) => {
    await act(async () => {
      decoded.get(name)()
    })
  }

  let layers = () =>
    Array.from(root.querySelectorAll('img'), img => ({
      src: img.getAttribute('src').split('/').pop(),
      isPending: img.classList.contains('quicklook-pending')
    }))

  let title = () => root.querySelector('h1').textContent

  let fits = () => win.quicklook.fit.mock.calls
    .map(call => call.arguments[0])
    .filter(Boolean)

  let select = (photo) => act(() => {
    store.dispatch(actions.photo.select({ photo, item: 1 }))
  })

  // Main reports visibility to the parent window.
  let show = () => act(() => {
    ipcRenderer.emit('quicklook', {}, { isVisible: true })
  })

  beforeEach(async () => {
    root = document.createElement('div')
    document.body.append(root)

    decoded = new Map()
    mock.method(HTMLImageElement.prototype, 'decode', function () {
      return new Promise(resolve => {
        decoded.set(this.getAttribute('src').split('/').pop(), resolve)
      })
    })

    win = {
      quicklook: {
        open: () => root,
        fit: mock.fn(async () => {})
      }
    }

    store = createStore({
      project: { id: 'p', path: '/p.tropy' },
      photos: {
        1: {
          id: 1,
          item: 1,
          filename: 'a.jpg',
          path: '/a.jpg',
          mimetype: 'image/jpeg',
          notes: [],
          angle: 90,
          width: 400,
          height: 300,
          brightness: 10,
          negative: true
        },
        2: {
          id: 2,
          item: 1,
          filename: 'b.jpg',
          path: '/b.jpg',
          mimetype: 'image/jpeg',
          notes: [],
          width: 400,
          height: 300
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
  })

  afterEach(() => {
    mock.restoreAll()
    root.remove()
  })

  it('only fits the window while hidden', () => {
    expect(fits()).to.eql([{ width: 300, height: 400 }])
    expect(layers()).to.eql([])

    select(2)
    expect(fits().at(-1)).to.eql({ width: 400, height: 300 })
    expect(layers()).to.eql([])
  })

  it('shows a photo once decoded and fitted', async () => {
    show()
    expect(layers()).to.have.length(1)
    expect(layers()[0].isPending).to.be.true

    await decode(layers()[0].src)

    expect(fits()[0]).to.eql({ width: 300, height: 400 })
    expect(layers()).to.have.length(1)
    expect(layers()[0].isPending).to.be.false
    expect(title()).to.equal('a.jpg')
    expect(root.querySelector('img').style.filter)
      .to.equal('brightness(1.1) invert(1)')
  })

  it('keeps the shown photo until the next one is ready', async () => {
    show()
    let [a] = layers()
    await decode(a.src)

    select(2)

    let [shown, next] = layers()
    expect(shown).to.eql({ ...a, isPending: false })
    expect(next.isPending).to.be.true
    expect(title()).to.equal('a.jpg')

    await decode(next.src)

    expect(layers()).to.eql([{ ...next, isPending: false }])
    expect(title()).to.equal('b.jpg')
  })

  it('drops photos selected away from while loading', async () => {
    show()
    let [a] = layers()
    let fitted = fits().length

    select(2)
    await decode(a.src)

    expect(fits()).to.have.length(fitted)
    expect(layers()).to.have.length(1)
    expect(layers()[0].isPending).to.be.true
  })
})
