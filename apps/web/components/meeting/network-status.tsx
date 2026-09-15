"use client"

import {
  useNetworkQuality,
} from "@/lib/network/use-network-quality"

export function NetworkStatus() {
  const network = useNetworkQuality()

  const statusConfig = {
    excellent: {
      label: "Excellent",
      dot: "text-emerald-400",
    },
    good: {
      label: "Good",
      dot: "text-green-400",
    },
    fair: {
      label: "Fair",
      dot: "text-yellow-400",
    },
    poor: {
      label: "Poor",
      dot: "text-red-400",
    },
    offline: {
      label: "Offline",
      dot: "text-red-500",
    },
    unknown: {
      label: "Checking...",
      dot: "text-gray-400",
    },
  }

  const status = statusConfig[network.quality]

  return (
    <div
      className="
        rounded-xl border border-white/10
        bg-black/50 px-3 py-2
        text-xs text-white shadow-lg
        backdrop-blur-md
      "
    >
      <div className="flex items-center gap-2">
        <span
          className={`text-lg leading-none ${status.dot}`}
        >
          ●
        </span>

        <span className="font-medium">
          Network: {status.label}
        </span>
      </div>

      {network.online && (
        <div className="mt-1 text-white/60">
          {network.rtt !== null
            ? `${network.rtt} ms`
            : "RTT N/A"}

          {" · "}

          {network.downlink !== null
            ? `${network.downlink} Mbps`
            : "Speed N/A"}
        </div>
      )}
    </div>
  )
}