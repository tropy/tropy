'use strict';

{
  const pkg = require('../package');
  const dom = require('../lib/dom');

  window.onload = () => {
    document.body.innerHTML =
      `${pkg.name} ${pkg.version} ${process.env.NODE_ENV}`;
  };

  dom.append(
    dom.css(`@import '../lib/stylesheets/${process.platform}.css';`),
    document.head);
}
