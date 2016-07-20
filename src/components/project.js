'use strict'

const React = require('react')

const { ProjectSidebar } = require('../containers/sidebar')
const { Items, Item } = require('./items')

const Project = () => (
  <div id="project">
    <ProjectSidebar/>
    <Items/>
    <Item/>
  </div>
)

module.exports = {
  Project
}
