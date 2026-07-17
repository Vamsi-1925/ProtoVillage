import React from "react";
import Icon from "@/components/graamam/Icon";

export default function EmptyState({ icon = "inbox", title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center">
        <Icon name={icon} className="text-[28px] text-outline" />
      </div>
      <h4 className="font-headline font-semibold text-headline-sm text-on-surface dark:text-white">{title}</h4>
      {hint ? <p className="text-body-sm text-on-surface-variant dark:text-outline-variant max-w-md">{hint}</p> : null}
      {action}
    </div>
  );
}
