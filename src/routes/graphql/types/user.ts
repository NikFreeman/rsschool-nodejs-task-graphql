export type UserType = {
  id: string;
  name: string;
  balance: number;
  userSubscribedTo?: {
    subscriberId: string;
    authorId: string;
  };
  subscribedToUser?: {
    subscriberId: string;
    authorId: string;
  };
};
