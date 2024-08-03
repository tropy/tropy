import { basename } from 'node:path'
import React from 'react'
import { useIntl, FormattedMessage } from 'react-intl'
import cx from 'classnames'
import { auto, bytes, number } from '../../format.js'
import { TYPE } from '../../constants/index.js'

export const MetadataField = ({
  isExtra,
  label,
  text,
  type = TYPE.TEXT
}) => (
  <li className={cx('metadata-field', { extra: isExtra })}>
    <label>{label}</label>
    <div className="value">{auto(text, type)}</div>
  </li>
)

export const ItemInfo = ({ item }) => {
  let intl = useIntl()
  return (
    <ol className="item-info metadata-fields">
      <MetadataField
        label={intl.formatMessage({ id: 'item.created' })}
        text={item.created}
        type={TYPE.DATE}/>
      <MetadataField
        label={intl.formatMessage({ id: 'item.modified' })}
        text={item.modified}
        type={TYPE.DATE}/>
    </ol>
  )
}

export const PhotoInfo = ({ photo }) => {
  let intl = useIntl()
  let size = [
    `${number(photo.width)}×${number(photo.height)}`,
    bytes(photo.size)
  ].join(', ')

  return (
    <ol className="item-info metadata-fields">
      <MetadataField
        label={intl.formatMessage({ id: 'photo.file' })}
        text={photo.filename || basename(photo.path)}/>
      <MetadataField
        label={intl.formatMessage({ id: 'photo.size' })}
        text={size}/>
      <MetadataField
        label={intl.formatMessage({ id: 'photo.created' })}
        text={photo.created}
        type={TYPE.DATE}/>
      <MetadataField
        label={intl.formatMessage({ id: 'photo.modified' })}
        text={photo.modified}
        type={TYPE.DATE}/>
    </ol>
  )
}

export const MetadataContainer = ({ item, photo, notes }) => (
  <div className="metadata-container">
    <div className="col">
      {item && (
        <>
          <MetadataSection
            title="print.item"
            fields={item.data}
            tags={item.tags}/>
          <ItemInfo item={item}/>
        </>
      )}
    </div>
    <div className="col">
      {photo && (
        <>
          <MetadataSection
            title="print.photo"
            fields={photo.data}/>
          <PhotoInfo photo={photo}/>
        </>
      )}
      {notes}
    </div>
  </div>
)

export const MetadataSection = ({ fields, title, tags }) => (
  <section>
    <h5 className="metadata-heading">
      <FormattedMessage id={title}/>
    </h5>
    <ol className="metadata-fields">
      {fields.map(f => (
        <MetadataField
          key={f.property.id}
          isExtra={f.isExtra}
          label={f.label || f.property.label}
          text={f.value.text}
          type={f.value.type || f.type}/>
      ))}
      {tags && tags.length > 0 && (
        <MetadataField
          label={<FormattedMessage id="print.tags"/>}
          text={tags.join(', ')}
          type={TYPE.TEXT}/>
      )}
    </ol>
  </section>
)
