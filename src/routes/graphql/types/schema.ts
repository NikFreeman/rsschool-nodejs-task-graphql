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

const post = new GraphQLObjectType({
  name: 'post',
  fields: () => ({
    id: {
      type: UUIDType,
    },
    title: {
      type: GraphQLString,
    },
    content: {
      type: GraphQLString,
    },
    authorId: {
      type: UUIDType,
    },
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

const userType = new GraphQLObjectType({
  name: 'user',
  fields: () => ({
    id: {
      type: UUIDType,
    },
    name: {
      type: GraphQLString,
    },
    balance: {
      type: GraphQLFloat,
    },
    profile: {
      type: profile,
      resolve: async (user, _, context) => {
        return await context.profile.findUnique({
          where: { userId: user.id },
        });
      },
    },
    posts: {
      type: new GraphQLList(new GraphQLNonNull(post)),
      resolve: async (user, _, context) => {
        return await context.post.findMany({
          where: {
            authorId: user.id,
          },
        });
      },
    },
    userSubscribedTo: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(userType))),
      resolve: async (user, _, context) => {
        return context.user.findMany({
          where: {
            subscribedToUser: {
              some: {
                subscriberId: user.id,
              },
            },
          },
        });
      },
    },
    subscribedToUser: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(userType))),

      resolve: async (user, _, context) => {
        return await context.user.findMany({
          where: {
            userSubscribedTo: {
              some: {
                authorId: user.id,
              },
            },
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
    posts: {
      type: new GraphQLList(new GraphQLNonNull(post)),
      resolve: async (_, _a, context) => {
        return await context.post.findMany();
      },
    },
    post: {
      type: post,
      args: {
        id: {
          type: UUIDType,
        },
      },
      resolve: async (_, { id }, context) => {
        return await context.post.findUnique({
          where: { id },
        });
      },
    },
    users: {
      type: new GraphQLList(new GraphQLNonNull(userType)),
      resolve: async (_source, args, context) => {
        const result = await context.user.findMany({});

        return result;
      },
    },
    user: {
      type: userType,
      args: {
        id: {
          type: UUIDType,
        },
      },
      resolve: async (_source, { id }, context) => {
        return await context.user.findUnique({
          where: { id },
        });
      },
    },
    profiles: {
      type: new GraphQLList(new GraphQLNonNull(profile)),
      resolve: async (_s, _, context) => {
        return await context.profile.findMany();
      },
    },
    profile: {
      type: profile,
      args: {
        id: {
          type: UUIDType,
        },
      },
      resolve: async (_source, { id }, context) => {
        return await context.profile.findUnique({
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
