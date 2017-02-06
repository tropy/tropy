'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { FormattedMessage } = require('react-intl')
const { Toolbar, ToolGroup } = require('../toolbar')
const { Slider } = require('../slider')
const { IconButton } = require('../button')
const { PhotoIterator } = require('./iterator')

const {
  IconPhoto, IconPlus, IconListSmall, IconGridSmall
} = require('../icons')


class PhotoToolbar extends PureComponent {

  handleCreate = () => this.props.onCreate()

  render() {
    const { hasCreateButton, zoom, maxZoom, onZoomChange } = this.props

    return (
      <Toolbar>
        <div className="toolbar-left">
          <IconPhoto/>
          <h4><FormattedMessage id="panel.photos"/></h4>
        </div>

        <div className="toolbar-right">
          {
            hasCreateButton &&
              <ToolGroup>
                <IconButton icon={<IconPlus/>} onClick={this.handleCreate}/>
              </ToolGroup>
          }
          <ToolGroup>
            <Slider
              value={zoom}
              max={maxZoom}
              size="sm"
              minIcon={<IconListSmall/>}
              maxIcon={<IconGridSmall/>}
              onChange={onZoomChange}/>
          </ToolGroup>
        </div>
      </Toolbar>
    )
  }


  static propTypes = {
    maxZoom: PropTypes.number.isRequired,
    zoom: PropTypes.number.isRequired,
    hasCreateButton: PropTypes.bool,
    onCreate: PropTypes.func,
    onZoomChange: PropTypes.func.isRequired
  }

  static defaultProps = {
    maxZoom: PhotoIterator.ZOOM.length - 1
  }
}

module.exports = {
  PhotoToolbar
}
