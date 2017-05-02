'use strict'

const React = require('react')
const { PureComponent } = React

//eslint-disable-next-line
class TemplateEditor extends PureComponent {
  render() {
    return (
      <div className="template editor">
        <ul className="properties">
          <li className="property">
            <div className="form-group">
              <label className="col-3">Property</label>
              <div className="col-9">
                <select className="form-control">
                  <option>http://purl.org/dc/elements/1.1/title</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="col-3">Label</label>
              <div className="col-9">
                <input className="form-control" type="text" value="Title"/>
              </div>
            </div>
          </li>
        </ul>
      </div>
    )
  }
}

module.exports = {
  TemplateEditor
}
