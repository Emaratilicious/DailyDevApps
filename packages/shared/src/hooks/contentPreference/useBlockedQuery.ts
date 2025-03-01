import type {
  InfiniteData,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';
import type {
  ContentPreference,
  ContentPreferenceType,
} from '../../graphql/contentPreference';
import {
  DEFAULT_BLOCKED_LIMIT,
  USER_BLOCKED_QUERY,
} from '../../graphql/contentPreference';
import {
  generateQueryKey,
  getNextPageParam,
  RequestKey,
  StaleTime,
} from '../../lib/query';
import { useAuthContext } from '../../contexts/AuthContext';
import type { Connection } from '../../graphql/common';
import { gqlClient } from '../../graphql/common';
import { useFollowContentPreferenceMutationSubscription } from './useFollowContentPreferenceMutationSubscription';

export type UseBlockedQueryProps = {
  entity: ContentPreferenceType;
  limit?: number;
  feedId?: string;
  queryOptions?: Omit<
    UseInfiniteQueryOptions<Connection<ContentPreference>>,
    'select'
  >;
};

export type UseBlockedQuery = UseInfiniteQueryResult<
  InfiniteData<Connection<ContentPreference>>
>;

export const useBlockedQuery = ({
  entity,
  limit = DEFAULT_BLOCKED_LIMIT,
  feedId,
  queryOptions,
}: UseBlockedQueryProps): UseBlockedQuery => {
  const { user } = useAuthContext();
  const enabled = !!entity;
  const queryKey = generateQueryKey(
    RequestKey.ContentPreference,
    user,
    RequestKey.UserBlocked,
    {
      entity,
      first: limit,
      feedId,
    },
  );

  const queryResult = useInfiniteQuery({
    queryKey,
    queryFn: async ({ queryKey: queryKeyArg, pageParam }) => {
      const [, , , queryVariables] = queryKeyArg as [
        unknown,
        unknown,
        unknown,
        { id: string; entity: ContentPreferenceType },
      ];
      const result = await gqlClient.request(USER_BLOCKED_QUERY, {
        ...queryVariables,
        after: pageParam,
      });

      return result.userBlocked;
    },
    initialPageParam: '',
    staleTime: StaleTime.Default,
    getNextPageParam: ({ lastPage }) => getNextPageParam(lastPage?.pageInfo),
    ...queryOptions,
    enabled:
      typeof queryOptions?.enabled !== 'undefined'
        ? queryOptions.enabled && enabled
        : enabled,
  });

  useFollowContentPreferenceMutationSubscription({ queryKey });

  return queryResult;
};
