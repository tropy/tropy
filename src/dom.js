import { blank, once as when } from './common/util'

const everything = () => true

export function $(selectors, node = document) {
  return node.querySelector(selectors)
}

export function $$(selectors, node = document) {
  return node.querySelectorAll(selectors)
}

export const ready = (document.readyState !== 'loading') ?
  Promise.resolve() :
  when(document, 'DOMContentLoaded').then(() => {})

export const element = document.createElement.bind(document)

export function create(tag, attributes = {}) {
  return attrs(element(tag), attributes)
}

export function attr(node, name, value) {
  if (arguments.length === 2) return node.getAttribute(name)

  return (value == null) ?
    node.removeAttribute(name) : node.setAttribute(name, value)
}

export function attrs(node, attributes) {
  for (let name in attributes) {
    node.setAttribute(name, attributes[name])
  }

  return node
}

export function html(node, value) {
  return (arguments.length > 1) ?
    (node.innerHTML = value) : node.innerHTML.trim()
}

export function text(node, value) {
  return (arguments.length > 1) ?
    (node.textContent = value) : node.textContent.trim()
}

export function css(textContent) {
  return Object.assign(element('style'), {
    type: 'text/css',
    textContent
  })
}

export function stylesheet(href) {
  return Object.assign(element('link'), {
    rel: 'stylesheet',
    type: 'text/css',
    href
  })
}

export function append(node, to) {
  return to.appendChild(node)
}

export function remove(node) {
  return node.parentNode.removeChild(node)
}

export function on(node, ...args) {
  return node.addEventListener(...args)
}

export function once(node, type, fn, capture = false) {
  return node.addEventListener(type, fn, { capture, once: true })
}

export function off(node, ...args) {
  return node.removeEventListener(...args)
}

export function ensure(node, type, fn, maxWait = 5000, match = everything) {
  const cancel = () => {
    clearTimeout(timeout)
    node.removeEventListener(type, check)
  }

  const done = (...args) => (cancel(), fn(...args))
  const check = (event) => match(event) && done(event)

  const timeout = setTimeout(done, maxWait)
  node.addEventListener(type, check)

  return cancel
}

export function emit(node, type, data = {}) {
  if (data.detail != null) {
    return node.dispatchEvent(new CustomEvent(type, data))
  } else {
    return node.dispatchEvent(new Event(type, data))
  }
}

export function classes(node, ...args) {
  return node.classList.add(...args)
}

export function toggle(node, ...args) {
  return node.classList.toggle(...args)
}

export function has(node, name) {
  return node.classList.contains(name)
}

export function bounds(node) {
  return node.getBoundingClientRect()
}

export function scrollLeftMax(node) {
  return node.scrollWidth - node.clientWidth
}

export function maxScrollLeft(node) {
  return node.scrollLeft >= scrollLeftMax(node)
}

export function style(node) {
  return getComputedStyle(node)
}

export function borders(node) {
  let s = style(node)

  return {
    top: parseInt(s.borderTopWidth, 10),
    right: parseInt(s.borderRightWidth, 10),
    bottom: parseInt(s.borderBottomWidth, 10),
    left: parseInt(s.borderLeftWidth, 10)
  }
}

export function hasFocus(node) {
  return document.activeElement === node
}

export function testFocusChange() {
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
}

export function reflow(node) {
  node.scrollTop
}

export function isInput(node) {
  return node.tagName === 'INPUT'
}

export function isLiveInput(node) {
  return isInput(node) && !(node.disabled || node.readOnly)
}

export function isLink(node) {
  return node.tagName === 'A' && !blank(node.href)
}

export function createDragHandler({
  handleDrag,
  handleDragStop,
  stopOnMouseLeave
}) {
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
    on(document, 'mousemove', onDrag)
    on(document, 'mouseup', onDragStop, { capture: true })
    on(window, 'blur', onDragStop)

    if (stopOnMouseLeave) {
      on(document.body, 'mouseleave', onDragStop)
    }

    // Register on body because global bindings are bound
    // on document and we need to stop the propagation in
    // case we handle it here!
    on(document.body, 'keydown', onKeyDown)
  }

  function onDragStop(event) {
    off(document, 'mousemove', onDrag)
    off(document, 'mouseup', onDragStop, { capture: true })
    off(window, 'blur', onDragStop)

    if (stopOnMouseLeave) {
      off(document.body, 'mouseleave', onDragStop)
    }

    off(document.body, 'keydown', onKeyDown)

    handleDragStop(event, event == null || event.type !== 'mouseup')
  }

  return {
    start: onDragStart,
    stop: onDragStop
  }
}

export function parse(string, type = 'text/html') {
  let p = new DOMParser()
  let doc = p.parseFromString(string, type)

  if (doc.documentElement.nodeName === 'parsererror') {
    throw new Error(doc.documentElement.textContent)
  }

  return doc
}

export function viewport() {
  return {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight
  }
}

export function visible(node) {
  let offset = node.offsetTop - node.offsetParent.scrollTop
  return offset > 0 && offset < node.offsetParent.offsetHeight
}

export function loadImage(src, decode = false) {
  return new Promise((resolve, reject) => {
    let img = new Image()

    if (decode)
      img.decode().then(() => resolve(img), reject)
    else
      img.onload = () => resolve(img)

    img.onerror = reject
    img.src = src
  })
}

export function load(node, message = 'Load Error') {
  return new Promise((resolve, reject) => {
    node.onload = () => resolve(node)
    node.onerror = () => reject(new Error(message))
  })
}
