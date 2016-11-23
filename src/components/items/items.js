'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { Toolbar } = require('../toolbar')
const { Search } = require('../search')
const { IconPlus, IconList, IconGrid } = require('../icons')
const { List } = require('./list')
const { Grid } = require('./grid')
const { Slider } = require('../slider')
const { getItems } = require('../../selectors/items')
const act = require('../../actions')

const Items = ({ createItem, items, zoom, maxZoom, handleZoomChange }) => (
  <section id="items">
    <header>
      <Toolbar draggable>
        <div className="toolbar-left">
          <div className="tool-group">
            <Slider
              value={zoom}
              max={maxZoom}
              onChange={handleZoomChange}
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
    {zoom ? <Grid items={items}/> : <List items={items}/>}
  </section>
)

Items.propTypes = {
  createItem: PropTypes.func,
  items: PropTypes.arrayOf(PropTypes.object),
  zoom: PropTypes.number,
  maxZoom: PropTypes.number,
  handleZoomChange: PropTypes.func
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

      handleZoomChange(itemsZoom) {
        dispatch(act.nav.update({ itemsZoom }))
      }
    })
  )(Items)
}
