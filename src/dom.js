'use strict'

const dom =
module.exports = {

  $: document.querySelector.bind(document),
  $$: document.querySelectorAll.bind(document),

  ready: (fn) => {
    if (document.readyState !== 'loading') fn()
    else dom.once(document, 'DOMContentLoaded', fn)
  },

  css(text) {
    let node = document.createElement('style')

    node.type = 'text/css'
    node.textContent = text

    return node
  },

  stylesheet(url) {
    let node = document.createElement('link')

    node.rel = 'stylesheet'
    node.type = 'text/css'
    node.href = url

    return node
  },

  append(node, to) {
    return to.appendChild(node)
  },

  on(node, ...args) {
    return node.addEventListener(...args)
  },

  once(node, type, fn, capture) {
    function delegate(...args) {
      dom.off(node, type, delegate, capture)
      fn(...args)
    }

    return dom.on(node, type, delegate, capture)
  },

  off(node, ...args) {
    return node.removeEventListener(...args)
  }
}
