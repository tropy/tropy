'use strict'

const React = require('react')
const { FormattedMessage } = require('react-intl')
const { Titlebar } = require('../toolbar')
const { IconMaze } = require('../icons')
const { bool, func } = require('prop-types')
const cx = require('classnames')

const NoProject = ({ connect, ...props }) => connect(
  <div className={cx('no-project', {
    over: props.isOver && props.canDrop
  })}>
    <Titlebar isOptional/>
    <header className="sidebar">
      <div className="sidebar-body">
        <h3>
          <FormattedMessage id="project.recent_projects"/>
        </h3>
        <nav>
          <ol reversed className="recent-projects">
            <li className="project-name">
              <IconMaze />
              <div className="truncate">Recent Project 7</div>
            </li>
            <li className="project-name">
              <IconMaze />
              <div className="truncate">Recent Project 6</div>
            </li>
            <li className="project-name">
              <IconMaze />
              <div className="truncate">Recent Project 5</div>
            </li>
            <li className="project-name">
              <IconMaze />
              <div className="truncate">Recent Project 4</div>
            </li>
            <li className="project-name">
              <IconMaze />
              <div className="truncate">Recent Project 3</div>
            </li>
            <li className="project-name">
              <IconMaze />
              <div className="truncate">Recent Project 2</div>
            </li>
            <li className="project-name">
              <IconMaze />
              <div className="truncate">Recent Project 1</div>
            </li>
          </ol>
        </nav>
      </div>
    </header>
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
  onProjectCreate: func.isRequired
}

module.exports = {
  NoProject
}
