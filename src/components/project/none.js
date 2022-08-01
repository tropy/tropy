import { basename } from 'path'
import React from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import { Sidebar, SidebarBody } from '../sidebar'
import { Titlebar } from '../toolbar'
import { IconMaze } from '../icons'
import { Toggle } from '../form'
import { Button, ButtonGroup } from '../button'
import { arrayOf, bool, func, string } from 'prop-types'
import { FormElement } from '../form'
import cx from 'classnames'


export const NoProject = ({ connect, ...props }) => connect(
  <div className={cx('no-project', {
    over: props.isOver && props.canDrop
  })}>
    <div className="recent-projects">
      <Titlebar isOptional/>
      List of recent projects
    </div>
    <div className="new-project">
      <Titlebar isOptional/>
      <figure/>
      <h1>Create a new project</h1>
      <form>
        <h2>Enter a name for the project</h2>
        <FormElement>
          <input
            className="form-control input-lg"
            value=""
            type="text"
            autoFocus/>
        </FormElement>
        <h2>Choose the project type</h2>
        <div className="form-group">
          <ButtonGroup>
            <Toggle
              id={"test1"}
              key={"test1"}
              name={"type"}
              tabIndex={0}
              type="radio"
              isButton
              size="lg"
              label="Standard"
              value={"standard"}/>
            <Toggle
              id={"test2"}
              key={"test2"}
              name={"type"}
              tabIndex={0}
              type="radio"
              isButton
              size="lg"
              label="Advanced"
              value={"advanced"}/>
          </ButtonGroup>
          <p className="form-text">Copies photos to project bundle on import.</p>
        </div>
        <Button
          isBlock
          isDisabled={!props.file}
          isPrimary
          onClick={props.onComplete}
          size="xl"
          text="Create Project"/>
      </form>
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
