'use strict';

module.exports = {

  css(text) {
    let node = document.createElement('style');

    node.type = 'text/css';
    node.textContent = text;

    return node;
  },

  append(node, to) {
    return to.appendChild(node);
  }

};
