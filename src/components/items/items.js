'use strict'

const React = require('react')

const { PropTypes } = React
const { connect } = require('react-redux')
const { Toolbar } = require('../toolbar')
const { Search } = require('../search')
const { IconPlus } = require('../icons')
const { List } = require('./list')
const act = require('../../actions/item')

const Items = ({ createItem }) => (
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
    <List/>
  </section>
)

Items.propTypes = {
  createItem: PropTypes.func
}


module.exports = {
  Items: connect(
    () => ({}),

    dispatch => ({
      createItem: () => dispatch(act.create())
    })
  )(Items)
}
