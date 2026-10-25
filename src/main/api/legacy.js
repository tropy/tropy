// Redirects legacy URLs (e.g. /project/items) to the current project.
// Static routes take precedence over the :project routes,
// so /project/items redirects instead of resolving.
export default async function legacy (app) {
  let redirect = ({ url }, reply) =>
    reply.redirect(url.replace(/^\/project/, '/project/current'), 308)

  for (let collection of [
    'import',
    'items',
    'lists',
    'tags',
    'data',
    'notes',
    'transcriptions',
    'photos',
    'selections'
  ]) {
    app.all(`/project/${collection}`, redirect)
    app.all(`/project/${collection}/*`, redirect)
  }
}
