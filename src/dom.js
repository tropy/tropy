'use strict'

const { assign } = Object
const { once } = require('./common/util')

const dom = module.exports = {

  $: document.querySelector.bind(document),

  $$: document.querySelectorAll.bind(document),

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

  once(node, type, fn, capture) {
    function delegate(...args) {
      dom.off(node, type, delegate, capture)
      fn(...args)
    }

    return dom.on(node, type, delegate, capture)
  },

  off(node, ...args) {
    return node.removeEventListener(...args)
  },

  emit(node, ...args) {
    return node.dispatchEvent(new Event(...args))
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
  }
}
