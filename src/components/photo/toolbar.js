'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { FormattedMessage } = require('react-intl')
const { Toolbar, ToolGroup } = require('../toolbar')
const { Slider } = require('../slider')
const { IconButton } = require('../button')
const { number, bool, func } = PropTypes

const {
  IconPhoto, IconPlus, IconListSmall, IconGridSmall
} = require('../icons')


class PhotoToolbar extends PureComponent {
  render() {
    const {
      hasCreateButton,
      isDisabled,
      zoom,
      maxZoom,
      onCreate,
      onZoomChange
    } = this.props

    return (
      <Toolbar isDraggable={false}>
        <div className="toolbar-left">
          <IconPhoto/>
          <h4><FormattedMessage id="panel.photos"/></h4>
        </div>

        <div className="toolbar-right">
          {
            hasCreateButton &&
              <ToolGroup>
                <IconButton icon={<IconPlus/>} onClick={onCreate}/>
              </ToolGroup>
          }
          <ToolGroup>
            <Slider
              value={zoom}
              max={maxZoom}
              size="sm"
              minIcon={<IconListSmall/>}
              maxIcon={<IconGridSmall/>}
              isDisabled={isDisabled}
              onChange={onZoomChange}/>
          </ToolGroup>
        </div>
      </Toolbar>
    )
  }


  static propTypes = {
    hasCreateButton: bool,
    isDisabled: bool,
    maxZoom: number.isRequired,
    zoom: number.isRequired,
    onCreate: func.isRequired,
    onZoomChange: func.isRequired
  }
}

module.exports = {
  PhotoToolbar
}
