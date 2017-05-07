'use strict'

const React = require('react')
const { PureComponent } = React
const { Accordion, AccordionGroup } = require('../accordion')
const { FormField, FormText } = require('../form')
const { object } = require('prop-types')
const { noop } = require('../../common/util')

const PropertyList = () => (
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
        <FormText
          id="property.uri"
          isCompact
          value="http://..."/>
        <FormText
          id="property.description"
          isCompact
          value=""/>
        <FormText
          id="property.comment"
          isCompact
          value=""/>
      </fieldset>
    </li>
  </ul>
)

class VocabPane extends PureComponent {

  renderVocabulary(vocab, idx) {
    return (
      <Accordion id={idx}>
        <h1 className="panel-heading">
          <input type="checkbox"/>
          {vocab.title}
        </h1>
        <FormText
          id="vocab.uri"
          isCompact
          value={vocab.uri}/>
        <FormField
          id="vocab.prefix"
          isCompact
          name="prefix"
          value=""
          size={8}
          onChange={noop}/>
        <FormText
          id="vocab.description"
          isCompact
          value={vocab.description}/>
        <PropertyList/>
      </Accordion>
    )
  }

  render() {
    const vocabs = Object.values(this.props.vocab)

    return (
      <AccordionGroup className="form-horizontal">
        {vocabs.map(this.renderVocabulary)}
      </AccordionGroup>
    )
  }

  static propTypes = {
    properties: object.isRequired,
    vocab: object.isRequired
  }
}

module.exports = {
  VocabPane
}
