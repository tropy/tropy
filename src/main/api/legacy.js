// Redirects legacy URLs:
// /project/:id/… to /projects/:id/…,
// and URLs without project id (e.g. /project/items)
// to the current project.
// Static routes take precedence over the wildcard route,
// so /project/items redirects to the current project.
export default async function legacy (fastify) {
  let redirect = (target) => ({
    schema: { hide: true },
    handler: ({ url }, reply) =>
      reply.redirect(url.replace(/^\/project/, target), 308)
  })

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
    fastify.all(`/project/${collection}`, redirect('/projects/current'))
    fastify.all(`/project/${collection}/*`, redirect('/projects/current'))
  }

  fastify.all('/project/*', redirect('/projects'))
}
