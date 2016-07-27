'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { FormattedMessage, intlShape } = require('react-intl')
const { Steps, Step } = require('./steps')


class Wizard extends Component {

  constructor(props) {
    super(props)

    this.update = (event) =>
      this.props.update({ name: event.target.value })
  }

  render() {
    const { submit, project, intl } = this.props

    return (
      <div id="wizard">
        <Steps>
          <Step>

            <h1><FormattedMessage id="wizard.project.title"/></h1>

            <input
              type="text"
              value={project.name}
              onChange={this.update}
              placeholder={
                intl.formatMessage({ id: 'wizard.project.name' })
              }/>

            <button onClick={submit()} disabled={!project.name}>
              <FormattedMessage id="wizard.project.submit"/>
            </button>

          </Step>
        </Steps>
      </div>
    )
  }
}

Wizard.propTypes = {
  intl: intlShape.isRequired,

  submit: PropTypes.func.isRequired,
  update: PropTypes.func.isRequired,

  project: PropTypes.shape({
    name: PropTypes.string
  })
}

module.exports = {
  Wizard
}
