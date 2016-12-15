'use strict'

const React = require('react')
const { Toolbar } = require('../toolbar')

const Image = () => (
  <section id="image">
    <header>
      <Toolbar draggable={ARGS.frameless}/>
    </header>
  </section>
)

module.exports = {
  Image
}
