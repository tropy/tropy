'use strict'

const { connect } = require('react-redux')
const { ProjectSidebar } = require('../components/sidebar')

module.exports = {
  ProjectSidebar:
    connect(state => ({ project: state.project }))(ProjectSidebar)
}
