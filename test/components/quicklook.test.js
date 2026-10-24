import { mock } from 'node:test'
import { act, render } from '@testing-library/react'
import { QuickLook, useQuickLookContent } from '#tropy/components/quicklook.js'
import { WindowContext } from '#tropy/components/window.js'

describe('QuickLook', () => {
  let win

  beforeEach(() => {
    win = {
      quicklook: {
        update: mock.fn(),
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
    expect(last(win.quicklook.update)).to.eql([''])
  })

  it('renders into an inert document', () => {
    let img

    render(
      <WindowContext.Provider value={win}>
        <QuickLook>
          <img ref={el => { img = el }} src="photo.jpg"/>
        </QuickLook>
      </WindowContext.Provider>)

    expect(img.ownerDocument).not.to.equal(document)
    expect(img.ownerDocument.defaultView).to.be.null
  })
})
