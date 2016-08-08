'use strict'

const React = require('react')

const { Toolbar } = require('./toolbar')
const { Panels } = require('./panels')
const { Viewer } = require('./viewer')


const Items = () => (
  <section id="items" className="list-view">
    <header>
      <Toolbar/>
    </header>
    <ul className="item-list-header">
      <li className="item-list-header-row">
        <div className="title">Title</div>
        <div className="type">Type</div>
        <div className="date">Date</div>
        <div className="box">Box</div>
        <div className="photos"></div>
      </li>
    </ul>
    <div className="item-list-container">
      <ul className="item-list">
        <li className="item">
          <div className="title">Title</div>
          <div className="type">Type</div>
          <div className="date">Date</div>
          <div className="box">Box</div>
          <div className="photos"></div>
        </li>
      </ul>
    </div>
    <Item/>
  </section>
)


const Item = () => (
  <section id="item">
    <Panels/>
    <Viewer/>
  </section>
)


module.exports = {
  Items, Item
}
