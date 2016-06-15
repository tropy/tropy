'use strict'

const React = require('react')
const { IntlProvider } = require('react-intl')
const { Project } = require('../components/project')

const ProjectContainer = () => (
  <IntlProvider locale={ARGS.locale}>
    <Project/>
  </IntlProvider>
)

module.exports = ProjectContainer
