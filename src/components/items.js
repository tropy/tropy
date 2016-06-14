'use strict'

const React = require('react')

const { Toolbar } = require('./toolbar')
const { Panels } = require('./panels')
const { Viewer } = require('./viewer')


const Items = () => (
  <div id="items">
    <Toolbar/>
  </div>
)


const Item = () => (
  <div id="item">
    <Panels/>
    <Viewer/>
  </div>
)


module.exports = {
  Items, Item
}
