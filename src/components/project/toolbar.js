'use strict'

const React = require('react')
const { Toolbar } = require('../toolbar')
const { IconPlus, IconList, IconGrid } = require('../icons')
const { ItemGrid } = require('../item')
const { Slider } = require('../slider')
const { SearchField } = require('../search')
const { IconButton } = require('../button')
const { bool, func, number } = React.PropTypes


const ProjectToolbar = (props) => (
  <Toolbar onMaximize={props.onMaximize} draggable={props.isDraggable}>
    <div className="toolbar-left">
      <div className="tool-group">
        <Slider
          value={props.zoom}
          max={props.maxZoom}
          onChange={props.onZoomChange}
          minIcon={<IconList/>}
          maxIcon={<IconGrid/>}/>
      </div>
      <div className="tool-group">
        <IconButton icon={<IconPlus/>} onClick={props.onItemCreate}/>
      </div>
    </div>
    <div className="toolbar-right">
      <SearchField/>
    </div>
  </Toolbar>
)

ProjectToolbar.propTypes = {
  isDraggable: bool,
  zoom: number.isRequired,
  maxZoom: number.isRequired,
  onItemCreate: func.isRequired,
  onMaximize: func.isRequired,
  onZoomChange: func.isRequired
}

ProjectToolbar.defaultProps = {
  maxZoom: ItemGrid.ZOOM.length - 1,
  isDraggable: ARGS.frameless
}

module.exports = {
  ProjectToolbar
}
