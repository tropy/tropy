'use strict'

const React = require('react')

const { Toolbar } = require('./toolbar')
const { PanelGroup } = require('./panelgroup')
const { Viewer } = require('./viewer')
const { Search } = require('./search')
const { Button } = require('./button')
const { IconPlus } = require('./icons')
const { ItemList } = require('./item-list')

const Items = () => (
  <section id="items" className="list-view">
    <header>
      <Toolbar draggable>
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
    <ItemList/>
    <Item/>
  </section>
)

const Item = () => (
  <section id="item">
    <PanelGroup/>
    <Viewer/>
  </section>
)


module.exports = {
  Items, Item
}
