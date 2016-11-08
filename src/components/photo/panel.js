'use strict'

const React = require('react')
const { PropTypes } = React
const { Toolbar } = require('../toolbar')
const { IconPhoto, IconPlus } = require('../icons')
const { FormattedMessage } = require('react-intl')


const PhotoPanel = () => (
  <ul className="photo-list">
    <li className="photo active">
      <img src={'dev/dummy-24.jpg'} srcSet={'dev/dummy-24-2x.jpg 2x'}
        width={24} height={24} className="thumbnail"/>
      <div className="file-name">PC110098.JPG</div>
    </li>
    <li className="photo">
      <img src={'dev/dummy-24.jpg'} srcSet={'dev/dummy-24-2x.jpg 2x'}
        width={24} height={24} className="thumbnail"/>
      <div className="file-name">PC110099.JPG</div>
    </li>
  </ul>
)

const PhotoPanelHeader = ({ hasCreateButton, onCreate }) => {
  const buttons = []

  if (hasCreateButton) {
    buttons.push(
      <button key="create" className="btn btn-icon" onClick={onCreate}>
        <IconPlus/>
      </button>
    )
  }

  return (
    <Toolbar>
      <div className="toolbar-left">
        <IconPhoto/>
        <h4><FormattedMessage id="panel.photos"/></h4>
      </div>
      <div className="toolbar-right">
        {buttons}
      </div>
    </Toolbar>
  )
}

PhotoPanelHeader.propTypes = {
  hasCreateButton: PropTypes.bool,
  onCreate: PropTypes.func
}

module.exports = {
  PhotoPanel,
  PhotoPanelHeader
}
