import { basename } from 'path'
import React from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import { Sidebar, SidebarBody } from '../sidebar'
import { Titlebar } from '../toolbar'
import { IconMaze, IconWarningSm } from '../icons'
import { Toggle } from '../form'
import { Button, ButtonGroup } from '../button'
import { arrayOf, bool, func, string } from 'prop-types'
import { FormElement } from '../form'
import cx from 'classnames'


export const NoProject = ({ connect, ...props }) => connect(
  <div className={cx('no-project', {
    over: props.isOver && props.canDrop
  })}>
    <div className="recent-projects-view">
      <Titlebar isOptional/>
      <nav>
        <ol className="recent-projects">
          {props.recent.map(path =>
            <li
              className="recent-project"
              key={path}
              onClick={() => props.onProjectOpen(path)}
              title={path}>
              <IconMaze/>
              <div className="flex-col">
                <div className="name">
                  <div className="truncate">{basename(path)}</div>
                  {
                    Math.random() > 0.75 && (
                      <Button
                        icon={<IconWarningSm/>}
                        title="Find Project File"/>
                    )
                  }
                </div>
                <ul className="stats">
                  <li>1 day ago</li>
                  <li>{Math.round(1167 * Math.random())} items</li>
                  <li>{Math.round(4959 * Math.random())} photos</li>
                  <li>{Math.round(182 * Math.random())} notes</li>
                </ul>
              </div>
            </li>)}
        </ol>
      </nav>
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
