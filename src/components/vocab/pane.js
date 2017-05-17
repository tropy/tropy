'use strict'

const React = require('react')
const { PureComponent } = React
const { FormattedMessage } = require('react-intl')
const { PrefPane } = require('../prefs/pane')
const { Accordion, AccordionGroup } = require('../accordion')
const { FormField, FormText } = require('../form')
const { PropertyList } = require('../property')
const { noop } = require('../../common/util')
const { array, bool, string } = require('prop-types')
const { IconBook16 } = require('../icons')

class VocabPane extends PureComponent {
  renderVocabulary(vocab) {
    return (
      <Accordion key={vocab.uri}>
        <div className="flex-row center panel-header-container">
          <IconBook16/>
          <h1 className="panel-heading">
            {vocab.title}
          </h1>
        </div>
        <header className="vocab-header">
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
            isOptional
            size={8}
            value={vocab.description}/>
        </header>
        <h2 className="vocab-heading">
          <FormattedMessage
            id="prefs.vocab.classes"
            values={{ count: vocab.classes.length }}/>
        </h2>
        <PropertyList properties={vocab.classes}/>
        <h2 className="vocab-heading">
          <FormattedMessage
            id="prefs.vocab.properties"
            values={{ count: vocab.properties.length }}/>
        </h2>
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
