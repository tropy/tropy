'use strict'

const React = require('react')
const { FormattedMessage } = require('react-intl')
const { Sidebar, SidebarBody } = require('../sidebar')
const { Titlebar } = require('../toolbar')
const { IconMaze } = require('../icons')
const { arrayOf, bool, func, string } = require('prop-types')
const { basename } = require('path')
const cx = require('classnames')

const NoProject = ({ connect, ...props }) => connect(
  <div className={cx('no-project', {
    over: props.isOver && props.canDrop
  })}>
    <Titlebar isOptional/>
    <Sidebar>
      <SidebarBody>
        <h3>
          <FormattedMessage id="project.recent"/>
        </h3>
        <nav>
          <ol className="recent-projects">
            {props.recent.map(path =>
              <li
                className="project-name"
                key={path}
                onClick={() => props.onProjectOpen(path)}
                title={path}>
                <IconMaze/>
                <div className="truncate">{basename(path)}</div>
              </li>)}
          </ol>
        </nav>
      </SidebarBody>
    </Sidebar>
    <div className="no-project-container">
      <figure className="no-project-illustration"/>
      <h1>
        <FormattedMessage
          id="project.none"
          values={{
            newProject: (
              <a onClick={props.onProjectCreate}>
                <FormattedMessage id="project.new"/>
              </a>
            )
          }}/>
      </h1>
    </div>
  </div>
)

NoProject.propTypes = {
  canDrop: bool,
  isOver: bool,
  connect: func.isRequired,
  onProjectCreate: func.isRequired,
  onProjectOpen: func.isRequired,
  recent: arrayOf(string).isRequired
}

module.exports = {
  NoProject
}
