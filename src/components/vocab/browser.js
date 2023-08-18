import React from 'react'
import { PrefPane } from '../prefs/pane'
import { AccordionGroup } from '../accordion'
import { VocabAccordion } from './accordion'
import { array, bool, func, string } from 'prop-types'
import { Button } from '../button'
import { IconPlus } from '../icons'


export class VocabPane extends React.PureComponent {
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
