import React from 'react'

// Small on/off switch used across Settings. Mirrors the toggle already
// hand-rolled in AppearanceSettings so both look identical.
const Toggle = ({ checked, onChange, disabled = false, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={onChange}
    className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
      checked ? 'bg-primary' : 'bg-[var(--switch-background)]'
    }`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
)

export default Toggle