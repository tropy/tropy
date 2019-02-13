'use strict'

const React = require('react')
const { connect } = require('react-redux')
const { PhotoGrid } = require('./grid')
const { PhotoList } = require('./list')
const { PHOTO } = require('../../constants/sass')
const actions = require('../../actions')
const { number } = require('prop-types')

const {
  getCachePrefix,
  getExpandedPhotos
} = require('../../selectors')


class PhotoPanel extends React.PureComponent {
  render() {
    let { zoom, ...props } = this.props
    let PhotoIterator = (zoom > 0) ? PhotoGrid : PhotoList

    return (
      <PhotoIterator {...props} size={PHOTO.ZOOM[zoom]}/>
    )
  }

  static propTypes = {
    zoom: number
  }
}

module.exports = {
  PhotoPanel: connect(
    state => ({
      cache: getCachePrefix(state),
      current: state.nav.photo,
      edit: state.edit,
      data: state.metadata,
      expanded: getExpandedPhotos(state),
      keymap: state.keymap,
      selection: state.nav.selection,
      selections: state.selections,
    }),

    dispatch => ({
      onContract(...args) {
        dispatch(actions.photo.contract(...args))
      },

      onDelete(payload) {
        if (payload.selections == null) {
          dispatch(actions.photo.delete(payload))
        } else {
          dispatch(actions.selection.delete(payload))
        }
      },

      onExpand(...args) {
        dispatch(actions.photo.expand(...args))
      },

      onSelectionSort(...args) {
        dispatch(actions.selection.order(...args))
      },

      onSort(...args) {
        dispatch(actions.photo.order(...args))
      }
    })
  )(PhotoPanel)
}
