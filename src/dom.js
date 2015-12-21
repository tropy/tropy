'use strict'

module.exports = {

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
  }

}
