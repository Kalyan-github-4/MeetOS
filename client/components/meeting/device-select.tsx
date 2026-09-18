"use client"

import type { Mic01Icon } from "@hugeicons/core-free-icons"

import { Icon } from "@/components/ui/icon"

/**
 * One device dropdown. Native `<select>` on purpose: it is keyboard- and
 * screen-reader-correct everywhere, and on a phone it opens the system picker.
 *
 * Labels are empty until the browser has granted access to that kind of
 * device, so unnamed entries are numbered rather than shown blank.
 */
export function DeviceSelect({
  label,
  icon,
  devices,
  value,
  onChange,
  disabled,
}: {
  label: string
  icon: typeof Mic01Icon
  devices: MediaDeviceInfo[]
  /** Empty string for the browser default. */
  value: string
  onChange: (deviceId: string) => void
  disabled?: boolean
}) {
  const known = devices.some((device) => device.deviceId === value)

  return (
    <label className="flex min-w-0 items-center gap-2.5 rounded-full border border-hairline py-1 pr-1 pl-3 focus-within:border-ink">
      <span className="shrink-0 text-ink-muted">
        <Icon icon={icon} size={15} strokeWidth={1.8} />
      </span>
      <span className="sr-only">{label}</span>
      <select
        value={known ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || devices.length === 0}
        className="h-8 min-w-0 flex-1 truncate bg-transparent pr-2 text-sm outline-none disabled:text-ink-muted"
      >
        {known ? null : <option value="">System default</option>}
        {devices.map((device, index) => (
          <option key={device.deviceId || index} value={device.deviceId}>
            {device.label || `${label} ${index + 1}`}
          </option>
        ))}
      </select>
    </label>
  )
}
