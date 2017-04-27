'use strict'

const React = require('react')
const { PureComponent } = React
const { connect } = require('react-redux')


class PrefsContainer extends PureComponent {
  render() {
    return (
      <div className="preferences"/>
    )
  }
}

module.exports = {
  PrefsContainer: connect(
    state => ({
      project: state.project,
      keymap: state.keymap,
      properties: state.properties,
      templates: state.templates
    })
  )(PrefsContainer)
}
