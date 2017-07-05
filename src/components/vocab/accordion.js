'use strict'

const React = require('react')
const { FormattedMessage } = require('react-intl')
const { Accordion } = require('../accordion')
const { FormField, FormLink, FormText } = require('../form')
const { PropertyList } = require('../property')
const { IconButton } = require('../button')
const { IconBook16, IconBookLock, IconTrash } = require('../icons')
const { arrayOf, func, object, shape, string } = require('prop-types')


class VocabAccordion extends Accordion {
  get isProtected() {
    return this.props.vocab.isProtected
  }

  get icon() {
    if (this.isProtected) return <IconBookLock/>
    return <IconBook16/>
  }

  handleDelete = () => {
    this.props.onDelete(this.props.vocab.id)
  }

  handleChange = (data) => {
    this.props.onSave({ id: this.props.vocab.id, ...data })
  }


  renderHeader() {
    return super.renderHeader(
      <div className="flex-row center panel-header-container">
        {this.icon}
        <h1 className="panel-heading">
          {this.props.vocab.title}
        </h1>
        {!this.props.vocab.isProtected &&
        <IconButton
          icon={<IconTrash/>}
          onClick={this.handleDelete}/>}
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
        <PropertyList
          properties={vocab.classes}
          onOpenLink={this.props.onOpenLink}
          onSave={this.props.onClassSave}/>
        <h2 className="vocab-heading">
          <FormattedMessage
            id="prefs.vocab.properties"
            values={{ count: vocab.properties.length }}/>
        </h2>
        <PropertyList
          properties={vocab.properties}
          onOpenLink={this.props.onOpenLink}
          onSave={this.props.onPropsSave}/>
        <h2 className="vocab-heading">
          <FormattedMessage
            id="prefs.vocab.datatypes"
            values={{ count: vocab.datatypes.length }}/>
        </h2>
        <PropertyList
          properties={vocab.datatypes}
          onOpenLink={this.props.onOpenLink}
          onSave={this.props.onPropsSave}/>
      </div>
    )
  }

  static propTypes = {
    vocab: shape({
      id: string.isRequired,
      prefix: string,
      title: string,
      description: string,
      seeAlso: string,
      classes: arrayOf(object).isRequired,
      properties: arrayOf(object).isRequired
    }).isRequired,
    onClassSave: func.isRequired,
    onDelete: func.isRequired,
    onOpenLink: func.isRequired,
    onPropsSave: func.isRequired,
    onSave: func.isRequired
  }
}

module.exports = {
  VocabAccordion
}
