'use strict';

/**
 * manual-receipt service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::manual-receipt.manual-receipt');
