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
    once(document, 'DOMContentLoaded').then(() => {}),

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

  emit(node, type, data = {}) {
    if (data.detail != null) {
      return node.dispatchEvent(new CustomEvent(type, data))
    } else {
      return node.dispatchEvent(new Event(type, data))
    }
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

  isLiveInput(node) {
    return dom.isInput(node) && !(node.disabled || node.readOnly)
  },

  isLink(node) {
    return node.tagName === 'A' && !blank(node.href)
  },

  createDragHandler({ handleDrag, handleDragStop, stopOnMouseLeave }) {
    function onKeyDown(event) {
      switch (event.key) {
        case 'Escape':
          event.stopPropagation()
          onDragStop(event)
          break
      }
    }

    function onDrag(event) {
      if (event.buttons === 0) {
        onDragStop(event)
      } else {
        handleDrag(event)
      }
    }

    function onDragStart() {
      dom.on(document, 'mousemove', onDrag)
      dom.on(document, 'mouseup', onDragStop, { capture: true })
      dom.on(window, 'blur', onDragStop)

      if (stopOnMouseLeave) {
        dom.on(document.body, 'mouseleave', onDragStop)
      }

      // Register on body because global bindings are bound
      // on document and we need to stop the propagation in
      // case we handle it here!
      dom.on(document.body, 'keydown', onKeyDown)
    }

    function onDragStop(event) {
      dom.off(document, 'mousemove', onDrag)
      dom.off(document, 'mouseup', onDragStop, { capture: true })
      dom.off(window, 'blur', onDragStop)

      if (stopOnMouseLeave) {
        dom.off(document.body, 'mouseleave', onDragStop)
      }

      dom.off(document.body, 'keydown', onKeyDown)

      handleDragStop(event, event == null || event.type !== 'mouseup')
    }

    return {
      start: onDragStart,
      stop: onDragStop
    }
  },

  parse(string, type = 'text/html') {
    let p = new DOMParser()
    let doc = p.parseFromString(string, type)

    if (doc.documentElement.nodeName === 'parsererror') {
      throw new Error(doc.documentElement.textContent)
    }

    return doc
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
  },

  encodeFileURL(url) {
    return url.replace(/[#?&]/g, (m) => {
      switch (m) {
        case '#': return '%23'
        case '?': return '%3F'
        case '&': return '%26'
      }
    })
  },

  loadImage(src) {
    return new Promise((resolve, reject) => {
      let img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  },

  load(node, message = 'Load Error') {
    return new Promise((resolve, reject) => {
      node.onload = () => resolve(node)
      node.onerror = () => reject(new Error(message))
    })
  }
}

module.exports = dom
