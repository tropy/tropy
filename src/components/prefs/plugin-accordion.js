'use strict'

const React = require('react')
const { Accordion } = require('../accordion')
const { IconBook16 } = require('../icons')


class PluginAccordion extends Accordion {
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
    return super.renderBody(
      <div>
        <header className="vocab-header">
          Header
        </header>
      </div>
    )
  }
}

module.exports = {
  PluginAccordion
}
