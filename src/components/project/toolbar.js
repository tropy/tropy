import React from 'react'
import { WindowContext } from '../window.js'
import { FormattedMessage } from 'react-intl'
import { Titlebar, Toolbar, ToolGroup } from '../toolbar.js'
import { Slider } from '../slider.js'
import { SearchField } from '../search/field.js'
import { Button } from '../button.js'
import { IconPlus, IconList, IconGrid, IconXSmall } from '../icons.js'


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
              stopOnMouseLeave={this.context.args.frameless}
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
            clearIcon={<IconXSmall/>}
            focus="find"
            query={this.props.query}
            isDisabled={this.props.isDisabled}
            onSearch={this.props.onSearch}/>
        </Toolbar.Right>
      </Titlebar>
    )
  }

  static contextType = WindowContext
}
