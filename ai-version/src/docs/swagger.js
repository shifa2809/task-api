const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Supabase Auth API',
      version: '1.0.0',
      description:
        'Secure REST API using Supabase as the identity provider. Use POST /auth/login ' +
        'to get an access token, then click "Authorize" below and paste it in as a Bearer token ' +
        'to call protected routes.',
    },
    servers: [
      {
        url: '/',
        description: 'Current server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Supabase access token, obtained from POST /auth/login',
        },
      },
    },
  },
  // Files containing the JSDoc @swagger annotations
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
