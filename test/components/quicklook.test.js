import { mock } from 'node:test'
import { act, render } from '@testing-library/react'
import { QuickLook, useQuickLookTitle } from '#tropy/components/quicklook.js'
import { WindowContext } from '#tropy/components/window.js'

describe('QuickLook', () => {
  let win, root

  beforeEach(() => {
    root = document.implementation.createHTMLDocument().body
    win = {
      quicklook: {
        open: () => root,
        fit: mock.fn()
      }
    }
  })

  let Content = ({ title }) => {
    useQuickLookTitle(title)
    return <p>{title}</p>
  }

  let ui = (title) => (
    <WindowContext.Provider value={win}>
      <QuickLook>
        <Content title={title}/>
      </QuickLook>
    </WindowContext.Provider>
  )

  it('renders the title and content into the quicklook window', async () => {
    await act(async () => {
      render(ui('a'))
    })

    let titlebar = root.querySelector('.quicklook-titlebar')
    expect(titlebar.textContent).to.equal('a')
    expect(titlebar.classList.contains('visible')).to.be.true
    expect(root.querySelector('.quicklook-content').textContent).to.equal('a')
  })

  it('hides the window on unmount', () => {
    let { unmount } = render(ui('a'))
    unmount()

    expect(win.quicklook.fit.mock.calls.at(-1).arguments).to.eql([null])
    expect(root.innerHTML).to.equal('')
  })

  it('renders nothing without a quicklook window', () => {
    win.quicklook.open = () => null
    let { container } = render(ui('a'))
    expect(container.innerHTML).to.equal('')
  })
})
