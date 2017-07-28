'use strict'

const React = require('react')
const { PureComponent } = React
const { Toolbar, ToolbarLeft, ToolGroup } = require('../toolbar')
const { IconButton } = require('../button')
const { bool, func } = require('prop-types')

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
    this.props.onRotate(-90)
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
              icon={<IconMinusCircle/>}/>
            <IconButton
              icon={<IconPlusCircle/>}/>
            <IconButton
              icon={<IconFit/>}/>
          </ToolGroup>
        </ToolbarLeft>
      </Toolbar>
    )
  }

  static propTypes = {
    isDisabled: bool.isRequired,
    onRotate: func.isRequired
  }
}

module.exports = {
  EsperToolbar
}
