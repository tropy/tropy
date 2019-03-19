'use strict'

const React = require('react')
const { FormattedMessage } = require('react-intl')
const { Slider } = require('../slider')
const { Button } = require('../button')
const { Toolbar, ToolGroup } = require('../toolbar')
const { number, bool, func } = require('prop-types')
const { PHOTO } = require('../../constants/sass')

const {
  IconPhoto, IconPlus, IconListSmall, IconGridSmall
} = require('../icons')


const PhotoToolbar = (props) => (
  <Toolbar isDraggable={false}>
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
              icon={<IconPlus/>}
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
  maxZoom: PHOTO.ZOOM.length - 1,
  photos: 0
}

module.exports = {
  PhotoToolbar
}
