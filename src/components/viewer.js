'use strict'

const React = require('react')
const { Toolbar } = require('./toolbar')

const Viewer = () => (
  <section id="viewer">
    <header>
      <Toolbar draggable={true}/>
    </header>
    Viewer
  </section>
)

module.exports = {
  Viewer
}
