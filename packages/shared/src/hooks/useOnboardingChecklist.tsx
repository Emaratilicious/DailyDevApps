import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import { ActionType } from '../graphql/actions';
import { ChecklistViewState, createChecklistStep } from '../lib/checklist';
import { useActions } from './useActions';
import type { UseChecklist } from './useChecklist';
import { useChecklist } from './useChecklist';
import { Button } from '../components/buttons/Button';
import { ButtonVariant, ButtonSize } from '../components/buttons/common';
import { ChecklistStep } from '../components/checklist/ChecklistStep';
import { webappUrl } from '../lib/constants';
import { useAuthContext } from '../contexts/AuthContext';
import { useSettingsContext } from '../contexts/SettingsContext';
import { useLogContext } from '../contexts/LogContext';
import { LogEvent, TargetId } from '../lib/log';

type UseOnboardingChecklist = UseChecklist & {
  checklistView: ChecklistViewState;
  setChecklistView: (value: ChecklistViewState) => void;
  isChecklistReady: boolean;
};

export const useOnboardingChecklist = (): UseOnboardingChecklist => {
  const { logEvent } = useLogContext();
  const {
    onboardingChecklistView: checklistView,
    setOnboardingChecklistView: setChecklistView,
  } = useSettingsContext();
  const router = useRouter();
  const { isLoggedIn, user } = useAuthContext();
  const { actions, isActionsFetched, completeAction } = useActions();
  const isChecklistReady = isActionsFetched && isLoggedIn;

  const steps = useMemo(() => {
    if (!isChecklistReady) {
      return [];
    }

    return [
      createChecklistStep({
        type: ActionType.MyFeed,
        step: {
          title: 'Create a personal feed',
          description:
            'Customize your feed by selecting topics that interest you the most.',
          component: (props) => {
            return (
              <ChecklistStep {...props}>
                <div className="flex">
                  <Button
                    variant={ButtonVariant.Primary}
                    size={ButtonSize.XSmall}
                    onClick={() => {
                      router.push(`${webappUrl}feeds/${user.id}/edit`);
                    }}
                  >
                    Customize your feed
                  </Button>
                </div>
              </ChecklistStep>
            );
          },
        },
        actions,
      }),
      createChecklistStep({
        type: ActionType.VotePost,
        step: {
          title: 'Upvote or downvote a post',
          description:
            'Engage with the community by voting on posts based on their relevance and quality.',
        },
        actions,
      }),
      createChecklistStep({
        type: ActionType.BookmarkPost,
        step: {
          title: 'Bookmark your first post',
          description: 'Save posts you find valuable for easy access later.',
        },
        actions,
      }),
      createChecklistStep({
        type: ActionType.DigestConfig,
        step: {
          title: 'Configure your personalized digest',
          description:
            'Adjust the frequency and send time of your personalized digest to help build a habit and stay updated.',
          component: (props) => {
            return (
              <ChecklistStep {...props}>
                <div className="flex">
                  <Button
                    tag="a"
                    variant={ButtonVariant.Primary}
                    size={ButtonSize.XSmall}
                    href={`${webappUrl}account/notifications`}
                    onClick={() => {
                      completeAction(ActionType.DigestConfig);
                    }}
                  >
                    Set up now
                  </Button>
                </div>
              </ChecklistStep>
            );
          },
        },
        actions,
      }),
      createChecklistStep({
        type: ActionType.StreakMilestone,
        step: {
          title: 'Reach the first streaks milestone',
          description:
            'Read a post for two days in a row (or more) to achieve your first reading streak milestone.',
          component: (props) => {
            return (
              <ChecklistStep {...props}>
                <div className="flex">
                  <Button
                    variant={ButtonVariant.Primary}
                    size={ButtonSize.XSmall}
                    onClick={() => {
                      const readingStreakHeaderButton = document.getElementById(
                        'reading-streak-header-button',
                      );

                      if (readingStreakHeaderButton) {
                        readingStreakHeaderButton.click();
                      }
                    }}
                  >
                    Track your streak
                  </Button>
                </div>
              </ChecklistStep>
            );
          },
        },
        actions,
      }),
    ];
  }, [isChecklistReady, actions, router, user?.id, completeAction]);

  const checklist = useChecklist({ steps });

  return {
    ...checklist,
    checklistView,
    setChecklistView: (value: ChecklistViewState) => {
      if (value === ChecklistViewState.Closed) {
        logEvent({
          event_name: LogEvent.ChecklistClose,
          target_id: TargetId.General,
        });
      }

      setChecklistView(value);
    },
    isChecklistReady,
  };
};
