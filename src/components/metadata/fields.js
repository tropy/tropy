'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { Field } = require('./field')
const { metadata, ui } = require('../../actions')
const { getTemplate } = require('../../selectors/templates')
const { get } = require('dot-prop')


const Fields = (props) => {
  const { fields, editing } = props

  return (
    <ol className="metadata-fields">{
      fields.map(({ property }) =>
        <Field {...props}
          key={property.uri}
          property={property}
          editing={editing === property.uri}/>
      )
    }</ol>
  )
}

Fields.propTypes = {
  editing: PropTypes.string,
  disabled: PropTypes.bool,
  template: PropTypes.string.isRequired,
  fields: PropTypes.arrayOf(PropTypes.shape({
    property: PropTypes.object.isRequired
  })),
  id: PropTypes.number.isRequired,
  data: PropTypes.object,
  onActivate: PropTypes.func,
  onCancel: PropTypes.func,
  onChange: PropTypes.func,
  onContextMenu: PropTypes.func
}


module.exports = {
  Fields: connect(
    (state, { id, template }) => ({
      data: state.metadata[id] || {},
      fields: getTemplate(state, { template }) || [],
      editing: get(state, `ui.edit.field.${id}`)
    }),

    (dispatch, { id }) => ({
      onActivate(property) {
        dispatch(ui.edit.start({ field: { [id]: property } }))
      },

      onCancel() {
        dispatch(ui.edit.cancel())
      },

      onChange(data) {
        dispatch(metadata.save({ id, data }))
        dispatch(ui.edit.cancel())
      },

      onContextMenu(property) {
        dispatch(ui.context.show(event, 'metadata', { id, property }))
      }
    })
  )(Fields)
}
