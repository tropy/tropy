'use strict'

const React = require('react')
const { PureComponent } = React
const PropTypes = require('prop-types')
const { FormattedMessage } = require('react-intl')
const { Toolbar, ToolGroup } = require('../toolbar')
const { Slider } = require('../slider')
const { Button } = require('../button')
const { number, bool, func } = PropTypes

const {
  IconPhoto, IconPlus, IconListSmall, IconGridSmall
} = require('../icons')


class PhotoToolbar extends PureComponent {
  handleCreate = () => {
    this.props.onCreate()
  }

  render() {
    const {
      hasCreateButton,
      isDisabled,
      photos,
      zoom,
      maxZoom,
      onZoomChange
    } = this.props

    return (
      <Toolbar isDraggable={false}>
        <div className="toolbar-left">
          <IconPhoto/>
          <h4>
            <FormattedMessage
              id="panel.photo.title"
              values={{ count: photos }}/>
          </h4>
        </div>

        <div className="toolbar-right">
          {
            hasCreateButton &&
              <ToolGroup>
                <Button
                  icon={<IconPlus/>}
                  isDisabled={!this.props.canCreate}
                  title="panel.photo.create"
                  onClick={this.handleCreate}/>
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
    canCreate: bool,
    hasCreateButton: bool,
    isDisabled: bool,
    maxZoom: number.isRequired,
    photos: number.isRequired,
    zoom: number.isRequired,
    onCreate: func.isRequired,
    onZoomChange: func.isRequired
  }
}

module.exports = {
  PhotoToolbar
}
