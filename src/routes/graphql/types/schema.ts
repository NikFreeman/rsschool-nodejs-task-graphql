import { MemberTypeId, memberTypeFields } from './../../member-types/schemas';
import { MemberType } from '@prisma/client';
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInt,
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

const memberTypes = new GraphQLObjectType({
  name: 'memberTypes',
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
    id: { type: UUIDType },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    authorId: {
      type: UUIDType,
    },
  }),
});

// const profile = new GraphQLObjectType({
//   name: 'profile',
//   fields: () => ({
//     id: { type: UUIDType },
//     isMale: { type: GraphQLBoolean },
//     yearofBirth: { type: GraphQLInt },
//     userId: { type: UUIDType },
//     member: {
//       type: memberType,
//       resolve: async (profile, _, prisma) => {
//         // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
//         return await prisma.memberType.findUnique({
//           // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
//           where: { id },
//         });
//       },
//     },
//   }),
// });

const QueryType = new GraphQLObjectType({
  name: 'query',
  fields: () => ({
    memberType: {
      type: memberTypes,
      args: {
        id: { memberTypeId },
      },
      resolve: async (_source, { id }, context) => {
        return await context.memberType.findUnique({ where: { id } });
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
});
