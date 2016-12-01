'use strict'

const React = require('react')

const NoteList = () => (
  <ul className="note-list">
    <li className="note active">
      <div className="css-multiline-truncate">
        Denver, Colorado Dec. 24th, 1899.
        Mr. Wm. A. Pinkerton,
        Chicago, Illinois
        Dear Sir: --
        Replying to Mr. R.A. Pinkerton's letter to you dated the 20th inst. I
        note he asks four questions:
      </div>
    </li>
    <li className="note">
      <div className="css-multiline-truncate">
        Name in full: H. Frank Clark
        Age: 31
        Height: 5-11 3/4
        Weight: 170
        Build: Medium
        Nationality: American
        Place of Birth: Oswego NY
        Married of Single: Married
      </div>
    </li>
    <li className="note">
      <div className="css-multiline-truncate">
        I am in receipt of yours of the 16th inst. enclosing Application and
        History of H. Frank Cary, which I have read over very carefully and note
        his references have been run down very carefully in Chicago and that
        every person seen gives him a first class character and seem to be very
        honest about it.
      </div>
    </li>
  </ul>
)

module.exports = { NoteList }
