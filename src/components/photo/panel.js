'use strict'

const React = require('react')
const { Toolbar } = require('../toolbar')
const { IconPhoto, IconPlus } = require('../icons')


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

const PhotoPanelHeader = () => (
  <Toolbar>
    <div className="toolbar-left">
      <IconPhoto/>
      <h4>Photos</h4>
    </div>
    <div className="toolbar-right">
      <button className="btn btn-icon">
        <IconPlus/>
      </button>
    </div>
  </Toolbar>
)

module.exports = {
  PhotoPanel,
  PhotoPanelHeader
}
