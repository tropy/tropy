import { createRef } from 'react'
import { mock } from 'node:test'
import { act, waitFor } from '@testing-library/react'
import { render } from '../../support/react.js'
import { fakeResizeObserver, scroll } from '../../support/dom.js'
import { Scroll } from '#tropy/components/scroll/index.js'
import { Cursor } from '#tropy/common/sequence.js'

describe('Scroll', () => {
  let style
  let items = Array.from({ length: 100 }, (_, idx) => ({ id: idx + 1 }))

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

  beforeEach(() => {
    fakeResizeObserver.enable()
  })

  afterEach(() => {
    fakeResizeObserver.reset()
  })

  let renderScroll = ({ cursor, seq = items, ...props } = {}, onRender) => (
    <Scroll
      cursor={new Cursor(seq, cursor)}
      itemHeight={20}
      tabIndex={0}
      {...props}>
      {(item) => {
        onRender?.()
        return <li key={item.id} id={`item-${item.id}`}/>
      }}
    </Scroll>
  )

  it('reports its layout once measured', async () => {
    // With the built-in observer.
    fakeResizeObserver.reset()

    let onLayoutChange = mock.fn()
    render(renderScroll({ onLayoutChange }))

    await waitFor(() => {
      expect(onLayoutChange.mock.calls.at(-1).arguments[0]).to.eql({
        layout: 'list', columns: 1, pageSize: 5
      })
    }, { timeout: 1500 })
  })

  it('renders only the rows around the view', () => {
    let { $, $$ } = render(renderScroll())

    expect($$('li')).to.have.length.within(6, 20)
    expect($('#item-80')).not.to.exist
  })

  it('scrolls to the cursor right away', () => {
    let { $, rerender } = render(renderScroll({ cursor: 1 }))
    let container = $('.scroll-container')

    // Rendered and scrolled before paint.
    rerender(renderScroll({ cursor: 80 }))

    expect($('#item-80').getBoundingClientRect().top -
      container.getBoundingClientRect().top).to.equal(40)
  })

  it('scrolls to the cursor once measured', () => {
    let { $ } = render(renderScroll({ cursor: 80 }))

    expect($('#item-80')).to.exist
    expect($('.scroll-container').scrollTop).to.be.above(1000)
  })

  it('does not scroll back to the cursor when rendered again', () => {
    let { $, rerender } = render(renderScroll({ cursor: 1 }))
    let container = $('.scroll-container')

    container.scrollTop = 1000

    // A new cursor at the same position.
    rerender(renderScroll({ cursor: 1 }))
    expect(container.scrollTop).to.equal(1000)
  })

  describe('when the sequence changes', () => {
    let setup = (props) => {
      let { $, rerender } = render(renderScroll(props))
      let container = $('.scroll-container')

      scroll(container, 1000)

      return { $, container, rerender }
    }

    it('starts at the top without the cursor', () => {
      let { container, rerender } = setup()

      rerender(renderScroll({ seq: items.slice(10) }))
      expect(container.scrollTop).to.equal(0)
    })

    it('keeps the cursor in view', () => {
      let { $, container, rerender } = setup({ cursor: 55 })

      // Reversed: the cursor moves far away.
      rerender(renderScroll({ cursor: 55, seq: [...items].reverse() }))

      let bounds = container.getBoundingClientRect()
      let { top } = $('#item-55').getBoundingClientRect()

      expect(top).to.be.at.least(bounds.top)
      expect(top + 20).to.be.at.most(bounds.bottom)
    })

    it('does not move when only the cursor is cleared', () => {
      let { container, rerender } = setup({ cursor: 55 })

      rerender(renderScroll())
      expect(container.scrollTop).to.equal(1000)
    })
  })

  it('scrolls elements into view', () => {
    let scrollRef = createRef()
    let { $ } = render(renderScroll({ cursor: 1, ref: scrollRef }))

    // The element itself, or its id.
    act(() => scrollRef.current.scrollIntoView(items[79]))
    expect($('#item-80')).to.exist

    act(() => scrollRef.current.scrollIntoView(3))
    expect($('#item-3')).to.exist
  })

  it('keeps the visible rows rendered when resized', () => {
    let { $, $$ } = render(renderScroll())
    let container = $('.scroll-container')

    fakeResizeObserver.resize(container, { height: '400px' })
    expect($$('li').length).to.be.above(20)

    scroll(container, 1270)
    expect($('#item-64')).to.exist

    // A little further: no new rows needed while tall.
    scroll(container, 1340)

    fakeResizeObserver.resize(container, { height: '100px' })
    expect($('#item-72')).to.exist
  })

  it('renders the new page within the scroll event', () => {
    let { $ } = render(renderScroll())

    // No frame in between: the rows are there before paint.
    scroll($('.scroll-container'), 1500)
    expect($('#item-76')).to.exist
  })

  it('does not render rows when scrolling a little', () => {
    let onRender = mock.fn()
    let { $ } = render(renderScroll({}, onRender))
    let container = $('.scroll-container')

    scroll(container, 600)
    let renders = onRender.mock.callCount()

    // Back and forth across a row.
    for (let top of [610, 620, 610, 620])
      scroll(container, top)

    expect(onRender.mock.callCount()).to.equal(renders)
  })

  it('does not render rows for a new cursor at the same position', () => {
    let onRender = mock.fn()

    // The owner's renderItem is stable (compiled or memoized);
    // its cursor is new on every render.
    let renderItem = (item) => {
      onRender()
      return <li key={item.id} id={`item-${item.id}`}/>
    }

    let renderOwner = () => (
      <Scroll cursor={new Cursor(items, 1)} itemHeight={20} tabIndex={0}>
        {renderItem}
      </Scroll>
    )

    let { rerender } = render(renderOwner())

    let renders = onRender.mock.callCount()
    rerender(renderOwner())

    expect(onRender.mock.callCount()).to.equal(renders)
  })

  describe('when a grid expands an item', () => {
    let tiles = Array.from({ length: 200 }, (_, idx) => ({ id: idx + 1 }))

    let renderGrid = (cursor) => (
      <Scroll
        cursor={new Cursor(tiles, cursor)}
        itemHeight={20}
        itemWidth={20}
        expansion={{ id: 3, length: 7, padding: 4 }}
        renderExpansion={() => <div id="expansion"/>}
        tabIndex={0}>
        {(item) => <li key={item.id} id={`item-${item.id}`}/>}
      </Scroll>
    )

    let setup = (cursor) => {
      let { $, rerender } = render(renderGrid(cursor))
      let container = $('.scroll-container')

      // 5 columns, with or without a scrollbar.
      fakeResizeObserver.resize(container, { width: '117px' })

      let top = (id) => $(`#item-${id}`).getBoundingClientRect().top

      return { $, container, rerender, top }
    }

    it('renders the expansion below the item\'s row', () => {
      let { $, top } = setup(1)

      expect($('#expansion').parentElement.previousElementSibling.id)
        .to.equal('item-5')
      expect(top(6) - top(1)).to.equal(64)
    })

    it('scrolls to items below the expansion', () => {
      let { container, rerender, top } = setup(1)

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
        cursor={new Cursor(tiles, cursor)}
        itemHeight={size}
        itemWidth={size}
        tabIndex={0}>
        {(item) => (
          <li key={item.id} id={`item-${item.id}`} style={{ height: size }}/>
        )}
      </Scroll>
    )

    let setup = (cursor, scrollTop, size = 20) => {
      let { $, rerender } = render(renderGrid(size, cursor))
      let container = $('.scroll-container')

      // 5 columns of 20px or 4 of 25px, with or without a scrollbar.
      fakeResizeObserver.resize(container, { width: '117px' })
      scroll(container, scrollTop)

      // The tile's center, relative to the viewport.
      let position = (id) => {
        let { top, bottom } = $(`#item-${id}`).getBoundingClientRect()
        return (top + bottom) / 2 - container.getBoundingClientRect().top
      }

      let zoom = (size) => rerender(renderGrid(size, cursor))

      return { position, zoom }
    }

    it('keeps the cursor in place', () => {
      let { position, zoom } = setup(53, 150)
      let before = position(53)

      zoom(25)
      expect(position(53)).to.be.closeTo(before, 1)
    })

    it('keeps the top row in place without a visible cursor', () => {
      let { position, zoom } = setup(1, 300)
      let before = position(76)

      zoom(25)
      expect(position(76)).to.be.closeTo(before, 1)
    })

    // Zooming out shortens the runway: the browser clamps
    // the scroll position before the view is anchored.
    it('keeps the top row in place when zooming out at the end', () => {
      let { position, zoom } = setup(1, 1100, 25)
      let before = position(177)

      zoom(20)
      expect(position(177)).to.be.closeTo(before, 1)
    })
  })
})
