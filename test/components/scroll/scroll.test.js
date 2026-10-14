import { createRef } from 'react'
import { mock } from 'node:test'
import { act, waitFor } from '@testing-library/react'
import { render } from '../../support/react.js'
import { pluck } from '#tropy/selectors/util.js'
import { Scroll } from '#tropy/components/scroll/index.js'

describe('Scroll', () => {
  let style
  let ids = Array.from({ length: 100 }, (_, idx) => idx + 1)
  let items = pluck(Object.fromEntries(ids.map(id => [id, { id }])), ids)

  before(() => {
    style = document.createElement('style')
    style.textContent = `
      .scroll-container { height: 100px; overflow: auto }
      .viewport { display: grid; margin: 0; padding: 0 }
      .viewport > li { display: block; height: 20px }
      .viewport > .tile-expansion { height: 44px }`
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

    // Rendered right away, not after the scroll event.
    rerender(renderScroll({ cursor: 80 }))

    expect($('#item-80')).to.exist
    expect($('.scroll-container').scrollTop).to.be.above(1000)
  })

  it('scrolls to the end', async () => {
    let scroll = createRef()
    let { $, $$ } = render(renderScroll({ ref: scroll }))
    let container = $('.scroll-container')

    await measured($$)
    act(() => scroll.current.scrollToEnd())

    expect(container.scrollTop)
      .to.equal(container.scrollHeight - container.clientHeight)
    expect($('#item-100')).to.exist
  })

  it('scrolls to the cursor once measured', async () => {
    let { $ } = render(renderScroll({ cursor: 80 }))

    await waitFor(() => {
      expect($('#item-80')).to.exist
      expect($('.scroll-container').scrollTop).to.be.above(1000)
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

  describe('when a grid expands an item', () => {
    let tiles = Array.from({ length: 200 }, (_, idx) => ({ id: idx + 1 }))

    let renderGrid = (cursor) => (
      <Scroll
        items={tiles}
        itemHeight={20}
        itemWidth={20}
        cursor={cursor}
        expansion={{
          id: 3,
          length: 7,
          padding: 4,
          render: () => <div id="expansion"/>
        }}
        tabIndex={0}>
        {(item) => <li key={item.id} id={`item-${item.id}`}/>}
      </Scroll>
    )

    let setup = async (cursor) => {
      let { $, $$, rerender } = render(renderGrid(cursor))
      let container = $('.scroll-container')

      // 5 columns, with or without a scrollbar.
      container.style.width = '117px'
      await waitFor(() => {
        expect($$('li').length).to.be.above(20)
      })

      let top = (id) => $(`#item-${id}`).getBoundingClientRect().top

      return { $, container, rerender, top }
    }

    it('renders the expansion below the item\'s row', async () => {
      let { $, top } = await setup(1)

      expect($('#expansion').parentElement.previousElementSibling.id)
        .to.equal('item-5')
      expect(top(6) - top(1)).to.equal(64)
    })

    it('scrolls to items below the expansion', async () => {
      let { container, rerender, top } = await setup(1)

      rerender(renderGrid(198))

      let bounds = container.getBoundingClientRect()
      expect(top(198)).to.be.at.least(bounds.top)
      expect(top(198) + 20).to.be.at.most(bounds.bottom)
    })
  })

  describe('when zooming a grid', () => {
    let tiles = Array.from({ length: 200 }, (_, idx) => ({ id: idx + 1 }))

    let renderGrid = (size, cursor) => (
      <Scroll
        items={tiles}
        itemHeight={size}
        itemWidth={size}
        cursor={cursor}
        tabIndex={0}>
        {(item) => (
          <li key={item.id} id={`item-${item.id}`} style={{ height: size }}/>
        )}
      </Scroll>
    )

    let setup = async (cursor, scrollTop, size = 20) => {
      let { $, $$, rerender } = render(renderGrid(size, cursor))
      let container = $('.scroll-container')

      // 5 columns of 20px or 4 of 25px, with or without a scrollbar.
      container.style.width = '117px'
      await waitFor(() => {
        expect($$('li').length).to.be.above(20)
      })

      container.scrollTop = scrollTop
      await frame()
      await frame()

      // The tile's center, relative to the viewport.
      let position = (id) => {
        let { top, bottom } = $(`#item-${id}`).getBoundingClientRect()
        return (top + bottom) / 2 - container.getBoundingClientRect().top
      }

      let zoom = (size) => rerender(renderGrid(size, cursor))

      return { $$, container, position, zoom }
    }

    it('keeps the cursor in place', async () => {
      let { position, zoom } = await setup(53, 150)
      let before = position(53)

      zoom(25)
      expect(position(53)).to.be.closeTo(before, 1)
    })

    it('keeps the top row in place without a visible cursor', async () => {
      let { position, zoom } = await setup(1, 300)
      let before = position(76)

      zoom(25)
      expect(position(76)).to.be.closeTo(before, 1)
    })

    it('keeps its place when hidden and shown', async () => {
      let { $$, container, position } = await setup(76, 300)
      let before = position(76)

      // Collapsed: unmeasured, a single column.
      container.style.width = '0px'
      container.style.height = '0px'
      await waitFor(() => {
        expect($$('li').length).to.be.at.most(2)
      })

      container.style.width = '117px'
      container.style.height = ''
      await waitFor(() => {
        expect($$('li').length).to.be.above(20)
      })

      expect(position(76)).to.be.closeTo(before, 1)
    })

    // Zooming out shortens the runway: the browser clamps
    // the scroll position before the view is anchored.
    it('keeps the top row in place when zooming out at the end', async () => {
      let { position, zoom } = await setup(1, 1100, 25)
      let before = position(177)

      zoom(20)
      expect(position(177)).to.be.closeTo(before, 1)
    })
  })
})
