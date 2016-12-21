'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { connect } = require('react-redux')
const { PhotoListItem } = require('./list-item')
const { DC } = require('../../constants/properties')

const act = require('../../actions')


class PhotoList extends Component {

  handleContextMenu = (photo, event) => {
    this.props.onContextMenu(event, 'photo', photo)
  }

  render() {
    const { photos, selected, ...props } = this.props

    return (
      <ul className="photo-list">
        {photos.map(photo =>
          <PhotoListItem {...props}
            key={photo}
            id={photo}
            isSelected={photo === selected}
            title={DC.TITLE}
            onContextMenu={this.handleContextMenu}/>
        )}
      </ul>
    )
  }

  static propTypes = {
    photos: PropTypes.arrayOf(PropTypes.number),
    selected: PropTypes.number,

    isDisabled: PropTypes.bool,

    onSelect: PropTypes.func,
    onContextMenu: PropTypes.func
  }
}

module.exports = {
  PhotoList: connect(
    null,

    (dispatch) => ({
      onSelect(...args) {
        dispatch(act.photo.select(...args))
      }
    })
  )(PhotoList)
}
