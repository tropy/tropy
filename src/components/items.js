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
        <div className="title" style={{width: '40%'}}>Title</div>
        <div className="type" style={{width: '25%'}}>Type</div>
        <div className="date" style={{width: '15%'}}>Date</div>
        <div className="box" style={{width: '10%'}}>Box</div>
        <div className="photos" style={{width: '10%'}}>Photos</div>
      </li>
    </ul>
    <div className="item-list-container">
      <ul className="item-list">
        <li className="item">
          <div className="title" style={{width: '40%'}}>Application Norman Bailey</div>
          <div className="type" style={{width: '25%'}}>Application Form</div>
          <div className="date" style={{width: '15%'}}>1897-07-26</div>
          <div className="box" style={{width: '10%'}}>17</div>
          <div className="photos" style={{width: '10%'}}>2</div>
        </li>
        <li className="item">
          <div className="title">Norman Bailey</div>
          <div className="type">Portrait</div>
          <div className="date">1844</div>
          <div className="box">17</div>
          <div className="photos">1</div>
        </li>
        <li className="item">
          <div className="title">Application H. F. Cary</div>
          <div className="type">Application Form</div>
          <div className="date">1899-10-24</div>
          <div className="box">17</div>
          <div className="photos">2</div>
        </li>
        <li className="item">
          <div className="title">Denver International Communication</div>
          <div className="type">Correspondence</div>
          <div className="date">1899-12-16</div>
          <div className="box">17</div>
          <div className="photos">1</div>
        </li>
        <li className="item">
          <div className="title">Frank Cary</div>
          <div className="type">Portrait</div>
          <div className="date">1868</div>
          <div className="box">17</div>
          <div className="photos">1</div>
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
