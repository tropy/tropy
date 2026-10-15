import cx from 'classnames'
import { Form } from './form.js'
import { Modal } from './modal.js'

// NB: props and return value correspond to Electron's MessageBox!
export const MessageBox = ({
  buttons = ['OK'],
  cancelId = 0,
  checkboxChecked = false,
  checkboxLabel,
  defaultId = 0,
  detail,
  message,
  onClose,
  title,
  type = 'none'
}) => {
  let handleClose = ({ cancel, value, data }) => {
    let response = cancel ? cancelId : Number(value)

    onClose({
      cancel: response === cancelId,
      value: response,
      data: { checked: data?.checked != null }
    })
  }

  return (
    <Modal className={cx('message-box', type)} onClose={handleClose}>
      <Form method="dialog">
        {title && <h1 className="title">{title}</h1>}
        <p className="message">{message}</p>
        {detail && <p className="detail">{detail}</p>}
        {checkboxLabel && (
          <label className="checkbox">
            <input
              type="checkbox"
              name="checked"
              defaultChecked={checkboxChecked}/>
            {checkboxLabel}
          </label>
        )}
        <footer>
          {buttons.map((label, idx) => (
            <button
              key={idx}
              className={cx('btn min-width', idx === defaultId ? 'btn-primary' : 'btn-default')}
              autoFocus={idx === defaultId}
              value={idx}>
              {label}
            </button>
          ))}
        </footer>
      </Form>
    </Modal>
  )
}
