'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { Toolbar } = require('../toolbar')
const { Search } = require('../search')
const { IconPlus, IconList, IconGrid } = require('../icons')
const { ItemTable } = require('./table')
const { ItemGrid } = require('./grid')
const { Slider } = require('../slider')
const { IconButton } = require('../button')
const { getItems } = require('../../selectors/items')
const { getColumns } = require('../../selectors/ui')
const act = require('../../actions')

const Items = ({ onCreate, zoom, maxZoom, onZoomChange, ...props }) => (
  <section id="items">
    <header>
      <Toolbar {...props} draggable={ARGS.frameless}>
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
      zoom ? <ItemGrid {...props} zoom={zoom}/> : <ItemTable {...props}/>
    }
  </section>
)

Items.propTypes = {
  editing: PropTypes.object,
  items: PropTypes.arrayOf(PropTypes.object),
  selection: PropTypes.arrayOf(PropTypes.number),
  columns: PropTypes.arrayOf(PropTypes.object),
  zoom: PropTypes.number,
  nav: PropTypes.object,
  maxZoom: PropTypes.number,
  onMaximize: PropTypes.func,
  onCreate: PropTypes.func,
  onOpen: PropTypes.func,
  onSelect: PropTypes.func,
  onEditCancel: PropTypes.func,
  onColumnChange: PropTypes.func,
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
      editing: state.ui.edit,
      columns: getColumns(state),
      items: getItems(state),
      selection: state.nav.items
    }),

    (dispatch) => ({
      onCreate() {
        dispatch(act.item.create())
      },

      onSelect(id, mod) {
        dispatch(act.item.select(id, { mod }))
      },

      onZoomChange(itemsZoom) {
        dispatch(act.nav.update({ itemsZoom }))
      },

      onColumnChange({ id, data }) {
        dispatch(act.metadata.save({ id, data }))
        dispatch(act.ui.edit.cancel())
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
