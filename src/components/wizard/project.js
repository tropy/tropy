'use strict'

const React = require('react')
const { PureComponent } = React
const { bool, func, string } = require('prop-types')
const { FormattedMessage, intlShape, injectIntl } = require('react-intl')
const { Step } = require('../steps')
const cx = require('classnames')


class ProjectStep extends PureComponent {

  handleNameKeyDown = (event) => {
    switch (event.key) {
      case 'Escape':
        if (this.name !== '') this.props.onNameChange('')
        break
      case 'Enter':
        this.props.onComplete()
        break
      default:
        return
    }

    event.stopPropagation()
  }

  handleNameChange = (event) => {
    this.props.onNameChange(event.target.value)
  }

  renderName() {
    return (
      <div className="form-group compact">
        <input
          className="form-control input-lg"
          value={this.props.name}
          type="text"
          autoFocus
          placeholder={
            this.props.intl.formatMessage({ id: 'wizard.project.name' })
          }
          onChange={this.handleNameChange}
          onKeyDown={this.handleNameKeyDown}/>
      </div>
    )
  }

  renderFile() {
    return (
      <div className={cx('form-group', 'save-as', {
        custom: !this.props.hasDefaultFilename
      })}>
        <div className="save-as-link-container">
          <a
            className="save-as-link"
            onClick={this.props.onFileChange}>
            <FormattedMessage id="wizard.project.save_as"/>
          </a>
        </div>
        <div className="save-as-controls">
          <input
            className="form-control input-lg"
            value={this.props.file}
            type="text"
            readOnly/>
          <button
            className="btn btn-default btn-lg"
            onClick={this.props.onFileChange}>
            <FormattedMessage id="wizard.project.change"/>
          </button>
        </div>
      </div>
    )
  }

  render() {
    return (
      <Step>
        <div className="tropy-icon"/>
        <h1><FormattedMessage id="wizard.project.title"/></h1>
        {this.renderName()}
        {this.renderFile()}
        <button
          className="btn btn-primary btn-lg btn-block"
          onClick={this.props.onComplete}
          disabled={!this.props.file}>
          <FormattedMessage id="wizard.project.submit"/>
        </button>
      </Step>
    )
  }

  static propTypes = {
    hasDefaultFilename: bool,
    intl: intlShape.isRequired,
    name: string.isRequired,
    file: string.isRequired,
    onNameChange: func.isRequired,
    onFileChange: func.isRequired,
    onComplete: func.isRequired
  }
}

module.exports = {
  ProjectStep: injectIntl(ProjectStep)
}
