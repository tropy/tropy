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
const { getCachePrefix } = require('../../selectors/project')
const { getColumns } = require('../../selectors/ui')
const act = require('../../actions')

const Items = ({ onCreate, zoom, maxZoom, onZoomChange, ...props }) => (
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
            <IconButton icon={<IconPlus/>} onClick={onCreate}/>
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
  items: PropTypes.arrayOf(PropTypes.object),
  selection: PropTypes.arrayOf(PropTypes.number),
  columns: PropTypes.arrayOf(PropTypes.object),
  cache: PropTypes.string.isRequired,
  zoom: PropTypes.number,
  maxZoom: PropTypes.number,
  onCreate: PropTypes.func,
  onOpen: PropTypes.func,
  onSelect: PropTypes.func,
  onEditCancel: PropTypes.func,
  onColumnEdit: PropTypes.func,
  onContextMenu: PropTypes.func,
  onZoomChange: PropTypes.func,
}

Items.defaultProps = {
  maxZoom: ItemGrid.ZOOM.length - 1
}


module.exports = {
  Items: connect(
    (state) => ({
      columns: getColumns(state),
      items: getItems(state),
      selection: state.nav.items,
      cache: getCachePrefix(state),
      zoom: state.nav.itemsZoom
    }),

    (dispatch) => ({
      onCreate() {
        dispatch(act.item.create())
      },

      onOpen(item) {
        dispatch(act.item.open(item))
      },

      onSelect(id, mod) {
        dispatch(act.item.select(id, { mod }))
      },

      onZoomChange(itemsZoom) {
        dispatch(act.nav.update({ itemsZoom }))
      },

      onColumnEdit({ id, property }) {
        dispatch(act.ui.edit.start({
          column: {
            [id]: property
          }
        }))
      }
    })
  )(Items)
}
