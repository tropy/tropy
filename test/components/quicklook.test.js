import { mock } from 'node:test'
import { act, render } from '@testing-library/react'
import { QuickLook, useQuickLookContent } from '#tropy/components/quicklook.js'
import { WindowContext } from '#tropy/components/window.js'

describe('QuickLook', () => {
  let win, root

  beforeEach(() => {
    root = document.implementation.createHTMLDocument().body
    win = {
      quicklook: {
        open: mock.fn(() => root),
        resize: mock.fn()
      }
    }
  })

  let Content = ({ content }) => {
    useQuickLookContent(content)
    return content ? <p>{content.title}</p> : null
  }

  let ui = (content) => (
    <WindowContext.Provider value={win}>
      <QuickLook>
        <Content content={content}/>
      </QuickLook>
    </WindowContext.Provider>
  )

  let last = (fn) => fn.mock.calls.at(-1)?.arguments

  it('renders into the quicklook window', async () => {
    await act(async () => {
      render(ui({ title: 'a', width: 400, height: 300 }))
    })

    expect(root.querySelector('h1').textContent).to.equal('a')
    expect(last(win.quicklook.resize)).to.eql([{ width: 400, height: 300 }])
  })

  it('reports no size without content and on unmount', async () => {
    let result

    await act(async () => {
      result = render(ui({ title: 'a', width: 400, height: 300 }))
    })

    await act(async () => {
      result.rerender(ui(null))
    })
    expect(last(win.quicklook.resize)).to.eql([null])

    result.unmount()
    expect(last(win.quicklook.resize)).to.eql([null])
    expect(root.innerHTML).to.equal('')
  })

  it('renders nothing without a quicklook window', () => {
    win.quicklook.open = () => null
    let { container } = render(ui({ title: 'a', width: 400, height: 300 }))
    expect(container.innerHTML).to.equal('')
  })
})
