'use strict'

const React = require('react')

const { ProjectSidebar } = require('./sidebar')
const { Items } = require('./items')
const { Panels } = require('./panels')
const { Viewer } = require('./viewer')

const Project = () => (
  <div>
    <ProjectSidebar project={{ name: 'Tropy' }}/>
    <Items/>
    <Panels/>
    <Viewer/>
  </div>
)

module.exports = Project
