import React from 'react'
import { connect } from 'react-redux'
import { MetadataList } from './list.js'
import { MetadataSection } from './section.js'
import { ScrollContainer } from '../scroll/container.js'
import { PhotoInfo } from '../photo/info.js'
import { ItemInfo } from '../item/info.js'
import { SelectionInfo } from '../selection/info.js'
import * as act from '../../actions/index.js'

import {
  getActiveSelection,
  getItemFields,
  getPhotoFields,
  getSelectedItemTemplate,
  getSelectedItems,
  getSelectedPhoto,
  getSelectionFields
} from '../../selectors/index.js'


class MetadataPanel extends React.PureComponent {
  fields = [null, null, null]

  get isEmpty() {
    return this.props.items.length === 0
  }

  get isBulk() {
    return this.props.items.length > 1
  }

  get hasPhotoFields() {
    return this.props.photo != null && !this.props.photo.pending
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
        id: [this.props.photo.id],
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
      let id = (data.type === 'item')
        ? this.props.items.map(it => it.id)
        : [this.props?.[data.type]?.id]

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
        title="panel.metadata.item"
        onTemplateChange={this.handleItemTemplateChange}
        onContextMenu={this.handleItemContextMenu}>
        <MetadataList
          ref={this.setItemFields}
          edit={this.props.edit}
          fields={this.props.fields.item}
          isDisabled={this.props.isDisabled}
          onEdit={this.props.onEdit}
          onEditCancel={this.props.onEditCancel}
          onContextMenu={this.handleItemContextMenu}
          onChange={this.props.onMetadataSave}
          onAfter={this.handleAfterItemFields}
          onBefore={this.handleBeforeItemFields}
          onCreate={this.props.onMetadataAdd}/>
        {!this.isBulk &&
          <ItemInfo item={this.props.items[0]}/>}
      </MetadataSection>
    )
  }

  renderPhotoFields() {
    return this.hasPhotoFields && (
      <MetadataSection
        isDisabled={this.props.isDisabled}
        template={this.props.photo.template}
        title="panel.metadata.photo"
        onTemplateChange={this.handlePhotoTemplateChange}
        onContextMenu={this.handlePhotoContextMenu}>
        <MetadataList
          ref={this.setPhotoFields}
          edit={this.props.edit}
          fields={this.props.fields.photo}
          isDisabled={this.props.isDisabled}
          onEdit={this.props.onEdit}
          onEditCancel={this.props.onEditCancel}
          onContextMenu={this.handlePhotoContextMenu}
          onChange={this.props.onMetadataSave}
          onAfter={this.handleAfterPhotoFields}
          onBefore={this.handleBeforePhotoFields}
          onCreate={this.props.onMetadataAdd}/>
        <PhotoInfo
          photo={this.props.photo}
          isDisabled={this.props.isDisabled}/>
      </MetadataSection>
    )
  }

  renderSelectionFields() {
    return this.hasSelectionFields && (
      <MetadataSection
        isDisabled={this.props.isDisabled}
        template={this.props.selection.template}
        title="panel.metadata.selection"
        onTemplateChange={this.handleSelectionTemplateChange}
        onContextMenu={this.handleSelectionContextMenu}>
        <MetadataList
          ref={this.setSelectionFields}
          edit={this.props.edit}
          fields={this.props.fields.selection}
          isDisabled={this.props.isDisabled}
          onEdit={this.props.onEdit}
          onEditCancel={this.props.onEditCancel}
          onContextMenu={this.handleSelectionContextMenu}
          onChange={this.props.onMetadataSave}
          onAfter={this.handleAfterSelectionFields}
          onBefore={this.handleBeforeSelectionFields}
          onCreate={this.props.onMetadataAdd}/>
        <SelectionInfo selection={this.props.selection}/>
      </MetadataSection>
    )
  }

  render() {
    return (
      <ScrollContainer>
        {this.renderItemFields()}
        {this.renderPhotoFields()}
        {this.renderSelectionFields()}
      </ScrollContainer>
    )
  }
}

const MetadataPanelContainer = connect(
  (state) => ({
    edit: state.edit.field,
    fields: {
      item: getItemFields(state),
      photo: getPhotoFields(state),
      selection: getSelectionFields(state)
    },
    items: getSelectedItems(state),
    photo: getSelectedPhoto(state),
    selection: getActiveSelection(state),
    template: getSelectedItemTemplate(state)
  }),

  (dispatch) => ({
    onMetadataAdd(...args) {
      dispatch(act.metadata.add(...args))
    },

    onTemplateChange(type, ...args) {
      dispatch(act[type].template.change(...args))
    }
  }), null, { forwardRef: true }
)(MetadataPanel)

export {
  MetadataPanelContainer as MetadataPanel
}
