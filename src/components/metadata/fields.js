'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { Field } = require('./field')
const { get } = require('../../common/util')


class Fields extends Component {

  isEditing(uri) {
    return get(this.props.ui, ['edit', 'field', this.props.subject.id]) === uri
  }

  render() {
    const { template, subject, ...props } = this.props

    return (
      <ol className="metadata-fields">{
        template.map(({ property }) =>
          <Field {...props}
            key={property.uri}
            data={subject.data}
            property={property}
            isEditing={this.isEditing(property.uri)}/>
        )
      }</ol>
    )
  }

  static propTypes = {
    ui: PropTypes.object,
    isDisabled: PropTypes.bool,

    template: PropTypes.arrayOf(PropTypes.shape({
      property: PropTypes.object.isRequired
    })).isRequired,

    subject: PropTypes.shape({
      id: PropTypes.number.isRequired,
      data: PropTypes.object.isRequired,
    }).isRequired,

    onEdit: PropTypes.func,
    onEditCancel: PropTypes.func,
    onMetadataSave: PropTypes.func,
    onContextMenu: PropTypes.func
  }
}


module.exports = {
  Fields
}
