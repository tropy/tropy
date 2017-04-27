'use strict'

const React = require('react')
const { PureComponent } = React
const { connect } = require('react-redux')
const { bool } = require('prop-types')
const { TitleBar } = require('../titlebar')


class PrefsContainer extends PureComponent {

  renderTitleBar() {
    return (!this.props.isFrameless) ? null : (
      <TitleBar title="preferences.title"/>
    )
  }

  render() {
    return (
      <div className="preferences">
        {this.renderTitleBar()}
      </div>
    )
  }

  static propTypes = {
    isFrameless: bool,
  }

  static defaultProps = {
    isFrameless: ARGS.frameless
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
