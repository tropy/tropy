import React from 'react'
import { connect } from 'react-redux'
import { PhotoGrid } from './grid.js'
import { PhotoList } from './list.js'
import { SASS } from '../../constants/index.js'
import * as act from '../../actions/index.js'
import { getExpandedPhotos } from '../../selectors/index.js'


class PhotoPanel extends React.PureComponent {
  render() {
    let { zoom, ...props } = this.props
    let PhotoIterator = (zoom > 0) ? PhotoGrid : PhotoList

    return (
      <PhotoIterator {...props} size={SASS.PHOTO.ZOOM[zoom]}/>
    )
  }
}

const PhotoPanelContainer = connect(
  state => ({
    current: state.nav.photo,
    edit: state.edit,
    data: state.metadata,
    expandedPhotos: getExpandedPhotos(state),
    keymap: state.keymap,
    selection: state.nav.selection,
    selections: state.selections
  }),

  dispatch => ({
    onContract(...args) {
      dispatch(act.photo.contract(...args))
    },

    onConsolidate(...args) {
      dispatch(act.photo.consolidate(...args))
    },

    onDelete(payload) {
      if (payload.selections == null) {
        dispatch(act.photo.delete(payload))
      } else {
        dispatch(act.selection.delete(payload))
      }
    },

    onExpand(...args) {
      dispatch(act.photo.expand(...args))
    },

    onExtract(...args) {
      dispatch(act.photo.extract(...args))
    },

    onItemPreview(...args) {
      dispatch(act.item.preview(...args))
    },

    onRotate(...args) {
      dispatch(act.photo.rotate(...args))
    },

    onSelectionSort(...args) {
      dispatch(act.selection.order(...args))
    },

    onSort(...args) {
      dispatch(act.photo.order(...args))
    }
  })
)(PhotoPanel)

export {
  PhotoPanelContainer as PhotoPanel
}
