'use strict'

const React = require('react')
const { PureComponent } = React
const { Toolbar, ToolbarLeft, ToolGroup } = require('../toolbar')
const { IconButton } = require('../button')
const { bool, func, number } = require('prop-types')

const {
  IconArrow,
  IconSelection,
  IconRotate,
  IconNut,
  IconHand,
  IconMinusCircle,
  IconPlusCircle,
  IconFit
} = require('../icons')

class EsperToolbar extends PureComponent {
  handleRotate = () => {
    this.props.onRotationChange(-90)
  }

  handleZoomIn = () => {
    this.props.onZoomChange(this.props.zoom + 0.1)
  }

  handleZoomOut = () => {
    this.props.onZoomChange(this.props.zoom - 0.1)
  }

  render() {
    return (
      <Toolbar>
        <ToolbarLeft>
          <ToolGroup>
            <IconButton
              icon={<IconArrow/>}
              isDisabled={this.props.isDisabled}/>
            <IconButton
              icon={<IconSelection/>}
              isDisabled={this.props.isDisabled}/>
          </ToolGroup>
          <ToolGroup>
            <IconButton
              icon={<IconRotate/>}
              isDisabled={this.props.isDisabled}
              onClick={this.handleRotate}/>
            <IconButton
              icon={<IconNut/>}
              isDisabled={this.props.isDisabled}/>
          </ToolGroup>
          <ToolGroup>
            <IconButton
              icon={<IconHand/>}/>
            <IconButton
              icon={<IconMinusCircle/>}
              isDisabled={this.props.isDisabled}
              onClick={this.handleZoomOut}/>
            <IconButton
              icon={<IconPlusCircle/>}
              isDisabled={this.props.isDisabled}
              onClick={this.handleZoomIn}/>
            <IconButton
              icon={<IconFit/>}
              isDisabled={this.props.isDisabled}
              isActive={this.props.isAutoZoomActive}
              onClick={this.props.onZoomToggle}/>
          </ToolGroup>
        </ToolbarLeft>
      </Toolbar>
    )
  }

  static propTypes = {
    isDisabled: bool.isRequired,
    isAutoZoomActive: bool.isRequired,
    zoom: number.isRequired,
    onRotationChange: func.isRequired,
    onZoomChange: func.isRequired,
    onZoomToggle: func.isRequired
  }
}

module.exports = {
  EsperToolbar
}
