import React from 'react'
import { FormattedMessage } from 'react-intl'
import { Slider } from '../slider'
import { Button } from '../button'
import { Toolbar, ToolGroup } from '../toolbar'
import { number, bool, func } from 'prop-types'
import { SASS } from '../../constants'

import {
  IconPhoto, IconPlusSmall, IconListSmall, IconGridSmall
} from '../icons'


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
        props.hasCreateButton &&
          <ToolGroup>
            <Button
              icon={<IconPlusSmall/>}
              size="sm"
              isDisabled={props.isDisabled}
              title="panel.photo.create"
              onClick={props.onCreate}/>
          </ToolGroup>
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

PhotoToolbar.propTypes = {
  hasCreateButton: bool,
  isClosed: bool,
  isDisabled: bool,
  maxZoom: number.isRequired,
  onCreate: func.isRequired,
  onZoomChange: func.isRequired,
  photos: number.isRequired,
  zoom: number.isRequired
}

PhotoToolbar.defaultProps = {
  maxZoom: SASS.PHOTO.ZOOM.length - 1,
  photos: 0
}
