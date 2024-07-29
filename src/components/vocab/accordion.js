import React from 'react'
import { FormattedMessage } from 'react-intl'
import { Accordion } from '../accordion.js'
import { FormField, FormLink, FormText } from '../form.js'
import { ResourceList } from '../resource/list.js'
import { Button, ButtonGroup } from '../button.js'
import { IconBook, IconBookLock, IconTrash, IconExport } from '../icons.js'


export class VocabAccordion extends Accordion {
  get isProtected() {
    return this.props.vocab.isProtected
  }

  get icon() {
    if (this.isProtected) return <IconBookLock/>
    return <IconBook/>
  }

  handleDelete = () => {
    this.props.onDelete(this.props.vocab.id)
  }

  handleChange = (data) => {
    this.props.onSave({ id: this.props.vocab.id, ...data })
  }

  handleExport = () => {
    this.props.onExport(this.props.vocab.id)
  }

  renderHeader() {
    return super.renderHeader(
      <div className="flex-row center panel-header-container">
        {this.icon}
        <h1 className="panel-heading truncate">
          {this.props.vocab.title}
        </h1>
        <ButtonGroup>
          <Button
            icon={<IconExport/>}
            title="prefs.vocab.export"
            onClick={this.handleExport}/>
          {!this.props.vocab.isProtected && (
            <Button
              icon={<IconTrash/>}
              onClick={this.handleDelete}/>
          )}
        </ButtonGroup>
      </div>
    )
  }

  renderBody() {
    const { vocab } = this.props

    return super.renderBody(
      <div>
        <header className="vocab-header">
          <FormLink
            id="vocab.id"
            isCompact
            size={8}
            value={vocab.id}
            onClick={this.props.onOpenLink}/>
          <FormField
            id="vocab.prefix"
            isCompact
            name="prefix"
            value={vocab.prefix}
            size={8}
            tabIndex={null}
            onChange={this.handleChange}/>
          <FormText
            id="vocab.description"
            isCompact
            isOptional
            size={8}
            value={vocab.description}/>
          <FormLink
            id="vocab.seeAlso"
            isCompact
            isOptional
            size={8}
            value={vocab.seeAlso}
            onClick={this.props.onOpenLink}/>
        </header>
        <h2 className="vocab-heading">
          <FormattedMessage
            id="prefs.vocab.classes"
            values={{ count: vocab.classes.length }}/>
        </h2>
        <ResourceList
          resources={vocab.classes}
          onOpenLink={this.props.onOpenLink}
          onSave={this.props.onClassSave}/>
        <h2 className="vocab-heading">
          <FormattedMessage
            id="prefs.vocab.properties"
            values={{ count: vocab.properties.length }}/>
        </h2>
        <ResourceList
          resources={vocab.properties}
          onOpenLink={this.props.onOpenLink}
          onSave={this.props.onPropsSave}/>
        <h2 className="vocab-heading">
          <FormattedMessage
            id="prefs.vocab.datatypes"
            values={{ count: vocab.datatypes.length }}/>
        </h2>
        <ResourceList
          resources={vocab.datatypes}
          onOpenLink={this.props.onOpenLink}
          onSave={this.props.onPropsSave}/>
      </div>
    )
  }
}
