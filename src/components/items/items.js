'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { Toolbar } = require('../toolbar')
const { Search } = require('../search')
const { IconPlus } = require('../icons')
const { List } = require('./list')
const { Grid } = require('./grid')
const { Slider } = require('../slider')
const { getItems } = require('../../selectors/items')
const act = require('../../actions')

const Items = ({ createItem, items, zoom, handleZoomChange }) => (
  <section id="items">
    <header>
      <Toolbar draggable>
        <div className="toolbar-left">
          <div className="tool-group">
            <button className="btn btn-icon" onClick={createItem}>
              <IconPlus/>
            </button>
            <Slider
              value={zoom}
              onChange={handleZoomChange}
              minIcon={<IconPlus/>}
              maxIcon={<IconPlus/>}/>
          </div>
        </div>
        <div className="toolbar-right">
          <Search/>
        </div>
      </Toolbar>
    </header>
    {zoom ? <Grid items={items}/> : <List items={items}/>}
  </section>
)

Items.propTypes = {
  createItem: PropTypes.func,
  items: PropTypes.arrayOf(PropTypes.object),
  zoom: PropTypes.number,
  handleZoomChange: PropTypes.func
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

      handleZoomChange(itemsZoom) {
        dispatch(act.nav.update({ itemsZoom }))
      }
    })
  )(Items)
}
