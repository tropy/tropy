'use strict';

{
  const pkg = require('../package');

  window.onload = () => {
    document.body.innerHTML =
      `${pkg.name} ${pkg.version} ${process.env.NODE_ENV}`;
  };

  {
    const css = document.createElement('style');
    css.type = 'text/css';
    css.innerText = `@import '../lib/stylesheets/${process.platform}.css';`;
    document.head.appendChild(css);
  }
}
