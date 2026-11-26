import { select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { API } from '../../constants/index.js'
import { selectList, selectSort } from '../../slices/nav/index.js'
import {
  selectActiveItemIds,
  selectNavCursor,
  selectNoteSelection,
  selectPhotoSelection
} from '../../slices/nav/selectors.js'

export class ViewShow extends Command {
  *exec () {
    return yield select(selectView)
  }
}

ViewShow.register(API.VIEW.SHOW)

const selectView = (state) => {
  let { view, query, tags } = state.nav.search
  let { column, asc } = selectSort(state)
  let photos = []
  let selections = []

  for (let id of selectPhotoSelection(state).elements()) {
    if (id in state.selections)
      selections.push(id)
    else
      photos.push(id)
  }

  return {
    mode: state.nav.mode,
    search: {
      view: view.name,
      list: selectList(state) ?? null,
      tag: tags,
      q: query,
      sort: column,
      reverse: !asc
    },
    selected: {
      items: selectActiveItemIds(state),
      photos,
      selections,
      notes: selectNoteSelection(state).elements()
    },
    cursor: selectNavCursor(state)
  }
}
