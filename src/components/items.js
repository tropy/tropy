'use strict'

const React = require('react')

const { Toolbar } = require('./toolbar')
const { Panels } = require('./panels')
const { Viewer } = require('./viewer')

const col1 = { width: '40%' }
const col2 = { width: '25%' }
const col3 = { width: '15%' }
const col4 = { width: '10%' }
const col5 = { width: '10%' }

const Items = () => (
  <section id="items" className="list-view">
    <header>
      <Toolbar/>
    </header>
    <ul className="item-list item-list-head">
      <li className="item-head">
        <div className="metadata-head" style={col1}>Title</div>
        <div className="metadata-head" style={col2}>Type</div>
        <div className="metadata-head" style={col3}>Date</div>
        <div className="metadata-head" style={col4}>Box</div>
        <div className="metadata-head" style={col5}>Photos</div>
      </li>
    </ul>
    <div className="item-list-container">
      <ul className="item-list">
        <li className="item">
          <div className="metadata" style={col1}>Application Norman Bailey</div>
          <div className="metadata" style={col2}>Application Form</div>
          <div className="metadata" style={col3}>1897-07-26</div>
          <div className="metadata" style={col4}>17</div>
          <div className="metadata" style={col5}>2</div>
        </li>
        <li className="item">
          <div className="metadata">Norman Bailey</div>
          <div className="metadata">Portrait</div>
          <div className="metadata">1844</div>
          <div className="metadata">17</div>
          <div className="metadata">1</div>
        </li>
        <li className="item">
          <div className="metadata">Application H. F. Cary</div>
          <div className="metadata">Application Form</div>
          <div className="metadata">1899-10-24</div>
          <div className="metadata">17</div>
          <div className="metadata">2</div>
        </li>
        <li className="item">
          <div className="metadata">Denver International Communication</div>
          <div className="metadata">Correspondence</div>
          <div className="metadata">1899-12-16</div>
          <div className="metadata">17</div>
          <div className="metadata">1</div>
        </li>
        <li className="item">
          <div className="metadata">Frank Cary</div>
          <div className="metadata">Portrait</div>
          <div className="metadata">1868</div>
          <div className="metadata">17</div>
          <div className="metadata">1</div>
        </li>
        <li className="item active">
          <div className="metadata">Denver to Chicago</div>
          <div className="metadata">Correspondence</div>
          <div className="metadata">1899-12-24</div>
          <div className="metadata">27</div>
          <div className="metadata">2</div>
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
