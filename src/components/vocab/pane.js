'use strict'

const React = require('react')
const { PureComponent } = React
const { PrefPane } = require('../prefs/pane')
const { Accordion, AccordionGroup } = require('../accordion')
const { FormField, FormText } = require('../form')
const { PropertyList } = require('../property')
const { noop } = require('../../common/util')
const { array, bool, string } = require('prop-types')

class VocabPane extends PureComponent {
  renderVocabulary(vocab) {
    return (
      <Accordion key={vocab.uri}>
        <h1 className="panel-heading">
          <input type="checkbox"/>
          {vocab.title}
        </h1>
        <FormText
          id="vocab.uri"
          isCompact
          size={8}
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
          isOptional
          value={vocab.description}/>
        <PropertyList properties={vocab.properties}/>
      </Accordion>
    )
  }

  render() {
    return (
      <PrefPane
        name={this.props.name}
        isActive={this.props.isActive}>
        <AccordionGroup className="form-horizontal">
          {this.props.vocab.map(this.renderVocabulary)}
        </AccordionGroup>
      </PrefPane>
    )
  }

  static propTypes = {
    isActive: bool,
    name: string.isRequired,
    vocab: array.isRequired
  }

  static defaultProps = {
    name: 'vocab'
  }
}

module.exports = {
  VocabPane
}
