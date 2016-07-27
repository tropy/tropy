'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { FormattedMessage, injectIntl, intlShape } = require('react-intl')
const { Steps, Step } = require('./steps')

let Wizard = ({ submit, update, project, intl }) => (
  <div id="wizard">
    <Steps>
      <Step>

        <h1><FormattedMessage id="wizard.project.title"/></h1>

        <input
          type="text"
          value={project.name}
          onChange={update()}
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

Wizard.propTypes = {
  intl: intlShape.isRequired,

  submit: PropTypes.function,
  update: PropTypes.function,

  project: PropTypes.shape({
    name: PropTypes.string
  })
}

module.exports.Component = Wizard

Wizard = connect(
  state => ({
    project: state.project || {}
  }),
  () => ({
    update: () => {},
    submit: () => {}
  })
)(Wizard)

Wizard = injectIntl(Wizard)

module.exports.Wizard = Wizard
