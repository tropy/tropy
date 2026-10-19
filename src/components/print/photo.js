import { MetadataContainer } from './metadata.js'
import { NoteList } from './note.js'
import { TranscriptionList } from './transcription.js'
import cx from 'classnames'
import { Rotation, addOrientation } from '../../common/iiif.js'
import { Cache } from '../../common/cache.js'

export const Photo = ({
  canOverflow,
  item,
  hasPhotos,
  hasMetadata,
  hasNotes,
  hasTranscriptions,
  photo,
  cache
}) => {
  Object.assign(photo, addOrientation(photo))
  let rotation = new Rotation(photo)

  let hasText = hasNotes || hasTranscriptions
  let ratio

  if (hasPhotos && !(hasMetadata || hasText)) {
    let [x, y] = rotation.ratio(photo)
    ratio = { '--x': x, '--y': y }
  }

  return (
    <div className={cx('photo', 'container', rotation.mode(photo), {
      overflow: canOverflow,
      metadata: hasMetadata,
      notes: hasNotes,
      transcriptions: hasTranscriptions,
      'text-only': !hasPhotos
    })}>
      {hasPhotos && (
        <div className="photo-container">
          <img
            className={photo.print ? null : `iiif rot-${rotation.format('x')}`}
            decoding="sync"
            loading="eager"
            src={photo.print || Cache.url(cache, 'full', photo)}
            style={ratio}/>
        </div>
      )}
      {(hasMetadata || (hasText && !canOverflow)) && (
        <MetadataContainer
          item={hasMetadata ? item : null}
          photo={hasMetadata ? photo : null}
          transcriptions={hasTranscriptions && !canOverflow && (
            <TranscriptionList
              transcriptions={photo.transcriptions}
              heading="print.transcriptions"/>
          )}
          notes={hasNotes && !canOverflow && (
            <NoteList
              notes={photo.notes}
              heading="print.notes"/>
          )}/>
      )}
      {hasTranscriptions && canOverflow &&
        <TranscriptionList transcriptions={photo.transcriptions}/>}
      {hasNotes && canOverflow &&
        <NoteList notes={photo.notes}/>}
    </div>
  )
}
