import React from 'react'
import { FormattedMessage } from 'react-intl'
import { Slider } from '../slider.js'
import { Button } from '../button.js'
import { Toolbar, ToolGroup } from '../toolbar.js'
import { SASS } from '../../constants/index.js'

import {
  IconPhoto, IconPlusSmall, IconListSmall, IconGridSmall
} from '../icons.js'


export const PhotoToolbar = ({
  hasCreateButton,
  isClosed,
  isDisabled,
  maxZoom = SASS.PHOTO.ZOOM.length - 1,
  onCreate,
  onZoomChange,
  photos,
  zoom = 0
}) => (
  <Toolbar>
    <Toolbar.Left>
      <IconPhoto/>
      <h4>
        <FormattedMessage
          id="panel.photo.title"
          values={{ count: photos }}/>
      </h4>
    </Toolbar.Left>
    <Toolbar.Right>
      {
        hasCreateButton && (
          <ToolGroup>
            <Button
              icon={<IconPlusSmall/>}
              size="sm"
              isDisabled={isDisabled}
              title="panel.photo.create"
              onClick={onCreate}/>
          </ToolGroup>
        )
      }
      <ToolGroup>
        <Slider
          value={zoom}
          max={maxZoom}
          size="sm"
          minIcon={<IconListSmall/>}
          maxIcon={<IconGridSmall/>}
          isDisabled={isClosed || photos === 0}
          tabIndex={-1}
          onChange={onZoomChange}/>
      </ToolGroup>
    </Toolbar.Right>
  </Toolbar>
)
