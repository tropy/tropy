'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { Toolbar } = require('../toolbar')
const { Search } = require('../search')
const { IconPlus, IconList, IconGrid } = require('../icons')
const { Table } = require('./table')
const { ItemGrid } = require('./grid')
const { Slider } = require('../slider')
const { getItems } = require('../../selectors/items')
const act = require('../../actions')

const Items = ({ createItem, items, zoom, maxZoom, onZoomChange }) => (
  <section id="items">
    <header>
      <Toolbar draggable>
        <div className="toolbar-left">
          <div className="tool-group">
            <Slider
              value={zoom}
              max={maxZoom}
              onChange={onZoomChange}
              minIcon={<IconList/>}
              maxIcon={<IconGrid/>}/>
          </div>
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
    {zoom ? <ItemGrid items={items} zoom={zoom}/> : <Table items={items}/>}
  </section>
)

Items.propTypes = {
  createItem: PropTypes.func,
  items: PropTypes.arrayOf(PropTypes.object),
  zoom: PropTypes.number,
  maxZoom: PropTypes.number,
  onZoomChange: PropTypes.func
}

Items.defaultProps = {
  maxZoom: 8
}


module.exports = {
  Items: connect(
    (state) => ({
      items: getItems(state),
      zoom: state.nav.itemsZoom
    }),

    (dispatch) => ({
      createItem() {
        dispatch(act.item.create())
      },

      onZoomChange(itemsZoom) {
        dispatch(act.nav.update({ itemsZoom }))
      }
    })
  )(Items)
}
