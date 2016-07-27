'use strict'

const { connect } = require('react-redux')
const { injectIntl } = require('react-intl')
const { Wizard } = require('../components/wizard')
const { update } = require('../actions/project')

module.exports = {
  Wizard: injectIntl(
    connect(

      state => ({
        project: state.project
      }),

      dispatch => ({
        update: (project) => (dispatch(update(project))),
        submit: () => {}
      })

    )(Wizard)
  )
}
