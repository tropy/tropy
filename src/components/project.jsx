'use strict'

const React = require('react')

const { ProjectSidebar } = require('./sidebar')
const { Items } = require('./items')
const { Panels } = require('./panels')
const { Viewer } = require('./viewer')

const Project = () => (
  <div id="project">
    <ProjectSidebar project={{ name: 'Tropy' }}/>
    <Items/>
    <div id="item">
      <Panels/>
      <Viewer/>
    </div>
  </div>
)

module.exports = Project
