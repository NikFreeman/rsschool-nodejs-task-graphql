/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import { UUIDType } from './uuid.js';

const MemberTypeId = new GraphQLEnumType({
  name: 'MemberTypeId',
  values: {
    basic: { value: 'basic' },
    business: { value: 'business' },
  },
});

const member = new GraphQLObjectType({
  name: 'member',
  fields: () => ({
    id: { type: MemberTypeId },
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
    yearOfBirth: { type: GraphQLInt },
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
      args: { id: { type: MemberTypeId } },
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
      resolve: async (_, { id }, context) => {
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
      resolve: async (_, { id }, context) => {
        return await context.profile.findUnique({
          where: { id },
        });
      },
    },
  }),
});

const CreateUserInput = new GraphQLInputObjectType({
  name: 'CreateUserInput',
  fields: () => ({
    name: {
      type: GraphQLString,
    },
    balance: {
      type: GraphQLFloat,
    },
  }),
});
const CreatePostInput = new GraphQLInputObjectType({
  name: 'CreatePostInput',
  fields: () => ({
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
const CreateProfileInput = new GraphQLInputObjectType({
  name: 'CreateProfileInput',
  fields: () => ({
    isMale: {
      type: GraphQLBoolean,
    },
    yearOfBirth: {
      type: GraphQLInt,
    },
    memberTypeId: {
      type: MemberTypeId,
    },
    userId: {
      type: UUIDType,
    },
  }),
});
const ChangePostInput = new GraphQLInputObjectType({
  name: 'ChangePostInput',
  fields: () => ({
    title: {
      type: GraphQLString,
    },
    content: {
      type: GraphQLString,
    },
  }),
});
const ChangeProfileInput = new GraphQLInputObjectType({
  name: 'ChangeProfileInput',
  fields: () => ({
    isMale: {
      type: GraphQLBoolean,
    },
    yearOfBirth: {
      type: GraphQLInt,
    },
    memberTypeId: {
      type: MemberTypeId,
    },
  }),
});
const ChangeUserInput = new GraphQLInputObjectType({
  name: 'ChangeUserInput',
  fields: () => ({
    name: {
      type: GraphQLString,
    },
    balance: {
      type: GraphQLFloat,
    },
  }),
});
const MutationType = new GraphQLObjectType({
  name: 'mutation',
  fields: () => ({
    createPost: {
      type: post,
      args: {
        dto: {
          type: new GraphQLNonNull(CreatePostInput),
        },
      },
      resolve: async (_, { dto }, context) => {
        return context.post.create({
          data: dto,
        });
      },
    },
    createUser: {
      type: userType,
      args: {
        dto: {
          type: new GraphQLNonNull(CreateUserInput),
        },
      },
      resolve: async (_, { dto }, context) => {
        return context.user.create({
          data: dto,
        });
      },
    },
    createProfile: {
      type: profile,
      args: {
        dto: {
          type: new GraphQLNonNull(CreateProfileInput),
        },
      },
      resolve: async (_, { dto }, context) => {
        return context.profile.create({
          data: dto,
        });
      },
    },
    deletePost: {
      type: GraphQLBoolean,
      args: {
        id: {
          type: new GraphQLNonNull(UUIDType),
        },
      },
      resolve: async (_, { id }, context) => {
        await context.post.delete({
          where: {
            id,
          },
        });
      },
    },
    deleteProfile: {
      type: GraphQLBoolean,
      args: {
        id: {
          type: new GraphQLNonNull(UUIDType),
        },
      },
      resolve: async (_, { id }, context) => {
        await context.profile.delete({
          where: {
            id,
          },
        });
      },
    },
    deleteUser: {
      type: GraphQLBoolean,
      args: {
        id: {
          type: new GraphQLNonNull(UUIDType),
        },
      },
      resolve: async (_, { id }, context) => {
        await context.user.delete({
          where: {
            id,
          },
        });
      },
    },
    changePost: {
      type: post,
      args: {
        id: {
          type: UUIDType,
        },
        dto: {
          type: ChangePostInput,
        },
      },
      resolve: async (_, { id, dto }, context) => {
        return context.post.update({
          where: { id },
          data: dto,
        });
      },
    },
    changeProfile: {
      type: profile,
      args: {
        id: {
          type: UUIDType,
        },
        dto: {
          type: ChangeProfileInput,
        },
      },
      resolve: async (_, { id, dto }, context) => {
        return context.profile.update({
          where: { id },
          data: dto,
        });
      },
    },
    changeUser: {
      type: userType,
      args: {
        id: {
          type: UUIDType,
        },
        dto: {
          type: ChangeUserInput,
        },
      },
      resolve: async (_, { id, dto }, context) => {
        return context.user.update({
          where: { id },
          data: dto,
        });
      },
    },
    subscribeTo: {
      type: userType,

      args: {
        userId: {
          type: UUIDType,
        },
        authorId: {
          type: UUIDType,
        },
      },
      resolve: async (_, { userId, authorId }, context) => {
        return context.user.update({
          where: {
            id: userId,
          },
          data: {
            userSubscribedTo: {
              create: {
                authorId: authorId,
              },
            },
          },
        });
      },
    },
    unsubscribeFrom: {
      type: GraphQLBoolean,
      args: {
        userId: {
          type: UUIDType,
        },
        authorId: {
          type: UUIDType,
        },
      },
      resolve: async (_, { userId, authorId }, context) => {
        await context.subscribersOnAuthors.delete({
          where: {
            subscriberId_authorId: {
              subscriberId: userId,
              authorId: authorId,
            },
          },
        });
      },
    },
  }),
});

export const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
  types: [
    member,
    MemberTypeId,
    post,
    userType,
    profile,
    UUIDType,
    CreateUserInput,
    CreatePostInput,
    CreateProfileInput,
    ChangePostInput,
    ChangeProfileInput,
    ChangeUserInput,
  ],
});
