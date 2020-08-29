import React from 'react'
import { Field, StaticField } from '../metadata'
import { bool, func, object } from 'prop-types'
import { IMAGE } from '../../constants'
import { basename } from 'path'
import { bytes, datetime, number, ppi } from '../../format'


export class PhotoInfo extends React.PureComponent {
  get file() {
    return basename(this.props.photo.path)
  }

  get size() {
    let { width, height, size } = this.props.photo
    return `${number(width)}×${number(height)}, ${bytes(size)}`
  }

  get hint() {
    let { protocol, path } = this.props.photo
    return (protocol === 'file') ? path : `${protocol}://${path}`
  }

  isEditing(prop) {
    return this.props.edit?.property === prop &&
      this.props.edit.id === this.props.photo.id
  }

  handleFileClick = () => {
    if (this.props.onOpenInFolder) {
      this.props.onOpenInFolder(this.props.photo)
    }
  }

  handleDensityClick = () => {
    if (!this.props.isDisabled)
      this.props.onEdit({
        field: {
          id: this.props.photo.id,
          property: 'photo.density'
        }
      })
  }

  handleDensityChange = (density) => {
    if (!this.props.isDisabled)
      this.props.onChange({
        id: this.props.photo.id,
        data: { density }
      }, { })

    this.props.onEditCancel()
  }

  render() {
    return (
      <ol className="photo-info metadata-fields">
        <StaticField
          hint={this.hint}
          label="photo.file"
          value={this.file}
          onClick={this.handleFileClick}/>
        {this.props.photo.density &&
          <Field
            display={ppi(this.props.photo.density)}
            hint="Pixels per inch"
            isActive={this.isEditing('photo.density')}
            isDisabled={this.props.isDisabled}
            isRequired
            isStatic={this.props.isDisabled || this.props.onChange == null}
            label="photo.density"
            max={IMAGE.MAX_DENSITY}
            min={IMAGE.MIN_DENSITY}
            onCancel={this.props.onEditCancel}
            onChange={this.handleDensityChange}
            onClick={this.handleDensityClick}
            type="number"
            value={this.props.photo.density}/>}
        <StaticField
          label="photo.size"
          value={this.size}/>
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
    isDisabled: bool,
    edit: object,
    photo: object.isRequired,
    onEdit: func,
    onEditCancel: func,
    onChange: func,
    onOpenInFolder: func
  }
}
