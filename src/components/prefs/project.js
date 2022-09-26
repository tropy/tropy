import React from 'react'
import { ScrollContainer } from '../scroll'
import { Form, FormField, FormToggle, FormToggleGroup } from '../form'
import { arrayOf, func, object, string } from 'prop-types'

export class ProjectPrefs extends React.PureComponent {
  render() {
    return (
      <ScrollContainer>
        <Form>
          <FormField
            id="prefs.project.name"
            name="name"
            isCompact
            isReadOnly={this.props.project.isReadOnly}
            isRequired
            tabIndex={0}
            value={this.props.project.name}
            onChange={this.props.onChange}/>
          <FormField
            id="prefs.project.id"
            name="id"
            isCompact
            isReadOnly
            isRequired
            value={this.props.project.id}/>
          <FormField
            id="prefs.project.path"
            name="path"
            isCompact
            isReadOnly
            isRequired
            value={this.props.project.path}/>
          <hr/>
          <FormToggleGroup
            id="prefs.project.base"
            name="base"
            isReadOnly={this.props.project.isReadOnly}
            default="none"
            value={this.props.project.base}
            options={this.props.baseOptions}
            tabIndex={0}
            onChange={this.props.onChange}/>
          <hr/>
          <FormField
            id="prefs.project.watch.folder"
            name="watch.folder"
            isCompact
            tabIndex={0}
            type="directory"
            value={this.props.project.watch.folder}
            onChange={this.props.onChange}/>
          <FormToggle
            id="prefs.project.watch.usePolling"
            isDisabled={!this.props.project.watch.folder}
            name="watch.usePolling"
            value={!!this.props.project.watch.usePolling}
            onChange={this.props.onChange}/>
          <hr/>
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
    baseOptions: [null, 'project', 'home']
  }
}
