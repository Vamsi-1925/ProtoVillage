import React from "react";
import Icon from "@/components/graamam/Icon";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  testId,
  className = "",
}) {
  return (
    <label className={`relative flex items-center ${className}`}>
      <Icon name="search" className="absolute left-4 text-outline text-[20px] pointer-events-none" />
      <input
        type="search"
        value={value || ""}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        data-testid={testId}
        className="w-full font-body text-body-md pl-11 pr-4 py-2.5 rounded-full bg-surface-container-lowest dark:bg-white/5 border border-outline-variant/70 dark:border-white/10 text-on-surface dark:text-white placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </label>
  );
}
