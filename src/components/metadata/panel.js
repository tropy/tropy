import React from 'react'
import { connect } from 'react-redux'
import { MetadataList } from './list'
import { MetadataSection } from './section'
import { PhotoInfo } from '../photo/info'
import { ItemInfo } from '../item/info'
import { SelectionInfo } from '../selection/info'
import * as act from '../../actions'
import { shapes } from '../util'
import { arrayOf, bool, func, object, shape, string } from 'prop-types'

import {
  getActiveSelection,
  getAllTemplatesByType,
  getItemFields,
  getMetadataCompletions,
  getPhotoFields,
  getPropertyList,
  getSelectedItemTemplate,
  getSelectedItems,
  getSelectedPhotoTemplate,
  getSelectedPhotos,
  getSelectionFields
} from '../../selectors'


class MetadataPanel extends React.PureComponent {
  fields = [null, null, null]

  get isEmpty() {
    return this.props.items.length === 0
  }

  get isBulk() {
    return this.props.items.length > 1
  }

  get hasSelectionFields() {
    return this.props.selection != null && !this.props.selection.pending
  }

  next = (i = 0) => {
    for (let ii = i + 3; i < ii; ++i) {
      let fields = this.fields[i % 3]
      let next = (fields != null) && fields.next()
      if (next) return fields.edit(next.property.id)
    }
  }

  prev = (i = 2) => {
    for (let ii = i - 2; i >= ii; --i) {
      let fields = this.fields[i % 3]
      let prev = (fields != null) && fields.prev()
      if (prev) return fields.edit(prev.property.id)
    }
  }

  setItemFields = (item) => {
    this.fields[0] = item
  }

  setPhotoFields = (photo) => {
    this.fields[1] = photo
  }

  setSelectionFields = (selection) => {
    this.fields[2] = selection
  }

  handleAfterItemFields = () => {
    this.next(1)
  }

  handleBeforeItemFields = () => {
    this.prev(2)
  }

  handleAfterPhotoFields = () => {
    this.next(2)
  }

  handleBeforePhotoFields = () => {
    this.prev(0)
  }

  handleAfterSelectionFields = () => {
    this.next(0)
  }

  handleBeforeSelectionFields = () => {
    this.prev(1)
  }

  handleItemTemplateChange = (template, hasChanged) => {
    if (hasChanged || this.isBulk) {
      this.props.onTemplateChange('item', {
        id: this.props.items.map(it => it.id),
        template: template.id
      })
    }
  }

  handlePhotoTemplateChange = (template, hasChanged) => {
    if (hasChanged) {
      this.props.onTemplateChange('photo', {
        id: this.props.photos.map(p => p.id),
        template: template.id
      })
    }
  }

  handleSelectionTemplateChange = (template, hasChanged) => {
    if (hasChanged) {
      this.props.onTemplateChange('selection', {
        id: [this.props.selection.id],
        template: template.id
      })
    }
  }

  handleItemContextMenu = (event, data = {}) => {
    this.handleContextMenu(event, { ...data, type: 'item' })
  }

  handlePhotoContextMenu = (event, data = {}) => {
    this.handleContextMenu(event, { ...data, type: 'photo' })
  }

  handleSelectionContextMenu = (event, data = {}) => {
    this.handleContextMenu(event, { ...data, type: 'selection' })
  }

  handleContextMenu(event, data = {}) {
    if (!this.props.isDisabled) {
      let id = (data.type === 'item') ?
        this.props.items.map(it => it.id) :
        [this.props?.[data.type]?.id]

      let context = data.property ?
        'metadata-field' : 'metadata-list'

      this.props.onContextMenu(event, context, { ...data, id })
    }
  }

  renderItemFields() {
    return !this.isEmpty && (
      <MetadataSection
        count={this.props.items.length}
        isDisabled={this.props.isDisabled}
        isMixed={this.props.template.mixed}
        template={this.props.template.id}
        templates={this.props.templates.item}
        title="panel.metadata.item"
        onTemplateChange={this.handleItemTemplateChange}
        onContextMenu={this.handleItemContextMenu}>
        <MetadataList
          ref={this.setItemFields}
          completions={this.props.completions}
          edit={this.props.edit}
          fields={this.props.fields.item}
          isDisabled={this.props.isDisabled}
          onEdit={this.props.onEdit}
          onEditCancel={this.props.onEditCancel}
          onContextMenu={this.handleItemContextMenu}
          onCopy={this.props.onMetadataCopy}
          onChange={this.props.onMetadataSave}
          onAfter={this.handleAfterItemFields}
          onBefore={this.handleBeforeItemFields}
          onCreate={this.props.onMetadataAdd}
          options={this.props.fields.available}/>
        {!this.isBulk &&
          <ItemInfo item={this.props.items[0]}/>}
      </MetadataSection>
    )
  }

  renderPhotoFields() {
    return this.props.photos.length > 0 && (
      <MetadataSection
        count={this.props.photos.length}
        isDisabled={this.props.isDisabled}
        isMixed={this.props.photoTemplate.mixed}
        template={this.props.photoTemplate.id}
        templates={this.props.templates.photo}
        title="panel.metadata.photo"
        onTemplateChange={this.handlePhotoTemplateChange}
        onContextMenu={this.handlePhotoContextMenu}>
        <MetadataList
          ref={this.setPhotoFields}
          completions={this.props.completions}
          edit={this.props.edit}
          fields={this.props.fields.photo}
          isDisabled={this.props.isDisabled}
          onEdit={this.props.onEdit}
          onEditCancel={this.props.onEditCancel}
          onContextMenu={this.handlePhotoContextMenu}
          onCopy={this.props.onMetadataCopy}
          onChange={this.props.onMetadataSave}
          onAfter={this.handleAfterPhotoFields}
          onBefore={this.handleBeforePhotoFields}
          onCreate={this.props.onMetadataAdd}
          options={this.props.fields.available}/>
        <PhotoInfo
          edit={this.props.edit}
          photo={this.props.photos[0]}
          isDisabled={this.props.isDisabled}
          onChange={this.props.onPhotoSave}
          onEdit={this.props.onEdit}
          onEditCancel={this.props.onEditCancel}
          onOpenInFolder={this.props.onOpenInFolder}/>
      </MetadataSection>
    )
  }

  renderSelectionFields() {
    return this.hasSelectionFields && (
      <MetadataSection
        isDisabled={this.props.isDisabled}
        template={this.props.selection.template}
        templates={this.props.templates.selection}
        title="panel.metadata.selection"
        onTemplateChange={this.handleSelectionTemplateChange}
        onContextMenu={this.handleSelectionContextMenu}>
        <MetadataList
          ref={this.setSelectionFields}
          completions={this.props.completions}
          edit={this.props.edit}
          fields={this.props.fields.selection}
          isDisabled={this.props.isDisabled}
          onEdit={this.props.onEdit}
          onEditCancel={this.props.onEditCancel}
          onContextMenu={this.handleSelectionContextMenu}
          onCopy={this.props.onMetadataCopy}
          onChange={this.props.onMetadataSave}
          onAfter={this.handleAfterSelectionFields}
          onBefore={this.handleBeforeSelectionFields}
          onCreate={this.props.onMetadataAdd}
          options={this.props.fields.available}/>
        <SelectionInfo
          selection={this.props.selection}/>
      </MetadataSection>
    )
  }


  render() {
    return (
      <div className="scroll-container">
        {this.renderItemFields()}
        {this.renderPhotoFields()}
        {this.renderSelectionFields()}
      </div>
    )
  }


  static propTypes = {
    completions: arrayOf(string).isRequired,
    edit: object,
    fields: shape({
      available: arrayOf(object).isRequired,
      item: arrayOf(shapes.field).isRequired,
      photo: arrayOf(shapes.field).isRequired,
      selection: arrayOf(shapes.field).isRequired
    }).isRequired,
    isDisabled: bool,
    items: arrayOf(shapes.subject),
    photos: arrayOf(shapes.subject),
    selection: shapes.subject,
    template: shapes.template,
    photoTemplate: shape.template,
    templates: shape({
      item: arrayOf(shapes.template).isRequired,
      photo: arrayOf(shapes.template).isRequired,
      selection: arrayOf(shapes.template).isRequired
    }).isRequired,
    onContextMenu: func.isRequired,
    onEdit: func,
    onEditCancel: func,
    onMetadataAdd: func.isRequired,
    onMetadataCopy: func.isRequired,
    onMetadataDelete: func.isRequired,
    onMetadataSave: func.isRequired,
    onOpenInFolder: func.isRequired,
    onPhotoSave: func.isRequired,
    onTemplateChange: func.isRequired
  }
}

const MetadataPanelContainer = connect(
    (state) => ({
      completions: getMetadataCompletions(state),
      edit: state.edit.field,
      fields: {
        available: getPropertyList(state),
        item: getItemFields(state),
        photo: getPhotoFields(state),
        selection: getSelectionFields(state)
      },
      items: getSelectedItems(state),
      photos: getSelectedPhotos(state),
      selection: getActiveSelection(state),
      template: getSelectedItemTemplate(state),
      photoTemplate: getSelectedPhotoTemplate(state),
      templates: getAllTemplatesByType(state)
    }),

    (dispatch) => ({
      onMetadataAdd(...args) {
        dispatch(act.metadata.add(...args))
      },

      onMetadataCopy(...args) {
        dispatch(act.metadata.copy(...args))
      },

      onMetadataDelete(...args) {
        dispatch(act.metadata.delete(...args))
      },

      onTemplateChange(type, ...args) {
        dispatch(act[type].template.change(...args))
      }
    }), null, { forwardRef: true }
  )(MetadataPanel)

export {
  MetadataPanelContainer as MetadataPanel
}
