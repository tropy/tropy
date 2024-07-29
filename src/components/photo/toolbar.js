import React from 'react'
import { FormattedMessage } from 'react-intl'
import { Slider } from '../slider.js'
import { Button } from '../button.js'
import { Toolbar, ToolGroup } from '../toolbar.js'
import { SASS } from '../../constants/index.js'

import {
  IconPhoto, IconPlusSmall, IconListSmall, IconGridSmall
} from '../icons.js'


export const PhotoToolbar = (props) => (
  <Toolbar>
    <Toolbar.Left>
      <IconPhoto/>
      <h4>
        <FormattedMessage
          id="panel.photo.title"
          values={{ count: props.photos }}/>
      </h4>
    </Toolbar.Left>
    <Toolbar.Right>
      {
        props.hasCreateButton && (
          <ToolGroup>
            <Button
              icon={<IconPlusSmall/>}
              size="sm"
              isDisabled={props.isDisabled}
              title="panel.photo.create"
              onClick={props.onCreate}/>
          </ToolGroup>
        )
      }
      <ToolGroup>
        <Slider
          value={props.zoom}
          max={props.maxZoom}
          size="sm"
          minIcon={<IconListSmall/>}
          maxIcon={<IconGridSmall/>}
          isDisabled={props.isClosed || props.photos === 0}
          tabIndex={-1}
          onChange={props.onZoomChange}/>
      </ToolGroup>
    </Toolbar.Right>
  </Toolbar>
)

PhotoToolbar.defaultProps = {
  maxZoom: SASS.PHOTO.ZOOM.length - 1,
  photos: 0
}
