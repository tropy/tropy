'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { FormattedMessage, intlShape } = require('react-intl')
const { Steps, Step } = require('./steps')
const { connect } = require('react-redux')
const { injectIntl } = require('react-intl')
const { Toolbar } = require('./toolbar')
const { join } = require('path')
const actions = require('../actions')


class Wizard extends Component {
  constructor(props) {
    super(props)

    this.state = {
      name: '',
      file: null
    }
  }

  getDefaultFilename(name = this.state.name) {
    return name ?
      join(this.props.home, `${name}.tpy`) :
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
  }


  render() {
    const { intl } = this.props

    return (
      <div id="wizard">
        <Toolbar draggable={ARGS.frameless}/>

        <Steps>
          <Step>
            <img
              className="tropy-icon"
              src="images/wizard/tropy-icon.svg"
              width={202}
              height={174}/>

            <h1><FormattedMessage id="wizard.project.title"/></h1>

            <div className="form-group compact">
              <input
                className="form-control input-lg"
                value={this.state.name}
                type="text"
                placeholder={
                  intl.formatMessage({ id: 'wizard.project.name' })
                }
                onChange={this.handleNameChange}
                autoFocus/>
            </div>

            <div className="form-group save-as">
              <div className="save-as-link-container">
                <a
                  className="save-as-link"
                  onClick={this.handleSaveAsClick}>
                  <FormattedMessage id="wizard.project.save_as"/>
                </a>
              </div>
              <div className="save-as-controls">
                <input
                  type="text"
                  className="form-control input-lg"
                  value="Path"
                  readOnly/>
                <button className="btn btn-default btn-lg">
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
    home: PropTypes.string,
    onSubmit: PropTypes.func.isRequired
  }

  static defaultProps = {
    home: ARGS.documents
  }
}


module.exports = {
  Wizard: injectIntl(
    connect(
      null,

      (dispatch) => ({
        onSubmit(project) {
          dispatch(actions.wizard.submit(project))
        }
      })
    )(Wizard)
  )
}
