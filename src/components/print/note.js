import React from 'react'
import { FormattedMessage } from 'react-intl'
import { arrayOf, bool, number, object, string } from 'prop-types'
import cx from 'classnames'

export const Note = ({ idx, numbers, __html }) => (
  <div className="note-container">
    <label>
      <FormattedMessage id="print.note" values={{ idx }}/>
    </label>
    <div
      className={cx('note', { numbers })}
      dangerouslySetInnerHTML={{ __html }}/>
  </div>
)

Note.propTypes = {
  idx: number.isRequired,
  numbers: bool,
  __html: string.isRequired
}

export const NoteList = ({ notes, heading }) =>
  notes.length === 0 ? null : (
    <div className="note-list">
      {heading &&
        <h5 className="notes-heading">
          <FormattedMessage id={heading}/>
        </h5>}
      {notes.map((note, idx) =>
        <Note
          key={note.id}
          idx={idx + 1}
          numbers={note.numbers}
          __html={note.html}/>)}
    </div>
  )

NoteList.propTypes = {
  notes: arrayOf(object).isRequired,
  heading: string
}
