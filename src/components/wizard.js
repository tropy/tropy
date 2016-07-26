'use strict'

const React = require('react')
const { FormattedMessage } = require('react-intl')
const { Steps, Step } = require('./steps')

const Wizard = () => (
  <div id="wizard">
    <Steps>
      <Step>

        <h1><FormattedMessage id="wizard.project.title"/></h1>

        <label>
          <FormattedMessage id="wizard.project.name"/>
        </label>
        <input ref="name"/>

      </Step>
    </Steps>
  </div>
)

module.exports = {
  Wizard
}
