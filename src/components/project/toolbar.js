import React from 'react'
import { WindowContext } from '../window'
import { FormattedMessage } from 'react-intl'
import { bool, func, number, string } from 'prop-types'
import { Titlebar, Toolbar, ToolGroup } from '../toolbar'
import { Slider } from '../slider'
import { SearchField } from '../search'
import { Button } from '../button'
import { IconPlus, IconList, IconGrid } from '../icons'


export class ProjectToolbar extends React.PureComponent {
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
              isDisabled={this.props.isDisabled || this.props.isReadOnly}
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
            focus="find"
            query={this.props.query}
            isDisabled={this.props.isDisabled}
            onSearch={this.props.onSearch}/>
        </Toolbar.Right>
      </Titlebar>
    )
  }

  static contextType = WindowContext

  static propTypes = {
    count: number.isRequired,
    isDisabled: bool,
    isReadOnly: bool,
    maxZoom: number.isRequired,
    query: string.isRequired,
    zoom: number.isRequired,
    onItemCreate: func.isRequired,
    onSearch: func.isRequired,
    onZoomChange: func.isRequired
  }
}
