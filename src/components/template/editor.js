'use strict'

const React = require('react')
const { PureComponent } = React
const { TemplateSelect } = require('./select')
const { IconButton } = require('../button')
const { arrayOf, func, shape, string } = require('prop-types')
const { get } = require('../../common/util')

const {
  IconNew,
  IconCopy,
  IconTrash,
  IconImport,
  IconExport,
  IconGrip,
  IconPlusCircle,
  IconMinusCircle
} = require('../icons')


function TemplateEditorHead(props) {
  return (
    <div className="form-group select-template">
      <label className="control-label col-3" htmlFor="">Template</label>
      <div className="col-9 flex-row center">
        <TemplateSelect
          templates={props.templates}
          selected={props.selected}
          isRequired={false}
          onChange={props.onChange}/>
        <div className="btn-group">
          <IconButton icon={<IconNew/>}/>
          <IconButton icon={<IconCopy/>}/>
          <IconButton icon={<IconTrash/>}/>
          <IconButton icon={<IconImport/>}/>
          <IconButton icon={<IconExport/>}/>
        </div>
      </div>
    </div>
  )
}

TemplateEditorHead.propTypes = {
  templates: arrayOf(shape({
    uri: string.isRequired,
    name: string
  })).isRequired,
  selected: string,
  onChange: func.isRequired
}


class TemplateEditor extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      template: {}
    }
  }

  handleTemplateChange = (template) => {
    this.setState({ template: { ...template } })
  }

  render() {
    return (
      <div className="template editor form-horizontal">
        <header className="template-header">
          <TemplateEditorHead
            selected={this.state.template.uri}
            templates={this.props.templates}
            onChange={this.handleTemplateChange}/>

          <div className="form-group compact">
            <label className="control-label col-3" htmlFor="">Name</label>
            <div className="col-9">
              <input className="form-control" type="text" value="Core Item"/>
            </div>
          </div>
          <div className="form-group">
            <label className="control-label col-3" htmlFor="">ID</label>
            <div className="col-9">
              <input className="form-control" type="text"
                value="https://schema.tropy.org/core-item"/>
            </div>
          </div>
          <div className="form-group">
            <div className="col-12 text-right">
              <button className="btn btn-primary min-width">Save</button>
            </div>
          </div>
        </header>

        <ul className="properties">
          <li className="property">
            <div className="property-container">
              <IconGrip/>
              <div className="form-group compact">
                <label className="control-label col-3" htmlFor="">
                  Property
                </label>
                <div className="col-9">
                  <select className="form-control">
                    <option>http://purl.org/dc/elements/1.1/title</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="control-label col-3" htmlFor="">Label</label>
                <div className="col-9">
                  <input className="form-control" type="text" value="Title"/>
                </div>
              </div>
            </div>
            <IconButton icon={<IconPlusCircle/>}/>
            <IconButton icon={<IconMinusCircle/>}/>
          </li>
        </ul>
      </div>
    )
  }

  static propTypes = {
    templates: arrayOf(shape({
      uri: string.isRequired,
      name: string
    })).isRequired,
    onCreate: func.isRequired,
    onSave: func.isRequired
  }
}

module.exports = {
  TemplateEditor
}
