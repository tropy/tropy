'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { PhotoListItem } = require('./list-item')
const { DC } = require('../../constants/properties')

const act = require('../../actions')


const PhotoList = ({ photos, selected, ...props }) => (
  <ul className="photo-list">
    {photos.map(photo =>
      <PhotoListItem {...props}
        key={photo}
        id={photo}
        isSelected={photo === selected}
        title={DC.TITLE}/>
    )}
  </ul>
)

PhotoList.propTypes = {
  photos: PropTypes.arrayOf(PropTypes.number),
  selected: PropTypes.number,

  isDisabled: PropTypes.bool,

  handlePhotoSelection: PropTypes.func,
  showPhotoMenu: PropTypes.func
}

module.exports = {
  PhotoList: connect(
    null,

    (dispatch) => ({

      handlePhotoSelection(...args) {
        dispatch(act.photo.select(...args))
      },

      showPhotoMenu(event, { id, item, path }) {
        event.stopPropagation()
        dispatch(act.ui.context.show(event, 'photo', { id, item, path }))
      }
    })
  )(PhotoList)
}
