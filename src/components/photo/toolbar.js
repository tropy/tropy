'use strict'

const React = require('react')
const { PropTypes } = React
const { FormattedMessage } = require('react-intl')
const { Toolbar, ToolGroup } = require('../toolbar')
const { Slider } = require('../slider')

const {
  IconPhoto, IconPlus, IconListSmall, IconGridSmall
} = require('../icons')


const PhotoCreateButton = ({ handlePhotoCreate }) => (
  <button className="btn btn-icon" onClick={handlePhotoCreate}>
    <IconPlus/>
  </button>
)

PhotoCreateButton.propTypes = {
  handlePhotoCreate: PropTypes.func
}


const PhotoSlider = () => (
  <Slider
    value={0}
    max={3}
    size="sm"
    minIcon={<IconListSmall/>}
    maxIcon={<IconGridSmall/>}/>
)


const PhotoToolbar = ({ hasPhotoCreateButton, ...props }) => (
  <Toolbar>
    <div className="toolbar-left">
      <IconPhoto/>
      <h4><FormattedMessage id="panel.photos"/></h4>
    </div>

    <div className="toolbar-right">
      {
        hasPhotoCreateButton &&
          <ToolGroup>
            <PhotoCreateButton {...props}/>
          </ToolGroup>
      }
      <ToolGroup>
        <PhotoSlider {...props}/>
      </ToolGroup>
    </div>
  </Toolbar>
)

PhotoToolbar.propTypes = {
  hasPhotoCreateButton: PropTypes.bool,
  handlePhotoCreate: PropTypes.func
}

module.exports = {
  PhotoToolbar,
  PhotoSlider,
  PhotoCreateButton
}
