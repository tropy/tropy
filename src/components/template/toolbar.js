import React from 'react'
import { TemplateSelect } from './select'
import { ButtonGroup, Button } from '../button'
import { FormElement } from '../form'
import { IconCopy, IconTrash, IconImport, IconExport } from '../icons'


export class TemplateToolbar extends React.PureComponent {
  handleExport = () => {
    this.props.onExport({
      id: this.props.selected
    })
  }

  render() {
    return (
      <FormElement
        id="prefs.template.select"
        className="select-template"
        size={9}>
        <div className="flex-row">
          <TemplateSelect
            id="prefs.template.select"
            value={this.props.selected}
            placeholder="prefs.template.new"
            tabIndex={0}
            onChange={this.props.onChange}/>
          <ButtonGroup>
            <Button
              icon={<IconCopy/>}
              title="prefs.template.tools.copy"
              isDisabled={this.props.isPristine}
              onClick={this.props.onCopy}/>
            <Button
              icon={<IconTrash/>}
              title="prefs.template.tools.delete"
              isDisabled={this.props.isPristine || this.props.isProtected}
              onClick={this.props.onDelete}/>
            <Button
              icon={<IconImport/>}
              title="prefs.template.tools.import"
              onClick={this.props.onImport}/>
            <Button
              icon={<IconExport/>}
              title="prefs.template.tools.export"
              isDisabled={this.props.isPristine}
              onClick={this.handleExport}/>
          </ButtonGroup>
        </div>
      </FormElement>
    )
  }
}
