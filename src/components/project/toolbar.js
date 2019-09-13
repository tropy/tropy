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

class ProjectToolbar extends React.PureComponent {

  render() {
    return (
      <Titlebar>
        <Toolbar.Left>
          <ToolGroup>
            <Slider
              value={this.props.zoom}
              max={this.props.maxZoom}
              isDisabled={this.props.isDisabled || this.props.count === 0}
              stopOnMouseLeave={this.context.state.frameless}
              onChange={this.props.onZoomChange}
              minIcon={<IconList/>}
              maxIcon={<IconGrid/>}
              tabIndex={-1}/>
          </ToolGroup>
          <ToolGroup>
            <Button
              icon={<IconPlus/>}
              isDisabled={this.props.isDisabled || !this.props.canCreateItems}
              title="toolbar.import"
              onClick={this.props.onItemCreate}/>
          </ToolGroup>
        </Toolbar.Left>
        <Toolbar.Center>
          <div className="item-count">
            <FormattedMessage
              id="toolbar.items"
              values={{ count: this.props.count }}/>
          </div>
        </Toolbar.Center>
        <Toolbar.Right>
          <SearchField
            query={this.props.query}
            isDisabled={this.props.isDisabled}
            onSearch={this.props.onSearch}/>
        </Toolbar.Right>
      </Titlebar>
    )
  }

  static contextType = WindowContext

  static propTypes = {
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
}

module.exports = {
  ProjectToolbar
}
