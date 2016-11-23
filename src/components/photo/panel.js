'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { Toolbar } = require('../toolbar')
const { IconPhoto, IconPlus, IconList, IconGrid } = require('../icons')
const { FormattedMessage } = require('react-intl')
const { Panel } = require('../panel')
const { Slider } = require('../slider')
const { ListItem } = require('./list-item')
const { getPhotos } = require('../../selectors/photos')
const act = require('../../actions')


const PhotoPanelHeader = ({ hasCreateButton, onCreate }) => {
  const buttons = [
    <Slider
      key="zoom-level"
      value={0}
      max={8}
      minIcon={<IconList/>}
      maxIcon={<IconGrid/>}/>
  ]

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


const PhotoPanel = (props) => {
  const { item, photos, handleCreatePhoto } = props
  const locked = !item || !!item.deleted

  return (
    <Panel header={
      <PhotoPanelHeader
        hasCreateButton={!locked}
        onCreate={handleCreatePhoto}/>
    }>
      <ul
        className="photo-list">
        {photos.map(photo => (
          <ListItem key={photo.id} photo={photo} disabled={locked}/>
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
  handleCreatePhoto: PropTypes.func,
  onContextMenu: PropTypes.func
}

module.exports = {
  PhotoPanel: connect(
    (state, { item }) => ({
      photos: item ? getPhotos(state, item) : [],
    }),

    (dispatch, { item }) => ({
      handleCreatePhoto() {
        dispatch(act.photo.create({ item: item.id }))
      }
    })

  )(PhotoPanel),

  PhotoPanelHeader
}
