'use strict'

const React = require('react')
const { PureComponent } = React
const { connect } = require('react-redux')
const { BufferedResizable } = require('../resizable')
const { Esper } = require('../esper')
const { NotePad } = require('../note')
const { bool, func, number, object, shape } = require('prop-types')
const act = require('../../actions')


class ItemContainer extends PureComponent {
  handleEsperResize = (height) => {
    this.props.onUiUpdate({ esper: { height } })
  }

  render() {
    return (
      <div className="item-container">
        <BufferedResizable
          edge="bottom"
          value={this.props.esper.height}
          isRelative
          onChange={this.handleEsperResize}
          min={256}>
          <Esper
            isDisabled={this.props.isDisabled}
            photo={this.props.photo}
            onPhotoSave={this.props.onPhotoSave}
            onSelectionCreate={this.props.onSelectionCreate}/>
        </BufferedResizable>
        <NotePad
          ref={this.setNotePad}
          note={this.props.note}
          isDisabled={this.props.isDisabled || !this.props.photo}
          isItemOpen={this.props.isOpen}
          keymap={this.props.keymap.NotePad}
          onChange={this.props.onNoteChange}/>
      </div>
    )
  }

  static propTypes = {
    esper: shape({
      height: number.isRequired
    }).isRequired,
    isDisabled: bool.isRequired,
    isOpen: bool.isRequired,
    keymap: object.isRequired,
    note: object,
    photo: object,
    onNoteChange: func.isRequired,
    onPhotoSave: func.isRequired,
    onSelectionCreate: func.isRequired,
    onUiUpdate: func.isRequired
  }
}


module.exports = {
  ItemContainer: connect(
    state => ({
      esper: state.ui.esper,
      keymap: state.keymap,
    }),

    dispatch => ({
      onPhotoSave(...args) {
        dispatch(act.photo.save(...args))
      },

      onSelectionCreate(...args) {
        dispatch(act.selection.create(...args))
      }
    })
  )(ItemContainer)
}
