import React from 'react'
import { ScrollContainer } from '../scroll'
import { Form, FormToggleGroup } from '../form'
import { arrayOf, func, object, string } from 'prop-types'

export class ProjectPrefs extends React.PureComponent {
  render() {
    return (
      <ScrollContainer>
        <Form>
          <FormToggleGroup
            id="prefs.project.base"
            name="base"
            isCompact
            default="none"
            value={this.props.project.base}
            options={this.props.baseOptions}
            onChange={this.props.onChange}/>
        </Form>
      </ScrollContainer>
    )
  }

  static propTypes = {
    project: object.isRequired,
    baseOptions: arrayOf(string).isRequired,
    onChange: func.isRequired
  }

  static defaultProps = {
    baseOptions: ['none', 'project', 'home']
  }
}
