'use strict';

const service = require('feathers-mongoose');
const images = require('./images-model');
const hooks = require('./hooks');

module.exports = function() {
  const app = this;

  const options = {
    Model: images,
    lean: true
  };

  // Initialize our service with any options it requires
  app.use('/images', service(options));

  // Get our initialize service to that we can bind hooks
  const imagesService = app.service('/images');

  // Set up our before hooks
  imagesService.before(hooks.before);

  // Set up our after hooks
  imagesService.after(hooks.after);
};
