'use strict'

const React = require('react')
const { PureComponent } = React
const { TemplateSelect } = require('./select')
const { ButtonGroup, IconButton } = require('../button')
const { FormGroup, Label } = require('../form')
const { arrayOf, func, shape, string } = require('prop-types')

const {
  IconNew,
  IconCopy,
  IconTrash,
  IconImport,
  IconExport,
} = require('../icons')


class TemplateToolbar extends PureComponent {

  render() {
    return (
      <FormGroup className="select-template">
        <Label id="prefs.template.select"/>
        <div className="col-9 flex-row center">
          <TemplateSelect
            templates={this.props.templates}
            selected={this.props.selected}
            isRequired={false}
            placeholder="prefs.template.new"
            onChange={this.props.onChange}/>
          <ButtonGroup>
            <IconButton
              icon={<IconNew/>}
              isDisabled={!this.props.selected}
              onClick={this.props.onClear}/>
            <IconButton
              isDisabled
              icon={<IconCopy/>}/>
            <IconButton
              icon={<IconTrash/>}
              isDisabled={!this.props.selected}
              onClick={this.props.onDelete}/>
            <IconButton icon={<IconImport/>}
              onClick={this.props.onImport}/>
            <IconButton
              isDisabled={!this.props.selected}
              icon={<IconExport/>}/>
          </ButtonGroup>
        </div>
      </FormGroup>
    )
  }

  static propTypes = {
    templates: arrayOf(shape({
      id: string.isRequired,
      name: string
    })).isRequired,
    selected: string,
    onChange: func.isRequired,
    onClear: func.isRequired,
    onDelete: func.isRequired,
    onImport: func.isRequired
  }
}

module.exports = {
  TemplateToolbar
}
