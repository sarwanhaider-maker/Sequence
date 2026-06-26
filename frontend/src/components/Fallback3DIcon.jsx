import React, { useState } from "react";

/**
 * Fallback3DIcon component:
 * Tries to render a custom 3D PNG icon from "/assests/3d-icons/[iconKey].png".
 * If the image fails to load (e.g. file doesn't exist), it automatically
 * falls back to rendering the provided standard SVG element or Emoji string.
 */
export default function Fallback3DIcon({ iconKey, fallback, style, className = "" }) {
  const [hasError, setHasError] = useState(false);

  // Spelled 'assests' to align with existing project directory spelling
  const src = `/assests/3d-icons/${iconKey}.png`;

  if (hasError || !iconKey) {
    return <>{fallback}</>;
  }

  // Determine sizing defaults
  const defaultSizeStyle = typeof fallback === "string" 
    ? { width: "1.8em", height: "1.8em" } 
    : { width: "22px", height: "22px" };

  return (
    <img
      src={src}
      alt={iconKey}
      onError={() => setHasError(true)}
      className={`fallback-3d-img ${className}`}
      style={{
        ...defaultSizeStyle,
        objectFit: "contain",
        display: "inline-block",
        verticalAlign: "middle",
        filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.25))",
        ...style
      }}
    />
  );
}
