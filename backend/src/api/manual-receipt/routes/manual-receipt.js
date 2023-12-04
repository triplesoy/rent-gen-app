// 'use strict';

// /**
//  * manual-receipt router
//  */

// const { createCoreRouter } = require('@strapi/strapi').factories;

// module.exports = createCoreRouter('api::manual-receipt.manual-receipt');


module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/manual-receipts',
      handler: 'manual-receipt.create',
    }
  ],
};
