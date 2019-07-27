'use strict'

const React = require('react')
const { FormattedMessage } = require('react-intl')
const { arrayOf, bool, number, object, string } = require('prop-types')
const cx = require('classnames')

const Note = ({ idx, numbers, __html }) => (
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

const NoteList = ({ notes, heading }) =>
  notes.length === 0 ? null : (
    <div className="notes">
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

module.exports = {
  Note,
  NoteList
}
