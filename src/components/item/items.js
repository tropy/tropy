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
const { IconButton } = require('../button')
const { getItems } = require('../../selectors/items')
const act = require('../../actions')

const Items = ({ createItem, zoom, maxZoom, onZoomChange, ...props }) => (
  <section id="items">
    <header>
      <Toolbar draggable={ARGS.frameless}>
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
            <IconButton icon={<IconPlus/>} onClick={createItem}/>
          </div>
        </div>
        <div className="toolbar-right">
          <Search/>
        </div>
      </Toolbar>
    </header>
    {
      zoom ? <ItemGrid {...props} zoom={zoom}/> : <Table {...props}/>
    }
  </section>
)

Items.propTypes = {
  createItem: PropTypes.func,
  items: PropTypes.arrayOf(PropTypes.object),
  zoom: PropTypes.number,
  maxZoom: PropTypes.number,
  onZoomChange: PropTypes.func,
  onContextMenu: PropTypes.func
}

Items.defaultProps = {
  maxZoom: ItemGrid.ZOOM.length - 1
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
