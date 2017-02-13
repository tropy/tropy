'use strict'

const React = require('react')
const { PropTypes } = React
const { DropTarget } = require('react-dnd')
const { NativeTypes } = require('react-dnd-electron-backend')
const { Panel } = require('../panel')
const { PhotoToolbar } = require('./toolbar')
const { PhotoList } = require('./list')
const { PhotoGrid } = require('./grid')
const { isValidImage } = require('../../image')
const { pick } = require('../../common/util')


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
        onZoomChange={this.props.onZoomChange}
        hasCreateButton={!this.props.isDisabled}
        onCreate={this.props.onCreate}/>
    )
  }

  renderContent() {
    const { onMetadataSave, ...props } = this.props

    if (props.zoom) {
      return (
        <PhotoGrid {...pick(props, PhotoGrid.props)}
          onDropImages={this.handleDropFiles}/>
      )
    }

    return (
      <PhotoList {...pick(props, PhotoList.props)}
        onDropImages={this.handleDropFiles}
        onChange={onMetadataSave}
        onEdit={this.handleEdit}/>
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
    zoom: PropTypes.number.isRequired,

    isDisabled: PropTypes.bool,
    isOver: PropTypes.bool,
    canDrop: PropTypes.bool,

    dt: PropTypes.func.isRequired,

    onCreate: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onMetadataSave: PropTypes.func.isRequired,
    onZoomChange: PropTypes.func.isRequired
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
