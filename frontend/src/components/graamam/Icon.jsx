import React from "react";

/**
 * Icon — tiny wrapper around Material Symbols Outlined (FILL 1).
 * Keeps class/style props easy to pass without prop-drilling font settings.
 */
export default function Icon({
  name,
  className = "",
  style,
  filled = true,
  size,
  ...rest
}) {
  const s = { fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0", ...(size ? { fontSize: size } : null), ...style };
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined select-none ${className}`}
      style={s}
      {...rest}
    >
      {name}
    </span>
  );
}
