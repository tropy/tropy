'use strict'

const React = require('react')
const { PureComponent } = React
const { PrefPane } = require('../prefs/pane')
const { AccordionGroup } = require('../accordion')
const { VocabAccordion } = require('./accordion')
const { array, bool, func, string } = require('prop-types')
const { Button } = require('../button')
const { IconPlus } = require('../icons')


class VocabPane extends PureComponent {
  render() {
    return (
      <PrefPane
        name={this.props.name}
        isActive={this.props.isActive}>
        <div className="scroll-container">
          <AccordionGroup
            className="form-horizontal"
            tabIndex={0}>
            {this.props.vocab.map(vocab =>
              <VocabAccordion
                key={vocab.id}
                id={vocab.id}
                vocab={vocab}
                onClassSave={this.props.onClassSave}
                onDelete={this.props.onDelete}
                onExport={this.props.onExport}
                onOpenLink={this.props.onOpenLink}
                onPropsSave={this.props.onPropsSave}
                onSave={this.props.onSave}/>)}
          </AccordionGroup>
        </div>
        <footer className="vocab-footer">
          <Button
            icon={<IconPlus/>}
            onClick={this.props.onImport}/>
        </footer>
      </PrefPane>
    )
  }

  static propTypes = {
    isActive: bool,
    name: string.isRequired,
    vocab: array.isRequired,
    onClassSave: func.isRequired,
    onDelete: func.isRequired,
    onExport: func.isRequired,
    onImport: func.isRequired,
    onOpenLink: func.isRequired,
    onPropsSave: func.isRequired,
    onSave: func.isRequired
  }

  static defaultProps = {
    name: 'vocab'
  }
}

module.exports = {
  VocabPane
}
