export const locale = ({ intl }) =>
  intl.locale

export const message = ({ intl }, { id }) =>
  intl.messages[id]
