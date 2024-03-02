import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { Source, graphql } from 'graphql';
import { schema } from './types/schema.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {
      console.log('req--->', req.body);
      const { query, variables } = req.body;

      const source = new Source(query);

      return graphql({ schema, source });
    },
  });
};

export default plugin;
