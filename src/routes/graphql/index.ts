/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { Source, graphql, parse, validate } from 'graphql';

import { schema } from './types/schema.js';
import depthLimit from 'graphql-depth-limit';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;
  const DEPTH_LIMIT = 5;

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
      const { query, variables } = req.body;
      const source = new Source(query);
      const validationErrors = validate(schema, parse(source), [depthLimit(DEPTH_LIMIT)]);

      if (validationErrors.length !== 0) {
        return {
          errors: validationErrors,
        };
      }

      return graphql({ schema, source, variableValues: variables, contextValue: prisma });
    },
  });
};

export default plugin;
