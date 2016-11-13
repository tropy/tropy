'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { Toolbar } = require('../toolbar')
const { IconPhoto, IconPlus } = require('../icons')
const { FormattedMessage } = require('react-intl')
const { Panel } = require('../panel')
const { getPhotos } = require('../../selectors/photos')
const act = require('../../actions/photo')


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


const PhotoPanel = ({ item, photos, handleCreatePhoto }) => {
  const locked = !item || item.deleted

  return (
    <Panel header={
      <PhotoPanelHeader
        hasCreateButton={!locked}
        onCreate={handleCreatePhoto}/>
    }>
      <ul className="photo-list">
        {photos.map(photo => (
          <li key={photo.id} className="photo active">
            <img src={'dev/dummy-24.jpg'} srcSet={'dev/dummy-24-2x.jpg 2x'}
              width={24} height={24} className="thumbnail"/>
            <div className="file-name">PC110098.JPG</div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

PhotoPanel.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number.isRequired,
    photos: PropTypes.arrayOf(PropTypes.number).isRequired
  }),
  photos: PropTypes.arrayOf(PropTypes.object).isRequired,
  handleCreatePhoto: PropTypes.func
}

module.exports = {
  PhotoPanel: connect(
    (state, { item }) => ({
      photos: item ? getPhotos(state, item) : []
    }),

    (dispatch, { item }) => ({
      handleCreatePhoto: () => dispatch(act.create({ item: item.id }))
    })

  )(PhotoPanel),

  PhotoPanelHeader
}
