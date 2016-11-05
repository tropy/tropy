'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { Toolbar } = require('../toolbar')
const { Search } = require('../search')
const { IconPlus } = require('../icons')
const { List } = require('./list')
const { getItems } = require('../../selectors/items')
const act = require('../../actions/item')

const Items = ({ createItem, items }) => (
  <section id="items">
    <header>
      <Toolbar draggable>
        <div className="toolbar-left">
          <div className="tool-group">
            <button className="btn btn-icon" onClick={createItem}>
              <IconPlus/>
            </button>
          </div>
        </div>
        <div className="toolbar-right">
          <Search/>
        </div>
      </Toolbar>
    </header>
    <List items={items}/>
  </section>
)

Items.propTypes = {
  createItem: PropTypes.func,
  items: PropTypes.arrayOf(PropTypes.object)
}


module.exports = {
  Items: connect(
    (state) => ({
      items: getItems(state)
    }),

    (dispatch) => ({
      createItem: () => dispatch(act.create())
    })
  )(Items)
}
