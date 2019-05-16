'use strict'

const React = require('react')
const { FormattedMessage } = require('react-intl')
const { Titlebar } = require('../toolbar')
const { bool, func } = require('prop-types')
const cx = require('classnames')

const NoProject = ({ connect, ...props }) => connect(
  <div className={cx('no-project', {
    over: props.isOver && props.canDrop
  })}>
    <Titlebar isOptional/>
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
