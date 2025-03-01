import type { ReactElement } from 'react';
import React, { useMemo } from 'react';
import classNames from 'classnames';
import type { Post } from '../../graphql/posts';
import classed from '../../lib/classed';
import { LazyImage } from '../LazyImage';
import { WidgetContainer } from './common';
import { FeatherIcon, ScoutIcon } from '../icons';
import { LinkWithTooltip } from '../tooltips/LinkWithTooltip';
import { ProfileLink } from '../profile/ProfileLink';
import type { Author as CommentAuthor } from '../../graphql/comments';
import { ProfileTooltip } from '../profile/ProfileTooltip';
import ConditionalWrapper from '../ConditionalWrapper';
import { ReputationUserBadge } from '../ReputationUserBadge';
import { ButtonVariant } from '../buttons/common';
import useFeedSettings from '../../hooks/useFeedSettings';
import EnableNotification from '../notifications/EnableNotification';
import type { Origin } from '../../lib/log';
import { NotificationPromptSource } from '../../lib/log';
import { useSourceActionsNotify } from '../../hooks';
import { SourceActions } from '../sources/SourceActions';
import type { Source as ISource } from '../../graphql/sources';
import { TruncateText } from '../utilities';
import { VerifiedCompanyUserBadge } from '../VerifiedCompanyUserBadge';
import { FollowButton } from '../contentPreference/FollowButton';
import { ContentPreferenceType } from '../../graphql/contentPreference';
import { PlusUserBadge } from '../PlusUserBadge';

interface PostAuthorProps {
  post: Post;
  origin: Origin;
}

export enum UserType {
  Source = 'source',
  Author = 'author',
  Featured = 'featured',
  Scout = 'scout',
}

const StyledImage = classed(LazyImage, 'w-10 h-10');

type SourceAuthorProps =
  | ({ userType?: null } & CommentAuthor)
  | ({
      userType: UserType.Featured | UserType.Author | UserType.Scout;
    } & CommentAuthor)
  | ({
      userType: UserType.Source;
    } & ISource);

type UserHighlightProps = SourceAuthorProps & {
  allowSubscribe?: boolean;
  showReputation?: boolean;
  className?: {
    wrapper?: string;
    image?: string;
    textWrapper?: string;
    name?: string;
    reputation?: string;
    handle?: string;
  };
  origin?: Origin;
};

type ImageProps = SourceAuthorProps & {
  className?: string;
};

const getUserIcon = (userType: UserType) => {
  if (userType === UserType.Source) {
    return null;
  }

  return userType === UserType.Author ? FeatherIcon : ScoutIcon;
};

const Image = (props: ImageProps) => {
  const { userType, name, permalink, image, className } = props;

  if (userType === UserType.Source) {
    return (
      <LinkWithTooltip
        href={permalink}
        passHref
        prefetch={false}
        tooltip={{
          placement: 'bottom',
          content: name,
        }}
      >
        <StyledImage
          className={classNames('cursor-pointer rounded-full', className)}
          imgSrc={image}
          imgAlt={name}
          background="var(--theme-background-subtle)"
        />
      </LinkWithTooltip>
    );
  }

  const user = props as CommentAuthor;

  return (
    <ProfileLink href={user.permalink} data-testid="authorLink">
      <StyledImage
        className="rounded-12"
        imgSrc={image}
        imgAlt={name}
        background="var(--theme-background-subtle)"
      />
    </ProfileLink>
  );
};

const userTypes = [UserType.Author, UserType.Scout];

export const UserHighlight = (props: UserHighlightProps): ReactElement => {
  const { userType, origin, ...user } = props;
  const {
    id,
    name,
    permalink,
    allowSubscribe = true,
    className,
    showReputation = userType !== UserType.Source,
  } = user;

  const handleOrUsernameOrId =
    ('handle' in user ? user.handle : user.username) || id;
  const reputation = 'reputation' in user ? user.reputation : NaN;
  const companies = 'companies' in user ? user.companies : [];
  const isPlus = 'isPlus' in user ? user.isPlus : false;

  const Icon = getUserIcon(userType);
  const isUserTypeSource = userType === UserType.Source && 'handle' in user;
  const isUserType = userTypes.includes(userType);
  const { feedSettings } = useFeedSettings();

  const isSourceBlocked = useMemo(() => {
    if (!isUserTypeSource) {
      return false;
    }

    return !!feedSettings?.excludeSources?.some(
      (excludedSource) => excludedSource.id === id,
    );
  }, [isUserTypeSource, feedSettings?.excludeSources, id]);

  return (
    <div
      className={classNames(
        'relative flex flex-row items-center gap-4 p-3',
        className?.wrapper,
      )}
    >
      <ConditionalWrapper
        condition={!isUserTypeSource}
        wrapper={(children) => (
          <ProfileTooltip userId={id}>
            {children as ReactElement}
          </ProfileTooltip>
        )}
      >
        <ProfileLink href={permalink}>
          <Image {...props} className={className?.image} />
        </ProfileLink>
      </ConditionalWrapper>
      {userType && Icon && (
        <Icon
          secondary
          className={classNames(
            'absolute left-10 top-10 h-5 w-5',
            userType === UserType.Author
              ? 'text-accent-cheese-default'
              : 'text-accent-bun-default',
          )}
        />
      )}
      <ConditionalWrapper
        condition={!isUserTypeSource}
        wrapper={(children) => (
          <ProfileTooltip userId={id}>
            {children as ReactElement}
          </ProfileTooltip>
        )}
      >
        <div
          className={classNames(
            'flex min-w-0 flex-1 flex-col',
            className?.textWrapper,
          )}
        >
          <div className="flex">
            <ProfileLink
              className={classNames('font-bold typo-callout', className?.name)}
              href={permalink}
            >
              <TruncateText>{name}</TruncateText>
            </ProfileLink>
            {isPlus && <PlusUserBadge user={{ isPlus }} tooltip={false} />}
            {companies?.length > 0 && (
              <VerifiedCompanyUserBadge user={{ companies }} />
            )}
            {showReputation && (
              <ReputationUserBadge
                className={className?.reputation}
                user={{ reputation }}
              />
            )}
          </div>
          {handleOrUsernameOrId && (
            <ProfileLink
              className={classNames(
                'mt-0.5 !block truncate text-text-tertiary typo-footnote',
                className?.handle,
              )}
              href={permalink}
            >
              @{handleOrUsernameOrId}
            </ProfileLink>
          )}
        </div>
      </ConditionalWrapper>
      {!isSourceBlocked && isUserTypeSource && allowSubscribe && (
        <SourceActions
          followProps={{
            variant: ButtonVariant.Secondary,
          }}
          hideBlock
          source={user}
        />
      )}
      {isUserType && (
        <FollowButton
          entityId={id}
          type={ContentPreferenceType.User}
          status={(user as CommentAuthor).contentPreference?.status}
          entityName={`@${handleOrUsernameOrId}`}
          origin={origin}
        />
      )}
    </div>
  );
};

const EnableNotificationSourceSubscribe = ({
  source,
}: Pick<Post, 'source'>) => {
  const { haveNotificationsOn } = useSourceActionsNotify({
    source,
  });

  if (!haveNotificationsOn) {
    return null;
  }

  return (
    <EnableNotification
      source={NotificationPromptSource.SourceSubscribe}
      contentName={source.name}
    />
  );
};

export function PostUsersHighlights({
  post,
  origin,
}: PostAuthorProps): ReactElement {
  const { author, scout, source } = post;

  return (
    <WidgetContainer className="flex flex-col">
      <UserHighlight {...source} userType={UserType.Source} origin={origin} />
      <EnableNotificationSourceSubscribe source={source} />
      {author && (
        <UserHighlight {...author} userType={UserType.Author} origin={origin} />
      )}
      {scout && (
        <UserHighlight {...scout} userType={UserType.Scout} origin={origin} />
      )}
    </WidgetContainer>
  );
}
