'use strict'

const React = require('react')
const { PureComponent } = React
const { Toolbar, ToolbarLeft, ToolGroup } = require('../toolbar')
const { IconButton } = require('../button')

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

// eslint-disable-next-line react/prefer-stateless-function
class EsperToolbar extends PureComponent {
  render() {
    return (
      <Toolbar>
        <ToolbarLeft>
          <ToolGroup>
            <IconButton icon={<IconArrow/>}/>
            <IconButton icon={<IconSelection/>}/>
          </ToolGroup>
          <ToolGroup>
            <IconButton icon={<IconRotate/>}/>
            <IconButton icon={<IconNut/>}/>
          </ToolGroup>
          <ToolGroup>
            <IconButton icon={<IconHand/>}/>
            <IconButton icon={<IconMinusCircle/>}/>
            <IconButton icon={<IconPlusCircle/>}/>
            <IconButton icon={<IconFit/>}/>
          </ToolGroup>
        </ToolbarLeft>
      </Toolbar>
    )
  }
}

module.exports = {
  EsperToolbar
}
