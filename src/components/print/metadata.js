import React from 'react'
import { FormattedMessage } from 'react-intl'
import cx from 'classnames'
import { ItemInfo } from '../item/info'
import { PhotoInfo } from '../photo/info'
import { auto } from '../../format'
import { TYPE } from '../../constants'
import { arrayOf, bool, object, node, string } from 'prop-types'


export const MetadataField = ({ isExtra, label, text, type }) => (
  <li className={cx('metadata-field', { extra: isExtra })}>
    <label>{label}</label>
    <div className="value">{auto(text, type)}</div>
  </li>
)

MetadataField.propTypes = {
  isExtra: bool,
  label: node.isRequired,
  text: string,
  type: string.isRequired
}

export const MetadataContainer = ({ item, photo, notes }) => (
  <div className="metadata-container">
    <div className="col">
      {item &&
        <>
          <MetadataSection
            title="print.item"
            fields={item.data}
            tags={item.tags}/>
          <ItemInfo item={item}/>
        </>}
    </div>
    <div className="col">
      {photo &&
        <>
          <MetadataSection
            title="print.photo"
            fields={photo.data}/>
          <PhotoInfo photo={photo}/>
        </>}
      {notes}
    </div>
  </div>
)

MetadataContainer.propTypes = {
  item: object,
  photo: object,
  notes: node
}

export const MetadataSection = ({ fields, title, tags }) => (
  <section>
    <h5 className="metadata-heading">
      <FormattedMessage id={title}/>
    </h5>
    <ol className="metadata-fields">
      {fields.map(f =>
        <MetadataField
          key={f.property.id}
          isExtra={f.isExtra}
          label={f.label || f.property.label}
          text={f.value.text}
          type={f.value.type || f.type}/>)}
      {tags && tags.length > 0 &&
        <MetadataField
          label={<FormattedMessage id="print.tags"/>}
          text={tags.join(', ')}
          type={TYPE.TEXT}/>}
    </ol>
  </section>
)

MetadataSection.propTypes = {
  fields: arrayOf(object),
  tags: arrayOf(string),
  title: string.isRequired
}
