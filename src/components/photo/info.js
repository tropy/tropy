'use strict'

const React = require('react')
const { PureComponent } = React
const { StaticField } = require('../metadata/field')
const { object } = require('prop-types')
const { basename } = require('path')


class PhotoInfo extends PureComponent {
  get filename() {
    return basename(this.props.photo.path)
  }

  get size() {
    const { width, height } = this.props.photo
    return `${width}x${height}`
  }

  render() {
    return (
      <ol className="photo-info metadata-fields">
        <StaticField
          label="photo.filename"
          value={this.filename}/>
        <StaticField
          label="photo.size"
          value={this.size}/>
      </ol>
    )
  }

  static propTypes = {
    photo: object.isRequired
  }
}

module.exports = {
  PhotoInfo
}
