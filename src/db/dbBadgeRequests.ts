import db from '.';
import { BadgeRequest } from '@models/badgeRequests';

interface CreateBadgeRequestProps
  extends Omit<BadgeRequest, 'id' | 'created_at' | 'updated_at'> {}
interface UpdateBadgeRequestProps
  extends Partial<Omit<BadgeRequest, 'id' | 'created_at' | 'update_at'>> {}

const BADGE_REQUEST_TABLE = 'badge_requests';

export const createBadgeRequest = (
  props: CreateBadgeRequestProps
): Promise<BadgeRequest> => {
  return db(BADGE_REQUEST_TABLE)
    .insert({
      ...props,
    })
    .returning('*')
    .then((res) => res[0]);
};

export const updateBadgeRequest = async (
  props: UpdateBadgeRequestProps,
  username: string
): Promise<void> => {
  console.log(props, username);
  await db(BADGE_REQUEST_TABLE)
    .update({
      ...props,
    })
    .where({
      username,
    });
  return;
};

export const getBadgeRequest = (
  username: string
): Promise<BadgeRequest | undefined> => {
  return db(BADGE_REQUEST_TABLE).where({ username }).first();
};

export const getBadgeRequestWithStatus = (
  username: string,
  status: BadgeRequest['status']
): Promise<BadgeRequest | undefined> => {
  return db(BADGE_REQUEST_TABLE)
    .where({ username, status })
    .orderBy('created_at', 'desc')
    .first();
};
