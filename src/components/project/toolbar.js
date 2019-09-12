'use strict'

const React = require('react')
const { WindowContext } = require('../main')
const { FormattedMessage } = require('react-intl')
const { bool, func, number, string } = require('prop-types')
const { Titlebar, Toolbar, ToolGroup } = require('../toolbar')
const { Slider } = require('../slider')
const { SearchField } = require('../search')
const { Button } = require('../button')

const {
  IconPlus,
  IconList,
  IconGrid
} = require('../icons')

const ProjectToolbar = (props, context) => (
  <Titlebar>
    <Toolbar.Left>
      <ToolGroup>
        <Slider
          value={props.zoom}
          max={props.maxZoom}
          isDisabled={props.isDisabled || props.count === 0}
          stopOnMouseLeave
          onChange={props.onZoomChange}
          minIcon={<IconList/>}
          maxIcon={<IconGrid/>}
          tabIndex={-1}/>
      </ToolGroup>
      <ToolGroup>
        <Button
          icon={<IconPlus/>}
          isDisabled={props.isDisabled || !props.canCreateItems}
          title="toolbar.import"
          onClick={props.onItemCreate}/>
      </ToolGroup>
    </Toolbar.Left>
    <Toolbar.Center>
      <div className="item-count">
        <FormattedMessage
          id="toolbar.items"
          values={{ count: props.count }}/>
      </div>
    </Toolbar.Center>
    <Toolbar.Right>
      <SearchField
        query={props.query}
        isDisabled={props.isDisabled}
        onSearch={props.onSearch}/>
    </Toolbar.Right>
  </Titlebar>
)

ProjectToolbar.contextType = WindowContext

ProjectToolbar.propTypes = {
  canCreateItems: bool,
  count: number.isRequired,
  isDisabled: bool,
  maxZoom: number.isRequired,
  query: string.isRequired,
  zoom: number.isRequired,
  onItemCreate: func.isRequired,
  onSearch: func.isRequired,
  onZoomChange: func.isRequired
}

module.exports = {
  ProjectToolbar
}
