'use strict'

const { assign } = Object
const { blank, once } = require('./common/util')
const everything = () => true

const dom = {
  $(selectors, node = document) {
    return node.querySelector(selectors)
  },

  $$(selectors, node = document) {
    return node.querySelectorAll(selectors)
  },

  ready: (document.readyState !== 'loading') ?
    Promise.resolve() :
    once(document, 'DOMContentLoaded'),

  element: document.createElement.bind(document),

  create(tag, attr = {}) {
    return dom.attrs(dom.element(tag), attr)
  },

  attr(node, name, value) {
    if (arguments.length === 2) return node.getAttribute(name)

    return (value == null) ?
      node.removeAttribute(name) : node.setAttribute(name, value)
  },

  attrs(node, attributes) {
    for (let name in attributes) {
      node.setAttribute(name, attributes[name])
    }

    return node
  },

  html(node, html) {
    return (arguments.length > 1) ?
      (node.innerHTML = html) : node.innerHTML.trim()
  },

  text(node, text) {
    return (arguments.length > 1) ?
      (node.textContent = text) : node.textContent.trim()
  },

  css(text) {
    return assign(dom.element('style'), {
      type: 'text/css', textContent: text
    })
  },

  stylesheet(href) {
    return assign(dom.element('link'), {
      rel: 'stylesheet', type: 'text/css', href
    })
  },

  append(node, to) {
    return to.appendChild(node)
  },

  remove(node) {
    return node.parentNode.removeChild(node)
  },

  on(node, ...args) {
    return node.addEventListener(...args)
  },

  once(node, type, fn, capture = false) {
    return node.addEventListener(type, fn, { capture, once: true })
  },

  off(node, ...args) {
    return node.removeEventListener(...args)
  },

  ensure(node, type, fn, maxWait = 5000, match = everything) {
    const cancel = () => {
      clearTimeout(timeout)
      node.removeEventListener(type, check)
    }

    const done = (...args) => (cancel(), fn(...args))
    const check = (event) => match(event) && done(event)

    const timeout = setTimeout(done, maxWait)
    node.addEventListener(type, check)

    return cancel
  },

  emit(node, ...args) {
    return node.dispatchEvent(new Event(...args))
  },

  classes(node, ...args) {
    return node.classList.add(...args)
  },

  toggle(node, ...args) {
    return node.classList.toggle(...args)
  },

  has(node, name) {
    return node.classList.contains(name)
  },

  bounds(node) {
    return node.getBoundingClientRect()
  },

  scrollLeftMax(node) {
    return node.scrollWidth - node.clientWidth
  },

  maxScrollLeft(node) {
    return node.scrollLeft >= dom.scrollLeftMax(node)
  },

  style(node) {
    return getComputedStyle(node)
  },

  borders(node) {
    const style = dom.style(node)

    return {
      top: parseInt(style.borderTopWidth, 10),
      right: parseInt(style.borderRightWidth, 10),
      bottom: parseInt(style.borderBottomWidth, 10),
      left: parseInt(style.borderLeftWidth, 10)
    }
  },

  hasFocus(node) {
    return document.activeElement === node
  },

  testFocusChange() {
    let wasActiveElement = document.activeElement
    let t = setTimeout(() => { wasActiveElement = null }, 500)

    return () => {
      try {
        return wasActiveElement !== document.activeElement
      } finally {
        clearTimeout(t)
        wasActiveElement = null
      }
    }
  },

  reflow(node) {
    node.scrollTop
  },

  isInput(node) {
    return node.tagName === 'INPUT'
  },

  isLink(node) {
    return node.tagName === 'A' && !blank(node.href)
  },

  createDragHandler({ handleDrag, handleDragStop }) {
    function onKeyDown(event) {
      switch (event.key) {
        case 'Escape':
          event.stopPropagation()
          onDragStop(event)
          break
      }
    }

    function onDragStart() {
      dom.on(document, 'mousemove', handleDrag)
      dom.on(document, 'mouseup', onDragStop, { capture: true })
      dom.on(document, 'mouseleave', onDragStop)
      dom.on(window, 'blur', onDragStop)

      // Register on body because global bindings are bound
      // on document and we need to stop the propagation in
      // case we handle it here!
      dom.on(document.body, 'keydown', onKeyDown)
    }

    function onDragStop(event) {
      dom.off(document, 'mousemove', handleDrag)
      dom.off(document, 'mouseup', onDragStop, { capture: true })
      dom.off(document, 'mouseleave', onDragStop)
      dom.off(window, 'blur', onDragStop)
      dom.off(document.body, 'keydown', onKeyDown)

      handleDragStop(event, event == null || event.type !== 'mouseup')
    }

    return {
      start: onDragStart,
      stop: onDragStop
    }
  },

  viewport() {
    return {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight
    }
  },

  visible(node) {
    let offset = node.offsetTop - node.offsetParent.scrollTop
    return offset > 0 && offset < node.offsetParent.offsetHeight
  }
}

module.exports = dom
