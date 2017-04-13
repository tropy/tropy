'use strict'

const React = require('react')
const PropTypes = require('prop-types')
const { array, bool, number, func } = PropTypes
const { DropTarget } = require('react-dnd')
const { NativeTypes } = require('react-dnd-electron-backend')
const { Panel } = require('../panel')
const { PhotoToolbar } = require('./toolbar')
const { PhotoList } = require('./list')
const { PhotoGrid } = require('./grid')
const { isValidImage } = require('../../image')
const { pick } = require('../../common/util')
const { PHOTO } = require('../../constants/sass')


class PhotoPanel extends Panel {
  get classes() {
    return {
      ...super.classes,
      'drop-target': !this.props.isDisabled,
      'over': this.props.isOver && this.props.canDrop
    }
  }

  handleEdit = (photo) => {
    this.props.onEdit({ photo })
  }

  connect(element) {
    return this.props.isDisabled ? element : this.props.dt(element)
  }

  renderToolbar() {
    return (
      <PhotoToolbar
        zoom={this.props.zoom}
        maxZoom={PHOTO.ZOOM.length - 1}
        onZoomChange={this.props.onZoomChange}
        hasCreateButton={!this.props.isDisabled}
        isDisabled={this.props.isClosed || !this.props.photos.length}
        onCreate={this.props.onCreate}/>
    )
  }

  renderContent() {
    const { onMetadataSave, zoom } = this.props

    const props = {
      ...this.props,
      size: PHOTO.ZOOM[zoom],
      onChange: onMetadataSave,
      onDropImages: this.handleDropFiles,
      onEdit: this.handleEdit
    }

    const PhotoIterator = zoom ? PhotoGrid : PhotoList

    return (
      <PhotoIterator {...pick(props, PhotoIterator.props)}/>
    )
  }

  render() {
    const toolbar = this.renderToolbar()
    const content = this.renderContent()

    return (
      <section className="photo-panel panel">
        {this.renderHeader(toolbar)}
        {this.connect(this.renderBody(content))}
      </section>
    )
  }


  static propTypes = {
    zoom: number.isRequired,
    photos: array.isRequired,

    isClosed: bool,
    isDisabled: bool,
    isOver: bool,
    canDrop: bool,

    dt: func.isRequired,

    onCreate: func.isRequired,
    onEdit: func.isRequired,
    onMetadataSave: func.isRequired,
    onZoomChange: func.isRequired
  }
}


const spec = {
  drop({ onCreate }, monitor) {
    const { files } = monitor.getItem()

    const images = files
      .filter(isValidImage)
      .map(file => file.path)

    return onCreate({ files: images }), { images }
  },

  canDrop(_, monitor) {
    return !!monitor.getItem().files.find(isValidImage)
  }
}

const collect = (connect, monitor) => ({
  dt: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop()
})


module.exports = {
  PhotoPanel: DropTarget(NativeTypes.FILE, spec, collect)(PhotoPanel)
}
