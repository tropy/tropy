import { mock } from 'node:test'
import { act } from '@testing-library/react'

// Fakes ResizeObserver to report sizes right away:
// on `observe` and on `resize`.

let observers = new Set()
let property

class ResizeObserver {
  #callback
  #nodes = new Set()

  constructor (callback) {
    this.#callback = callback
  }

  observe (node) {
    this.#nodes.add(node)
    observers.add(this)
    this.report([node])
  }

  unobserve (node) {
    this.#nodes.delete(node)
  }

  disconnect () {
    this.#nodes.clear()
    observers.delete(this)
  }

  report (nodes = this.#nodes) {
    let entries = Array.from(nodes, (target) => ({
      target,
      contentRect: {
        width: target.clientWidth,
        height: target.clientHeight
      }
    }))

    if (entries.length > 0)
      this.#callback(entries, this)
  }
}

export const fakeResizeObserver = {
  enable () {
    property = mock.property(window, 'ResizeObserver', ResizeObserver)
  },

  // Applies the styles to the node and reports all observed nodes.
  resize (node, styles) {
    Object.assign(node.style, styles)
    act(() => {
      for (let observer of observers) observer.report()
    })
  },

  reset () {
    property?.mock.restore()
    property = null
    observers.clear()
  }
}

// Scroll events arrive with the next frame: dispatch them right away.
export function scroll (node, top) {
  node.scrollTop = top
  node.dispatchEvent(new Event('scroll'))
}
