import React from "react";
import Icon from "@/components/graamam/Icon";
import { GRAAMAM_ORDERS } from "@/constants/testIds";

/**
 * PageHeader — h1 + subtitle + primary action.
 * Reusable across future screens; the action is optional.
 */
export default function PageHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  actionIcon = "add",
  actionTestId,
  titleTestId,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
      <div>
        <h2
          data-testid={titleTestId || GRAAMAM_ORDERS.pageTitle}
          className="font-headline font-bold text-display-lg text-on-surface dark:text-white mb-2 tracking-tight"
        >
          {title}
        </h2>
        {subtitle ? (
          <p className="font-body text-body-lg text-on-surface-variant dark:text-outline-variant">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          data-testid={actionTestId || GRAAMAM_ORDERS.createOrderButton}
          className="self-start md:self-auto bg-primary-container text-on-primary font-label font-bold text-label-md px-6 py-3 rounded-lg shadow-warm-sm hover:shadow-warm transition-all flex items-center gap-2 hover:-translate-y-[1px] active:translate-y-0"
        >
          <Icon name={actionIcon} className="text-[18px]" />
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
