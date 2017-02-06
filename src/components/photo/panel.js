'use strict'

const React = require('react')
const { PropTypes } = React
const { Panel } = require('../panel')
const { PhotoToolbar } = require('./toolbar')
const { PhotoList } = require('./list')
const { PhotoGrid } = require('./grid')


class PhotoPanel extends Panel {

  handleEdit = (photo) => {
    this.props.onEdit({ photo })
  }

  handleDropFiles = (files) => {
    this.props.onCreate({ files })
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
        <PhotoGrid {...props} onDropImages={this.handleDropFiles}/>
      )
    }

    return (
      <PhotoList {...props}
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
        {this.renderBody(content)}
      </section>
    )
  }

  static propTypes = {
    zoom: PropTypes.number.isRequired,
    isDisabled: PropTypes.bool,
    onCreate: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onMetadataSave: PropTypes.func.isRequired,
    onZoomChange: PropTypes.func.isRequired
  }
}

module.exports = {
  PhotoPanel
}
