import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';

const QueryType = new GraphQLObjectType({
  name: 'query',
  fields: {
    hello: {
      type: GraphQLString,
      resolve() {
        return 'world';
      },
    },
  },
});

const MutationType = new GraphQLObjectType({
  name: 'mutation',
  fields: { helloMut: { type: GraphQLString }, inputMut: { type: GraphQLString } },
});
export const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});
