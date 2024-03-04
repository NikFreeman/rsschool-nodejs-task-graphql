import { User } from '@prisma/client';
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import { UUIDType } from './types/uuid.js';
import DataLoader from 'dataloader';
import { UserType } from './types/user.js';
import { PrismaClient } from '@prisma/client';
import { Post } from './types/post.js';

import {
  ResolveTree,
  parseResolveInfo,
  simplifyParsedResolveInfoFragmentWithType,
} from 'graphql-parse-resolve-info';
import { Context } from './types/context.js';
import { Profile } from './types/profile.js';
import { Static } from '@fastify/type-provider-typebox';
import { createPostSchema } from '../posts/schemas.js';
import { createUserSchema } from '../users/schemas.js';
import { changeProfileByIdSchema, createProfileSchema } from '../profiles/schemas.js';

export const dataLoaders = (prisma: PrismaClient) => ({
  membersLoader: new DataLoader(async (ids: readonly string[]) => {
    const memberTypes = await prisma.memberType.findMany({
      where: {
        id: { in: [...ids] },
      },
    });

    const sortedInIdsOrder = ids.map((id) =>
      memberTypes.find((memberType) => memberType.id === id),
    );

    return sortedInIdsOrder;
  }),
  postsLoader: new DataLoader(async (ids: readonly string[]) => {
    const posts = await prisma.post.findMany({
      where: {
        authorId: { in: [...ids] },
      },
    });

    const userPostsMap = new Map<string, Post[]>();

    posts.forEach((post) => {
      if (!userPostsMap.has(post.authorId)) {
        userPostsMap.set(post.authorId, []);
      }
      userPostsMap.get(post.authorId)?.push(post);
    });

    return ids.map((id) => userPostsMap.get(id));
  }),

  profilesLoader: new DataLoader(async (ids: readonly string[]) => {
    const profiles = await prisma.profile.findMany({
      where: {
        userId: { in: [...ids] },
      },
    });

    const sortedInIdsOrder = ids.map((id) =>
      profiles.find((profile) => profile.userId === id),
    );

    return sortedInIdsOrder;
  }),

  userSubscribedToLoader: new DataLoader(async (ids: readonly string[]) => {
    const results = await prisma.user.findMany({
      where: { id: { in: [...ids] } },
      include: { userSubscribedTo: { select: { author: true } } },
    });

    const subscribedAuthorsMap = new Map<string, { id: string; name: string }[]>();

    results.forEach((user) => {
      const subscribed = user.userSubscribedTo.map((subscription) => subscription.author);
      subscribedAuthorsMap.set(user.id, subscribed);
    });

    return ids.map((id) => subscribedAuthorsMap.get(id));
  }),

  subscribedToUserLoader: new DataLoader(async (ids: readonly string[]) => {
    const results = await prisma.user.findMany({
      where: { id: { in: Array.from(ids) } },
      include: { subscribedToUser: { select: { subscriber: true } } },
    });

    const subscribersMap = new Map<string, { id: string; name: string }[]>();

    results.forEach((user) => {
      if (!subscribersMap.has(user.id)) {
        subscribersMap.set(user.id, []);
      }

      subscribersMap
        .get(user.id)
        ?.push(...user.subscribedToUser.map((sub) => sub.subscriber));
    });

    return ids.map((id) => subscribersMap.get(id));
  }),
});

//dataLoaders end
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
      resolve: async (source: Profile, _, { dl }: Context) => {
        return dl.membersLoader.load(source.memberTypeId);
      },
    },
  }),
});

const userTypeType = new GraphQLObjectType({
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
      resolve: (user: UserType, _args, { dl }: Context) => {
        return dl.profilesLoader.load(user.id);
      },
    },
    posts: {
      type: new GraphQLList(new GraphQLNonNull(post)),
      resolve: (user: UserType, _args, { dl }: Context) => {
        return dl.postsLoader.load(user.id);
      },
    },
    userSubscribedTo: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(userTypeType))),
      resolve: async (user: UserType, _args, { dl }: Context) => {
        return dl.userSubscribedToLoader.load(user.id);
      },
    },
    subscribedToUser: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(userTypeType))),
      resolve: async (user: UserType, _args, { dl }: Context) => {
        return dl.subscribedToUserLoader.load(user.id);
      },
    },
  }),
});

const QueryType = new GraphQLObjectType({
  name: 'query',
  fields: () => ({
    memberTypes: {
      type: new GraphQLList(new GraphQLNonNull(member)),
      resolve: async (_s, _, { prisma }: Context) => {
        return await prisma.memberType.findMany();
      },
    },
    memberType: {
      type: member,
      args: { id: { type: MemberTypeId } },
      resolve: async (_, args: { id: string }, { prisma }: Context) => {
        return await prisma.memberType.findUnique({
          where: { id: args.id },
        });
      },
    },
    posts: {
      type: new GraphQLList(new GraphQLNonNull(post)),
      resolve: async (_, _a, { prisma }: Context) => {
        return await prisma.post.findMany();
      },
    },
    post: {
      type: post,
      args: {
        id: {
          type: UUIDType,
        },
      },
      resolve: async (_, args: { id: string }, { prisma }: Context) => {
        return await prisma.post.findUnique({
          where: { id: args.id },
        });
      },
    },
    users: {
      type: new GraphQLList(userTypeType),
      resolve: async (_s, _a, { prisma, dl }: Context, info: GraphQLResolveInfo) => {
        const parsedResolveInfo = parseResolveInfo(info) as ResolveTree;

        const { fields } = simplifyParsedResolveInfoFragmentWithType(
          parsedResolveInfo,
          new GraphQLList(userTypeType),
        );

        const userSubscribedTo = 'userSubscribedTo' in fields;
        const subscribedToUser = 'subscribedToUser' in fields;

        const users = await prisma.user.findMany({
          include: {
            userSubscribedTo: userSubscribedTo,
            subscribedToUser: subscribedToUser,
          },
        });

        if (userSubscribedTo || subscribedToUser) {
          const usersMap = new Map<string, User>();

          users.forEach((user) => {
            usersMap.set(user.id, user);
          });

          users.forEach((user) => {
            if (userSubscribedTo) {
              dl.userSubscribedToLoader.prime(
                user.id,
                user.userSubscribedTo.map((sub) => usersMap.get(sub.authorId) as User),
              );
            }

            if (subscribedToUser) {
              dl.subscribedToUserLoader.prime(
                user.id,
                user.subscribedToUser.map(
                  (sub) => usersMap.get(sub.subscriberId) as User,
                ),
              );
            }
          });
        }

        return users;
      },
    },
    user: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      type: userTypeType,
      args: {
        id: { type: UUIDType },
      },
      resolve: async (_, args: { id: string }, { prisma }: Context) => {
        return await prisma.user.findUnique({
          where: { id: args.id },
        });
      },
    },
    profiles: {
      type: new GraphQLList(profile),
      resolve: async (_, _a, { prisma }: Context) => {
        return await prisma.profile.findMany();
      },
    },
    profile: {
      type: profile,
      args: {
        id: { type: UUIDType },
      },
      resolve: async (_, args: { id: string }, { prisma }: Context) => {
        return await prisma.profile.findUnique({
          where: { id: args.id },
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

type PostDto = Static<(typeof createPostSchema)['body']>;

type UserDto = Static<(typeof createUserSchema)['body']>;

type CreateProfileDto = Static<(typeof createProfileSchema)['body']>;

type ChangeProfileDto = Static<(typeof changeProfileByIdSchema)['body']>;

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
      resolve: async (_, args: { dto: PostDto }, { prisma }: Context) => {
        return prisma.post.create({
          data: args.dto,
        });
      },
    },
    createUser: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      type: userTypeType,
      args: {
        dto: {
          type: new GraphQLNonNull(CreateUserInput),
        },
      },
      resolve: async (_, args: { dto: UserDto }, { prisma }: Context) => {
        return prisma.user.create({
          data: args.dto,
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
      resolve: async (_, args: { dto: CreateProfileDto }, { prisma }: Context) => {
        return prisma.profile.create({
          data: args.dto,
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
      resolve: async (_, args: { id: string }, { prisma }: Context) => {
        await prisma.post.delete({
          where: {
            id: args.id,
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
      resolve: async (_, args: { id: string }, { prisma }: Context) => {
        await prisma.profile.delete({
          where: {
            id: args.id,
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
      resolve: async (_, args: { id: string }, { prisma }: Context) => {
        await prisma.user.delete({
          where: {
            id: args.id,
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
      resolve: async (_, args: { id: string; dto: PostDto }, { prisma }: Context) => {
        return prisma.post.update({
          where: { id: args.id },
          data: args.dto,
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
      resolve: async (
        _,
        args: { id: string; dto: ChangeProfileDto },
        { prisma }: Context,
      ) => {
        return prisma.profile.update({
          where: { id: args.id },
          data: args.dto,
        });
      },
    },
    changeUser: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      type: userTypeType,
      args: {
        id: {
          type: UUIDType,
        },
        dto: {
          type: ChangeUserInput,
        },
      },
      resolve: async (_, args: { id: string; dto: UserDto }, { prisma }: Context) => {
        return prisma.user.update({
          where: { id: args.id },
          data: args.dto,
        });
      },
    },
    subscribeTo: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      type: userTypeType,

      args: {
        userId: {
          type: UUIDType,
        },
        authorId: {
          type: UUIDType,
        },
      },
      resolve: async (
        _,
        args: { userId: string; authorId: string },
        { prisma }: Context,
      ) => {
        return prisma.user.update({
          where: {
            id: args.userId,
          },
          data: {
            userSubscribedTo: {
              create: {
                authorId: args.authorId,
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
      resolve: async (
        _,
        args: { userId: string; authorId: string },
        { prisma }: Context,
      ) => {
        await prisma.subscribersOnAuthors.delete({
          where: {
            subscriberId_authorId: {
              subscriberId: args.userId,
              authorId: args.authorId,
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
    userTypeType,
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
