'use strict'

const React = require('react')

const { Toolbar } = require('./toolbar')
const { Panels } = require('./panels')
const { Viewer } = require('./viewer')
const { Search } = require('./search')
const { Button } = require('./button')
const { IconPlus } = require('./icons')

const col1 = { width: '40%' }
const col2 = { width: '25%' }
const col3 = { width: '15%' }
const col4 = { width: '10%' }
const col5 = { width: '10%' }

const Items = () => (
  <section id="items" className="list-view">
    <header>
      <Toolbar>
        <div className="toolbar-left">
          <div className="tool-group">
            <Button classes={'btn btn-icon'}>
              <IconPlus/>
            </Button>
          </div>
        </div>
        <div className="toolbar-right">
          <Search/>
        </div>
      </Toolbar>
    </header>
    <div className="item-list-head-container">
      <ul className="item-list item-list-head">
        <li className="item-head">
          <div className="metadata-head" style={col1}>Title</div>
          <div className="metadata-head" style={col2}>Type</div>
          <div className="metadata-head" style={col3}>Date</div>
          <div className="metadata-head number ascending" style={col4}>Box</div>
          <div className="metadata-head number" style={col5}>Photos</div>
        </li>
      </ul>
    </div>
    <div className="item-list-container">
      <ul className="item-list">
        <li className="item">
          <div className="metadata" style={col1}>
            <img src={'dev/dummy-24.jpg'} srcSet={'dev/dummy-24-2x.jpg 2x'}
              width={24} height={24}/>
            Application Norman Bailey
          </div>
          <div className="metadata" style={col2}>Application Form</div>
          <div className="metadata" style={col3}>1897-07-26</div>
          <div className="metadata number" style={col4}>17</div>
          <div className="metadata number" style={col5}>2</div>
        </li>
        <li className="item">
          <div className="metadata">
            <img src={'dev/dummy-24.jpg'} srcSet={'dev/dummy-24-2x.jpg 2x'}
              width={24} height={24}/>
            Norman Bailey
          </div>
          <div className="metadata">Portrait</div>
          <div className="metadata">1844</div>
          <div className="metadata number">17</div>
          <div className="metadata number">1</div>
        </li>
        <li className="item">
          <div className="metadata">
            <img src={'dev/dummy-24.jpg'} srcSet={'dev/dummy-24-2x.jpg 2x'}
              width={24} height={24}/>
            Application H. F. Cary
          </div>
          <div className="metadata">Application Form</div>
          <div className="metadata">1899-10-24</div>
          <div className="metadata number">17</div>
          <div className="metadata number">2</div>
        </li>
        <li className="item">
          <div className="metadata">
            <img src={'dev/dummy-24.jpg'} srcSet={'dev/dummy-24-2x.jpg 2x'}
              width={24} height={24}/>
            Denver International Communication
          </div>
          <div className="metadata">Correspondence</div>
          <div className="metadata">1899-12-16</div>
          <div className="metadata number">17</div>
          <div className="metadata number">1</div>
        </li>
        <li className="item">
          <div className="metadata">
            <img src={'dev/dummy-24.jpg'} srcSet={'dev/dummy-24-2x.jpg 2x'}
              width={24} height={24}/>
            Frank Cary
          </div>
          <div className="metadata">Portrait</div>
          <div className="metadata">1868</div>
          <div className="metadata number">17</div>
          <div className="metadata number">1</div>
        </li>
        <li className="item active">
          <div className="metadata">
            <img src={'dev/dummy-24.jpg'} srcSet={'dev/dummy-24-2x.jpg 2x'}
              width={24} height={24}/>
            Denver to Chicago
          </div>
          <div className="metadata">Correspondence</div>
          <div className="metadata">1899-12-24</div>
          <div className="metadata number">27</div>
          <div className="metadata number">2</div>
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
