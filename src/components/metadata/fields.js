'use strict'

const React = require('react')
const { PropTypes } = React
const { Field } = require('./field')

const Fields = (props) => {
  const { template, data } = props

  return (
    <ol className="metadata-fields">{
      template.map(property =>
        <Field
          key={property.name}
          property={property}
          data={data}/>
      )
    }</ol>
  )
}

Fields.propTypes = {
  template: PropTypes.array.isRequired,
  data: PropTypes.object.isRequired
}

module.exports = {
  Fields
}
