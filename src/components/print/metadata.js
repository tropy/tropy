'use strict'

const React = require('react')
const cx = require('classnames')

const {
  arrayOf,
  bool,
  object,
  string
} = require('prop-types')


const MetadataField = ({ isExtra, label, value }) => (
  <li className={cx('metadata-field', { extra: isExtra })}>
    <label>{label}</label>
    <div className="value">{value}</div>
  </li>
)

MetadataField.propTypes = {
  isExtra: bool,
  label: string.isRequired,
  value: string
}

const MetadataSection = ({ fields, title }) => (
  <section>
    <h5 className="metadata-heading">{title}</h5>
    <ol className="metadata-fields">
      {fields.map((f, idx) =>
        <MetadataField
          key={idx}
          isExtra={f.isExtra}
          label={f.label || f.property.label}
          value={f.value.text}/>)}
    </ol>
  </section>
)

MetadataSection.propTypes = {
  fields: arrayOf(object),
  title: string.isRequired
}

module.exports = {
  MetadataField,
  MetadataSection
}
