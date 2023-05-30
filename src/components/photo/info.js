import { basename } from 'node:path'
import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import { useDispatch } from 'react-redux'
import { bool, number, object } from 'prop-types'
import { IMAGE } from '../../constants/index.js'
import { useEvent } from '../../hooks/use-event.js'
import { MetadataField } from '../metadata/field.js'
import { bytes, datetime, number as num } from '../../format.js'
import * as act from '../../actions/index.js'
import { map } from '../../common/util.js'

export const PhotoInfo = React.memo(({
  photo,
  isDisabled,
  maxDensity,
  minDensity
}) => {
  let dispatch = useDispatch()
  let intl = useIntl()
  let [editing, setEditing] = useState(null)

  let url = (photo.protocol === 'file') ?
    photo.path : `${photo.protocol}://${photo.path}`

  let size = [
    `${num(photo.width)}×${num(photo.height)}`,
    bytes(photo.size)
  ].join(', ')

  let openPhotoInFolder = useEvent(() => {
    dispatch(act.shell.open(photo))
  })

  let stopEditing = useEvent(() => setEditing(null))

  let handleChange = useEvent((data) => {
    if (!isDisabled)
      dispatch(act.photo.save({
        id: photo.id,
        data: map(data, (_, { text }) => text)
      }))

    stopEditing()
  })

  return (
    <ol className="photo-info metadata-fields">
      <MetadataField
        label={intl.formatMessage({ id: 'photo.file' })}
        text={photo.filename || basename(photo.path)}
        title={url}
        onClick={openPhotoInFolder}/>

      {photo.density &&
        <MetadataField
          hint={intl.formatMessage({ id: 'format.ppi' })}
          isActive={editing === 'density'}
          isDisabled={isDisabled}
          isRequired
          label={intl.formatMessage({ id: 'photo.density' })}
          max={maxDensity}
          min={minDensity}
          property="density"
          text={photo.density}
          type="ppi"
          onCancel={stopEditing}
          onChange={handleChange}
          onClick={setEditing}/>}

      <MetadataField
        label={intl.formatMessage({ id: 'photo.size' })}
        text={size}/>
      <MetadataField
        label={intl.formatMessage({ id: 'photo.created' })}
        text={datetime(photo.created)}/>
      <MetadataField
        label={intl.formatMessage({ id: 'photo.modified' })}
        text={datetime(photo.modified)}/>
    </ol>
  )
})

PhotoInfo.propTypes = {
  isDisabled: bool,
  photo: object.isRequired,
  maxDensity: number.isRequired,
  minDensity: number.isRequired
}

PhotoInfo.defaultProps = {
  maxDensity: IMAGE.MAX_DENSITY,
  minDensity: IMAGE.MIN_DENSITY
}
