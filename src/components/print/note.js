import { FormattedMessage } from 'react-intl'
import cx from 'classnames'

export const Note = ({ idx, numbers, __html }) => (
  <div className="text-container">
    <label>
      <FormattedMessage id="print.note" values={{ idx }}/>
    </label>
    <div
      className={cx('text-body', 'note', { numbers })}
      dangerouslySetInnerHTML={{ __html }}/>
  </div>
)

export const NoteList = ({ notes, heading }) =>
  notes.length === 0 ? null : (
    <div className="text-list note-list">
      {heading && (
        <h5 className="text-heading">
          <FormattedMessage id={heading}/>
        </h5>
      )}
      {notes.map((note, idx) => (
        <Note
          key={note.id}
          idx={idx + 1}
          numbers={note.numbers}
          __html={note.html}/>
      ))}
    </div>
  )
