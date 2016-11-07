'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { FormattedMessage, intlShape } = require('react-intl')
const { Steps, Step } = require('./steps')
const { connect } = require('react-redux')
const { injectIntl } = require('react-intl')
const { update } = require('../actions/project')
const { submit } = require('../actions/wizard')
const { Toolbar } = require('./toolbar')


class Wizard extends Component {

  static propTypes = {
    intl: intlShape.isRequired,

    submit: PropTypes.func.isRequired,
    update: PropTypes.func.isRequired,

    project: PropTypes.shape({
      name: PropTypes.string
    })
  }

  constructor(props) {
    super(props)
  }

  update = (event) => {
    this.props.update({ name: event.target.value })
  }

  render() {
    // eslint-disable-next-line no-shadow
    const { submit, project, intl } = this.props

    return (
      <div id="wizard">
        <Toolbar draggable />

        <Steps>
          <Step>
            <img src={'images/wizard/tropy-icon.svg'} className="tropy-icon"
              width={202} height={174}/>

            <h1><FormattedMessage id="wizard.project.title"/></h1>

            <div className="form-group compact">
              <input
                type="text"
                className="form-control input-lg"
                onChange={this.update}
                placeholder={
                  intl.formatMessage({ id: 'wizard.project.name' })
                }
                autoFocus/>
            </div>

            <div className="form-group save-as">
              <div className="save-as-link-container">
                <a href="#" className="save-as-link">
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
              onClick={submit}
              disabled={!project.name}>

              <FormattedMessage id="wizard.project.submit"/>
            </button>
          </Step>
        </Steps>
      </div>
    )
  }
}


module.exports = {
  Wizard: injectIntl(
    connect(

      state => ({
        project: state.project
      }),

      dispatch => ({
        update: (project) => dispatch(update(project, { debounce: true })),
        submit: () => dispatch(submit())
      })

    )(Wizard)
  )
}
