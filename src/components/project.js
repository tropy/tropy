'use strict'

const React = require('react')

const { ProjectSidebar } = require('./project-sidebar')
const { Items } = require('./items')
const { PanelGroup } = require('./panelgroup')
const { Viewer } = require('./viewer')

const Project = () => (
  <div id="project">
    <ProjectSidebar/>
    <main>
      <Items/>
    </main>
    <section id="item">
      <PanelGroup/>
      <Viewer/>
    </section>
  </div>
)

module.exports = {
  Project
}
