import { mock } from 'node:test'
import { waitFor } from '@testing-library/react'
import { render } from '../support/react.js'
import { Scroll } from '#tropy/components/scroll/index.js'

describe('Scroll', () => {
  let style
  let items = Array.from({ length: 100 }, (_, idx) => ({ id: idx + 1 }))

  before(() => {
    style = document.createElement('style')
    style.textContent = `
      .scroll-container { height: 100px; overflow: auto }
      .viewport { margin: 0; padding: 0 }
      .viewport > li { display: block; height: 20px }`
    document.head.appendChild(style)
  })

  after(() => {
    style.remove()
  })

  let renderScroll = (props, onRender) => (
    <Scroll items={items} itemHeight={20} tabIndex={0} {...props}>
      {(item) => {
        onRender?.()
        return <li key={item.id} id={`item-${item.id}`}/>
      }}
    </Scroll>
  )

  let frame = () => new Promise(resolve => requestAnimationFrame(resolve))

  let measured = async ($$) => {
    await waitFor(() => {
      expect($$('li')).to.have.length.within(6, 20)
    })
  }

  it('reports its layout', async () => {
    let onLayoutChange = mock.fn()
    render(renderScroll({ onLayoutChange }))

    await waitFor(() => {
      expect(onLayoutChange.mock.calls.at(-1).arguments[0]).to.eql({
        layout: 'list', columns: 1, pageSize: 5
      })
    })
  })

  it('renders and scrolls to the cursor', async () => {
    let { $, $$, rerender } = render(renderScroll({ cursor: 1 }))

    // Once measured, only the rows around the viewport are rendered.
    await measured($$)

    expect($('#item-1')).to.exist
    expect($('#item-80')).not.to.exist

    rerender(renderScroll({ cursor: 80 }))

    await waitFor(() => {
      expect($('#item-80')).to.exist
      expect($('.scroll-container').scrollTop).to.be.above(1000)
    })
  })

  it('scrolls to the cursor once measured', async () => {
    let { $ } = render(renderScroll({ cursor: 80 }))

    await waitFor(() => {
      expect($('#item-80')).to.exist
      expect($('.scroll-container').scrollTop).to.be.above(1000)
    })
  })

  it('scrolls to the expansion cursor', async () => {
    let expandedItems = {
      1: Array.from({ length: 40 }, (_, idx) => 101 + idx)
    }

    let { $, $$, rerender } = render(renderScroll({ cursor: 1, expandedItems }))
    await measured($$)

    rerender(renderScroll({ cursor: 1, expandedItems, expansionCursor: 140 }))

    await waitFor(() => {
      expect($('.scroll-container').scrollTop).to.be.above(600)
    })
  })

  it('keeps the visible rows rendered', async () => {
    let { $, $$ } = render(renderScroll())
    let container = $('.scroll-container')

    await measured($$)

    for (let top of [15, 35, 90, 333, 777, 1240, 1900, 500, 10]) {
      container.scrollTop = top

      await waitFor(() => {
        let bounds = container.getBoundingClientRect()
        let rows = $$('li')

        expect(rows[0].getBoundingClientRect().top)
          .to.be.at.most(bounds.top)
        expect(rows[rows.length - 1].getBoundingClientRect().bottom)
          .to.be.at.least(bounds.bottom)
      })
    }
  })

  it('keeps the visible rows rendered when the steps change', async () => {
    let { $, $$ } = render(renderScroll())
    let container = $('.scroll-container')

    // Tall: large steps (8 rows).
    container.style.height = '400px'
    await waitFor(() => {
      expect($$('li').length).to.be.above(20)
    })

    container.scrollTop = 1270
    await waitFor(() => {
      expect($('#item-64')).to.exist
    })

    // Short: small steps; scrollTop is still 1270.
    container.style.height = '100px'
    await measured($$)

    expect($('#item-69')).to.exist
  })

  it('does not render when scrolling within a step', async () => {
    let onRender = mock.fn()
    let { $, $$ } = render(renderScroll({}, onRender))

    await measured($$)
    let renders = onRender.mock.callCount()

    $('.scroll-container').scrollTop = 20
    await frame()
    await frame()

    expect(onRender.mock.callCount()).to.equal(renders)
  })
})
