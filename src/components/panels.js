'use strict'

const React = require('react')
const { Toolbar } = require('./toolbar')

const Panels = () => (
  <div id="panels">
    <header>
      <Toolbar/>
    </header>
    Panels
  </div>
)

module.exports = {
  Panels
}
