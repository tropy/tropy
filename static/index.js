'use strict';

{
  const pkg = require('../package');

  window.onload = () => {
    document.documentElement.innerHTML =
      `${pkg.name} ${pkg.version} ${process.env.NODE_ENV}`;
  };
}
