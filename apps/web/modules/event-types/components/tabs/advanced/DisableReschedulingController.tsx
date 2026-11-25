import { LearnMoreLink } from "@calcom/features/eventtypes/components/LearnMoreLink";
import type {
  EventTypeSetup,
  FormValues,
  SettingsToggleClassNames,
} from "@calcom/features/eventtypes/lib/types";
import ServerTrans from "@calcom/lib/components/ServerTrans";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import classNames from "@calcom/ui/classNames";
import { Input, SettingsToggle } from "@calcom/ui/components/form";
import { RadioField } from "@calcom/ui/components/radio";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { useEffect, useRef, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

export type DisableReschedulingCustomClassNames = SettingsToggleClassNames & {
  radioGroupContainer?: string;
  alwaysRescheduleRadio?: string;
  conditionalRescheduleRadio?: {
    container?: string;
    timeInput?: string;
  };
};

type NoticeFieldName = "minimumRescheduleNotice" | "minimumCancellationNotice";
type SwitchFieldName = "disabledRescheduling" | "disabledCancelling";

type DisableReschedulingControllerProps = {
  eventType: EventTypeSetup;
  disableRescheduling: boolean;
  onDisableRescheduling: (val: boolean) => void;
  customClassNames?: DisableReschedulingCustomClassNames;
  switchFieldName?: SwitchFieldName;
  noticeFieldName?: NoticeFieldName;
  titleKey?: "disable_rescheduling" | "disable_cancelling";
  descriptionKey?: "description_disable_rescheduling" | "description_disable_cancelling";
  learnMoreHref?: string;
  testId?: string;
  idPrefix?: string;
};

export default function DisableReschedulingController({
  eventType,
  disableRescheduling,
  onDisableRescheduling,
  customClassNames,
  switchFieldName = "disabledRescheduling",
  noticeFieldName = "minimumRescheduleNotice",
  titleKey = "disable_rescheduling",
  descriptionKey = "description_disable_rescheduling",
  learnMoreHref = "https://cal.com/help/event-types/disable-canceling-rescheduling#disable-rescheduling",
  testId = "disable-rescheduling-toggle",
  idPrefix = "",
}: DisableReschedulingControllerProps) {
  const { t } = useLocale();
  const formMethods = useFormContext<FormValues>();

  const currentMinimumRescheduleNotice = formMethods.watch(noticeFieldName);
  const [minimumRescheduleNoticeValue, setMinimumRescheduleNoticeValue] = useState<number>(
    currentMinimumRescheduleNotice && currentMinimumRescheduleNotice > 0 ? currentMinimumRescheduleNotice : 60
  );
  const radioGroupOnValueChangeRef = useRef<((val: string) => void) | null>(null);

  const persistedFullyDisabled =
    noticeFieldName === "minimumCancellationNotice"
      ? eventType.disableCancelling === true
      : eventType.disableRescheduling === true;
  const [shouldShowRadioButtons, setShouldShowRadioButtons] = useState(
    disableRescheduling ||
      (currentMinimumRescheduleNotice !== null && currentMinimumRescheduleNotice > 0) ||
      persistedFullyDisabled ||
      false
  );
  useEffect(() => {
    if (currentMinimumRescheduleNotice && currentMinimumRescheduleNotice > 0) {
      setMinimumRescheduleNoticeValue(currentMinimumRescheduleNotice);
    }
  }, [currentMinimumRescheduleNotice]);

  const shouldLockDisableProps = (_field: string) => ({
    disabled: false,
    LockedIcon: false as const,
    isLocked: false,
  });
  const shouldLockIndicator = (_field: string) => false;
  const disableReschedulingLocked = shouldLockDisableProps(switchFieldName);
  const minimumRescheduleNoticeLocked = shouldLockDisableProps(noticeFieldName);

  return (
    <div className="block items-start sm:flex">
      <div className="w-full">
        <Controller
          name={switchFieldName}
          control={formMethods.control}
          render={({ field: { onChange } }) => (
            <SettingsToggle
              labelClassName={classNames("text-sm", customClassNames?.label)}
              toggleSwitchAtTheEnd={true}
              switchContainerClassName={classNames(
                "border-subtle rounded-lg border py-6 px-4 sm:px-6",
                shouldShowRadioButtons && "rounded-b-none",
                customClassNames?.container
              )}
              childrenClassName={classNames("lg:ml-0", customClassNames?.children)}
              descriptionClassName={customClassNames?.description}
              title={t(titleKey)}
              data-testid={testId}
              disabled={disableReschedulingLocked.disabled}
              LockedIcon={disableReschedulingLocked.LockedIcon}
              description={<LearnMoreLink t={t} i18nKey={descriptionKey} href={learnMoreHref} />}
              checked={shouldShowRadioButtons}
              onCheckedChange={(val) => {
                if (val) {
                  onChange(true);
                  onDisableRescheduling(true);
                  formMethods.setValue(noticeFieldName, null, { shouldDirty: true });
                  setShouldShowRadioButtons(true);
                } else {
                  onChange(false);
                  onDisableRescheduling(false);
                  formMethods.setValue(noticeFieldName, null, { shouldDirty: true });
                  setShouldShowRadioButtons(false);
                }
              }}>
              {shouldShowRadioButtons && (
                <div className="rounded-b-lg border border-subtle border-t-0 p-6">
                  <RadioGroup.Root
                    value={
                      disableRescheduling
                        ? "always"
                        : currentMinimumRescheduleNotice !== null && currentMinimumRescheduleNotice > 0
                          ? "notice"
                          : "always"
                    }
                    onValueChange={(val) => {
                      const handler = (val: string) => {
                        if (val === "always") {
                          onChange(true);
                          onDisableRescheduling(true);
                          formMethods.setValue(noticeFieldName, null, { shouldDirty: true });
                          setMinimumRescheduleNoticeValue(0);
                        } else if (val === "notice") {
                          onChange(false);
                          onDisableRescheduling(false);
                          const valueToSet =
                            minimumRescheduleNoticeValue > 0 ? minimumRescheduleNoticeValue : 60;
                          formMethods.setValue(noticeFieldName, valueToSet, { shouldDirty: true });
                          setMinimumRescheduleNoticeValue(valueToSet);
                        }
                      };
                      radioGroupOnValueChangeRef.current = handler;
                      handler(val);
                    }}>
                    <div
                      className={classNames(
                        "flex flex-col flex-wrap justify-start gap-y-2",
                        customClassNames?.radioGroupContainer
                      )}>
                      <RadioField
                        label={t("always")}
                        disabled={minimumRescheduleNoticeLocked.disabled}
                        id={`${idPrefix}always`}
                        value="always"
                        className={customClassNames?.alwaysRescheduleRadio}
                      />
                      <RadioField
                        disabled={minimumRescheduleNoticeLocked.disabled}
                        className={classNames(
                          "items-center",
                          customClassNames?.conditionalRescheduleRadio?.container
                        )}
                        label=<ServerTrans
                          t={t}
                          i18nKey="when_less_than_minutes_before_meeting"
                          components={[
                            <div
                              key="when_less_than_minutes_before_meeting"
                              className="mx-2 inline-flex items-center">
                              <Input
                                type="number"
                                min={1}
                                disabled={minimumRescheduleNoticeLocked.disabled}
                                onChange={(evt) => {
                                  const val = Number(evt.target?.value);
                                  if (val > 0) {
                                    setMinimumRescheduleNoticeValue(val);
                                    formMethods.setValue(noticeFieldName, val, {
                                      shouldDirty: true,
                                    });
                                    radioGroupOnValueChangeRef.current?.("notice");
                                  }
                                }}
                                className={classNames(
                                  "m-0! block w-20 border-default text-sm [appearance:textfield] focus:z-10",
                                  customClassNames?.conditionalRescheduleRadio?.timeInput
                                )}
                                defaultValue={
                                  currentMinimumRescheduleNotice && currentMinimumRescheduleNotice > 0
                                    ? currentMinimumRescheduleNotice
                                    : 60
                                }
                              />
                            </div>,
                          ]}
                        />
                        id={`${idPrefix}notice`}
                        value="notice"
                      />
                    </div>
                  </RadioGroup.Root>
                </div>
              )}
            </SettingsToggle>
          )}
        />
      </div>
    </div>
  );
}
