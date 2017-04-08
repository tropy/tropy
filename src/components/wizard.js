'use strict'

const React = require('react')
const { Component } = React
const { PropTypes } = require('prop-types')
const { FormattedMessage, intlShape } = require('react-intl')
const { Steps, Step } = require('./steps')
const { connect } = require('react-redux')
const { injectIntl } = require('react-intl')
const { Toolbar } = require('./toolbar')
const { join } = require('path')
const { saveProject } = require('../dialog')
const actions = require('../actions')
const cn = require('classnames')


class Wizard extends Component {
  constructor(props) {
    super(props)

    this.state = {
      name: '',
      file: null
    }
  }

  get hasDefaultFilename() {
    return this.state.file === this.getDefaultFilename()
  }

  getDefaultFilename(name = this.state.name) {
    return name ?
      join(this.props.root, `${name}.tpy`) :
      null
  }

  submit = () => {
    const { name, file } = this.state
    this.props.onSubmit({ name, file })
  }

  handleNameChange = ({ target }) => {
    this.setState({
      name: target.value,
      file: this.getDefaultFilename(target.value)
    })
  }

  handleSaveAsClick = () => {
    saveProject({
      defaultPath: this.state.file || this.props.root
    })
      .then(file => {
        if (file) this.setState({ file })
      })
  }


  render() {
    const { intl } = this.props

    return (
      <div id="wizard">
        <Toolbar draggable={ARGS.frameless}/>

        <Steps>
          <Step>
            <div className="tropy-icon"/>

            <h1><FormattedMessage id="wizard.project.title"/></h1>

            <div className="form-group compact">
              <input
                className="form-control input-lg"
                value={this.state.name || ''}
                type="text"
                placeholder={
                  intl.formatMessage({ id: 'wizard.project.name' })
                }
                onChange={this.handleNameChange}
                autoFocus/>
            </div>

            <div className={cn({
              'form-group': true,
              'save-as': true,
              'custom': !this.hasDefaultFilename
            })}>
              <div className="save-as-link-container">
                <a
                  className="save-as-link"
                  onClick={this.handleSaveAsClick}>
                  <FormattedMessage id="wizard.project.save_as"/>
                </a>
              </div>
              <div className="save-as-controls">
                <input
                  value={this.state.file || ''}
                  type="text"
                  className="form-control input-lg"
                  readOnly/>
                <button
                  className="btn btn-default btn-lg"
                  onClick={this.handleSaveAsClick}>
                  <FormattedMessage id="wizard.project.change"/>
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg btn-block"
              onClick={this.submit}
              disabled={!this.state.file}>

              <FormattedMessage id="wizard.project.submit"/>
            </button>
          </Step>
        </Steps>
      </div>
    )
  }

  static propTypes = {
    intl: intlShape.isRequired,
    root: PropTypes.string,
    onSubmit: PropTypes.func.isRequired
  }

  static defaultProps = {
    root: ARGS.documents
  }
}


module.exports = {
  Wizard: injectIntl(
    connect(
      null,

      (dispatch) => ({
        onSubmit(...args) {
          dispatch(actions.wizard.submit(...args))
        }
      })
    )(Wizard)
  )
}
