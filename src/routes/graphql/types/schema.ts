/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import { UUIDType } from './uuid.js';

const memberTypeId = new GraphQLEnumType({
  name: 'MemberTypeId',
  values: {
    basic: {},
    business: {},
  },
});

const member = new GraphQLObjectType({
  name: 'member',
  fields: () => ({
    id: { type: memberTypeId },
    discount: {
      type: GraphQLFloat,
    },
    postsLimitPerMonth: { type: GraphQLInt },
  }),
});

const profile = new GraphQLObjectType({
  name: 'profile',
  fields: () => ({
    id: { type: UUIDType },
    isMale: { type: GraphQLBoolean },
    yearofBirth: { type: GraphQLInt },
    userId: { type: UUIDType },
    memberType: {
      type: member,
      resolve: async (profile, _, context) => {
        return await context.MemberType.findUnique({
          where: {
            id: profile.memberTypeId,
          },
        });
      },
    },
  }),
});

const QueryType = new GraphQLObjectType({
  name: 'query',
  fields: () => ({
    memberTypes: {
      type: new GraphQLList(new GraphQLNonNull(member)),
      resolve: async (_s, _, context) => {
        return await context.memberType.findMany();
      },
    },
    memberType: {
      type: member,
      args: { id: { type: memberTypeId } },
      resolve: async (_, { id }, context) => {
        return await context.memberType.findUnique({
          where: { id },
        });
      },
    },
  }),
});

const MutationType = new GraphQLObjectType({
  name: 'mutation',
  fields: { helloMut: { type: GraphQLString }, inputMut: { type: GraphQLString } },
});

export const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
  types: [memberTypeId, member, profile, UUIDType],
});
