'use strict'

const React = require('react')
const { object, arrayOf, shape, string, bool } = require('prop-types')
const { Accordion } = require('../accordion')
const { IconBook16 } = require('../icons')
const { FormField, FormText } = require('../form')


class PluginAccordion extends Accordion {
  handleChange = (data) => {
    console.log(data)
    /* this.props.onSave({ id: this.props.vocab.id, ...data })*/
  }

  renderHeader() {
    return super.renderHeader(
      <div className="flex-row center panel-header-container">
        <IconBook16/>
        <h1 className="panel-heading">
          {this.props.config.name}
        </h1>
      </div>
    )
  }

  renderBody() {
    const { config } = this.props

    return super.renderBody(
      <div>
        <header className="plugins-header">
          <FormField
            id="plugin.name"
            isCompact
            name="name"
            value={config.name}
            tabIndex={null}
            onChange={this.handleChange}/>
          <FormText
            id="plugin.plugin"
            isCompact
            value={config.plugin}/>
        </header>
      </div>
    )
  }

  static propTypes = {
    config: object.isRequired,
    options: arrayOf(shape({
      field: string.isRequired,
      required: bool,
      hint: string,
      type: string,
      label: string
    }))
  }

  static defaultProps = {
    ...Accordion.defaultProps,
    options: []
  }
}

module.exports = {
  PluginAccordion
}
