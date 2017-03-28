'use strict'

const React = require('react')
const { Toolbar } = require('../toolbar')
const { IconPlus, IconList, IconGrid } = require('../icons')
const { Slider } = require('../slider')
const { SearchField } = require('../search')
const { IconButton } = require('../button')
const { bool, func, number } = React.PropTypes

const ProjectToolbar = ({
  canCreateItems,
  isDisabled,
  isEmpty,
  zoom,
  maxZoom,
  onZoomChange,
  onItemCreate,
  ...props
}) => (
  <Toolbar {...props}>
    <div className="toolbar-left">
      <div className="tool-group">
        <Slider
          value={zoom}
          max={maxZoom}
          isDisabled={isEmpty || isDisabled}
          onChange={onZoomChange}
          minIcon={<IconList/>}
          maxIcon={<IconGrid/>}/>
      </div>
      <div className="tool-group">
        {canCreateItems && !isDisabled &&
          <IconButton icon={<IconPlus/>} onClick={onItemCreate}/>}
      </div>
    </div>
    <div className="toolbar-right">
      <SearchField isDisabled={isDisabled}/>
    </div>
  </Toolbar>
)

ProjectToolbar.propTypes = {
  canCreateItems: bool,
  isDraggable: bool,
  isDisabled: bool,
  isEmpty: bool,
  maxZoom: number.isRequired,
  zoom: number.isRequired,
  onDoubleClick: func,
  onItemCreate: func.isRequired,
  onZoomChange: func.isRequired
}

ProjectToolbar.defaultProps = {
  isDraggable: ARGS.frameless
}

module.exports = {
  ProjectToolbar
}
