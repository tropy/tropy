'use strict'

const React = require('react')
const { PureComponent } = React
const { StaticField } = require('../metadata/field')
const { func, object } = require('prop-types')
const { basename } = require('path')
const { bytes, datetime, number } = require('../../format')


class PhotoInfo extends PureComponent {
  get file() {
    return basename(this.props.photo.path)
  }

  get size() {
    const { width, height, size } = this.props.photo
    return `${number(width)}×${number(height)}, ${bytes(size)}`
  }

  handleFileClick = () => {
    if (this.props.onOpenInFolder) {
      this.props.onOpenInFolder(this.props.photo.path)
    }
  }

  render() {
    return (
      <ol className="photo-info metadata-fields">
        <StaticField
          hint={this.props.photo.path}
          label="photo.file"
          value={this.file}
          onClick={this.handleFileClick}/>
        <StaticField
          label="photo.size"
          value={this.size}/>
        {this.props.photo.density &&
          <StaticField
            label="photo.density"
            hint="Pixels per inch"
            value={`${this.props.photo.density} ppi`}/>}
        <StaticField
          label="photo.created"
          value={datetime(this.props.photo.created)}/>
        <StaticField
          label="item.modified"
          value={datetime(this.props.photo.modified)}/>
      </ol>
    )
  }

  static propTypes = {
    photo: object.isRequired,
    onOpenInFolder: func
  }
}

module.exports = {
  PhotoInfo
}
