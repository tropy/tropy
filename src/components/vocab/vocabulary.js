'use strict'

const React = require('react')
const { PureComponent } = React
const { object } = require('prop-types')
const { FormField, FormGroup } = require('../form')
const { noop } = require('../../common/util')

class Vocabulary extends PureComponent {

  render() {
    return (
      <section className="vocabulary panel">
        <div className="panel-header">
          <h1 className="panel-heading">
            <input type="checkbox"/>
            {this.props.vocab.title}
          </h1>
        </div>
        <div className="panel-body">
          <FormGroup isCompact>
            <label className="control-label col-4">URI</label>
            <div className="col-8">
              <div className="form-text">
                {this.props.vocab.uri}
              </div>
            </div>
          </FormGroup>
          <FormField
            id="vocab.prefix"
            name="prefix"
            value=""
            isCompact
            size={8}
            onChange={noop}/>
          <FormGroup isCompact>
            <label className="control-label col-4">Description</label>
            <div className="col-8">
              <div className="form-text">
                {this.props.vocab.description}
              </div>
            </div>
          </FormGroup>
          <ul className="property-list">
            <li className="property">
              <fieldset>
                <FormField
                  id="property.label"
                  name="label"
                  value="Title"
                  isCompact
                  size={8}
                  onChange={function () {}}/>
                <FormGroup className="compact">
                  <label className="control-label col-4">ID</label>
                  <div className="col-8">
                    <div className="form-text">
                      http://purl.org/dc/elements/1.1/title
                    </div>
                  </div>
                </FormGroup>
                <FormGroup className="compact">
                  <label className="control-label col-4">
                    Definition
                  </label>
                  <div className="col-8">
                    <div className="form-text">
                      A name given to the resource.
                    </div>
                  </div>
                </FormGroup>
              </fieldset>
            </li>
          </ul>
        </div>
      </section>
    )
  }

  static propTypes = {
    properties: object.isRequired,
    vocab: object.isRequired
  }
}

module.exports = {
  Vocabulary
}

