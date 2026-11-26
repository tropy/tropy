import act from '../../../actions/api.js'
import { withUrlId } from '../schema.js'

export default async function view (fastify) {
  fastify.get('/view', {
    schema: {
      operationId: 'projects.view',
      summary: 'Show what the user sees in a project',
      description: 'What the user is looking at in the project window. ' +
        'search: the search the user asked for, as items.find arguments ' +
        '(view, list, tag, q, sort, reverse); pass them to GET /items ' +
        '(or /lists/:id/items) to get the same items in the same order. ' +
        'selected: the selected items, photos, selections ' +
        'and notes, each in display order. cursor: the item, photo, ' +
        'selection and note the user is looking at. Read-only; ' +
        'reveals the user\'s current view and selection.',
      params: withUrlId()
    }
  }, ({ rsvp }) => rsvp(act.view.show()))
}
