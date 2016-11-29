'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { PhotoListItem } = require('./list-item')
const { getPhotos } = require('../../selectors/photos')


const PhotoList = ({ photos, selected, ...props }) => (
  <ul className="photo-list">
    {photos.map(photo =>
      <PhotoListItem {...props}
        key={photo.id}
        photo={photo}
        isSelected={photo.id === selected}/>
    )}
  </ul>
)

PhotoList.propTypes = {
  ids: PropTypes.arrayOf(PropTypes.number),
  selected: PropTypes.number,
  isDisabled: PropTypes.bool,

  photos: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired
  }))
}

module.exports = {
  PhotoList: connect(
    (state, props) => ({
      photos: getPhotos(state, props)
    })
  )(PhotoList)
}
