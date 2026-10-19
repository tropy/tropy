import { createSelector as memo } from 'reselect'
import { getMetadataFields } from './metadata.js'
import { getItemSelection } from './items.js'
import { pickActiveTranscription } from './transcriptions.js'
import { serialize } from '../editor/serialize.js'

const getPhotoExpanded = (
  photo,
  selections,
  metadata,
  notes,
  notepad,
  transcriptions,
  ontology) => (
  (photo == null) ? null : {
    ...photo,
    data: getMetadataFields(null, {
      compact: true,
      data: metadata[photo.id],
      props: ontology.props,
      template: ontology.template[photo.template]
    }),
    notes: [
      ...photo.notes,
      ...photo.selections.flatMap(id => selections?.[id]?.notes)
    ].map(id => ({
      id,
      ...serialize(notes[id], { format: { html: true }, localize: false }),
      ...notepad[id]
    })),
    transcriptions: [photo, ...photo.selections.map(id => selections?.[id])]
      .map(subject => pickActiveTranscription(
        subject?.transcriptions.map(id => transcriptions[id])))
      .filter(tr => tr?.text)
      .map(({ id, text }) => ({ id, text }))
  }
)

const getItemExpanded =
  (
    item,
    photos,
    selections,
    metadata,
    notes,
    notepad,
    transcriptions,
    tags,
    ontology
  ) => (
    (item == null) ? null : {
      ...item,
      data: getMetadataFields(null, {
        compact: true,
        data: metadata[item.id],
        props: ontology.props,
        template: ontology.template[item.template]
      }),
      photos: item.photos.map(id =>
        getPhotoExpanded(
          photos[id],
          selections,
          metadata,
          notes,
          notepad,
          transcriptions,
          ontology)),
      tags: item.tags.map(t => tags[t].name)
    }
  )

export const getPrintableItems = memo(
  // The visibly selected items, in list order.
  (state) => {
    let ids = getItemSelection(state).elements()
    return (ids.length > 0) ? ids : state.qr.items
  },
  ({ items }) => items,
  ({ photos }) => photos,
  ({ selections }) => selections,
  ({ metadata }) => metadata,
  ({ notes }) => notes,
  ({ notepad }) => notepad,
  ({ transcriptions }) => transcriptions,
  ({ tags }) => tags,
  ({ ontology }) => ontology,
  (
    ids,
    items,
    photos,
    selections,
    metadata,
    notes,
    notepad,
    transcriptions,
    tags,
    ontology
  ) =>
    ids.map(id =>
      getItemExpanded(items[id],
        photos,
        selections,
        metadata,
        notes,
        notepad,
        transcriptions,
        tags,
        ontology))
)
