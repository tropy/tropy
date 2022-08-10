import React from 'react'
import { FormattedMessage } from 'react-intl'
import { Titlebar } from '../toolbar.js'
import { Button, ToggleButtonGroup } from '../button.js'
import { arrayOf, func, string } from 'prop-types'
import { FormElement, FormGroup } from '../form.js'
import { RecentProjects } from './recent.js'


export const NoProject = (props) => (
  <div className="no-project">
    <RecentProjects/>

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
            size="lg"
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
  onProjectCreate: func.isRequired,
  onProjectOpen: func.isRequired,
  recent: arrayOf(string).isRequired
}
