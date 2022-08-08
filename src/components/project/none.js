import { basename } from 'path'
import React from 'react'
import { FormattedMessage } from 'react-intl'
import { Titlebar } from '../toolbar'
import { IconMaze, IconWarningSm, IconXMedium } from '../icons'
import { Button, ToggleButtonGroup } from '../button'
import { arrayOf, bool, func, string } from 'prop-types'
import { FormElement, FormGroup } from '../form'
import { SearchField } from '../search'
import cx from 'classnames'


export const NoProject = ({ connect, ...props }) => connect(
  <div className={cx('no-project', {
    over: props.isOver && props.canDrop
  })}>
    <div className="recent-projects-view">
      <Titlebar isOptional/>
      <SearchField/>
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
              <Button icon={<IconXMedium/>}/>
            </li>)}
        </ol>
      </nav>
    </div>
    <div className="new-project">
      <Titlebar isOptional/>
      <figure/>
      <h1><FormattedMessage id="project.new.title"/></h1>
      <form>
        <h2><FormattedMessage id="project.new.name"/></h2>
        <FormElement>
          <input
            className="form-control input-lg"
            type="text"
            autoFocus/>
        </FormElement>
        <h2><FormattedMessage id="project.new.type.label"/></h2>
        <FormGroup>
          <ToggleButtonGroup
            id="project.new.type"
            name="type"
            options={['standard', 'advanced']}
            onChange={console.log}
            value={'standard'}/>
          <p className="form-text">
            <FormattedMessage id="project.new.type.hint.standard"/>
          </p>
        </FormGroup>
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
