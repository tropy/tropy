'use strict'

const React = require('react')
const { FormattedMessage } = require('react-intl')
const { Slider } = require('../slider')
const { Button } = require('../button')
const { number, bool, func } = require('prop-types')

const {
  Toolbar, ToolGroup, ToolbarLeft, ToolbarRight
} = require('../toolbar')

const {
  IconPhoto, IconPlus, IconListSmall, IconGridSmall
} = require('../icons')


const PhotoToolbar = (props) => (
  <Toolbar isDraggable={false}>
    <ToolbarLeft>
      <IconPhoto/>
      <h4>
        <FormattedMessage
          id="panel.photo.title"
          values={{ count: props.photos }}/>
      </h4>
    </ToolbarLeft>

    <ToolbarRight>
      {
        props.hasCreateButton &&
          <ToolGroup>
            <Button
              icon={<IconPlus/>}
              isDisabled={!props.canCreate}
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
          isDisabled={props.isDisabled}
          tabIndex={-1}
          onChange={props.onZoomChange}/>
      </ToolGroup>
    </ToolbarRight>
  </Toolbar>
)

PhotoToolbar.propTypes = {
  canCreate: bool,
  hasCreateButton: bool,
  isDisabled: bool,
  maxZoom: number.isRequired,
  photos: number.isRequired,
  zoom: number.isRequired,
  onCreate: func.isRequired,
  onZoomChange: func.isRequired
}

module.exports = {
  PhotoToolbar
}
