import React from 'react'
import { ItemPanelGroup } from './panel'
import { ItemContainer } from './container'
import { Resizable } from '../resizable'
import { SASS } from '../../constants'
import { pick } from '../../common/util'

import {
  arrayOf, bool, func, object, number, shape
} from 'prop-types'



export class ItemView extends React.PureComponent {
  itemContainer = React.createRef()

  get offset() {
    return (this.props.isItemMode) ?
      0 : `calc(100% - ${this.props.offset}px)`
  }

  get style() {
    return { transform: `translate3d(${this.offset}, 0, 0)` }
  }

  focusNotePad = () => {
    this.itemContainer.current?.notepad.current?.focus()
  }

  handleNoteCreate = () => {
    let delay = 50

    if (!this.props.isItemMode) {
      delay += 800
      this.props.onItemOpen({
        id: this.props.items[0].id,
        photos: [this.props.photo.id],
        selection: this.props.activeSelection
      })
    }

    if (this.props.note) {
      this.props.onNoteSelect()
    }

    setTimeout(this.focusNotePad, delay)
  }

  render() {
    const {
      keymap,
      offset,
      panel,
      photo,
      onPanelDragStop,
      onPanelResize,
      isItemMode,
      isProjectClosing,
      isReadOnly,
      ...props
    } = this.props

    return (
      <section className="item-view" style={this.style}>
        <Resizable
          edge={isItemMode ? 'right' : 'left'}
          value={offset}
          min={SASS.PANEL.MIN_WIDTH}
          max={SASS.PANEL.MAX_WIDTH}
          onResize={onPanelResize}
          onDragStop={onPanelDragStop}>
          <ItemPanelGroup {...pick(props, ItemPanelGroup.props)}
            panel={panel}
            photo={photo}
            note={this.props.note}
            keymap={keymap}
            isItemMode={isItemMode}
            isDisabled={isProjectClosing}
            isReadOnly={isReadOnly}
            onNoteCreate={this.handleNoteCreate}
            onNoteDelete={this.props.onNoteDelete}/>
        </Resizable>
        <ItemContainer
          ref={this.itemContainer}
          note={this.props.note}
          photo={photo}
          isDisabled={!isItemMode || isProjectClosing}
          isReadOnly={isReadOnly}
          onContextMenu={this.props.onContextMenu}
          onPhotoConsolidate={this.props.onPhotoConsolidate}
          onPhotoCreate={this.props.onPhotoCreate}
          onPhotoSave={this.props.onPhotoSave}
          onPhotoSelect={this.props.onPhotoSelect}
          onUiUpdate={this.props.onUiUpdate}/>
      </section>
    )
  }


  static propTypes = {
    items: arrayOf(
      shape({
        id: number.isRequired,
        tags: arrayOf(number),
        deleted: bool
      })
    ),

    keymap: object.isRequired,
    offset: number.isRequired,
    panel: object,
    activeSelection: number,
    note: object,
    photo: object,
    isItemMode: bool.isRequired,
    isProjectClosing: bool,
    isReadOnly: bool,

    onContextMenu: func.isRequired,
    onItemOpen: func.isRequired,
    onNoteDelete: func.isRequired,
    onNoteSave: func.isRequired,
    onNoteSelect: func.isRequired,
    onPhotoConsolidate: func.isRequired,
    onPhotoCreate: func.isRequired,
    onPhotoSave: func.isRequired,
    onPhotoSelect: func.isRequired,
    onPanelResize: func.isRequired,
    onPanelDragStop: func.isRequired,
    onUiUpdate: func.isRequired
  }
}
