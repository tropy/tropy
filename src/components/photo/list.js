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

  onSelect: PropTypes.func,
  onContextMenu: PropTypes.func
}

module.exports = {
  PhotoList: connect(
    null,

    (dispatch) => ({
      onSelect(...args) {
        dispatch(act.photo.select(...args))
      },

      onContextMenu(event, { id, item, path }) {
        event.stopPropagation()
        dispatch(act.ui.context.show(event, 'photo', { id, item, path }))
      }
    })
  )(PhotoList)
}
