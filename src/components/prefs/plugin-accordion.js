'use strict'

const React = require('react')
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
            size={8}
            tabIndex={null}
            onChange={this.handleChange}/>
          <FormText
            id="plugin.plugin"
            isCompact
            size={8}
            value={config.plugin}/>
        </header>
      </div>
    )
  }
}

module.exports = {
  PluginAccordion
}
