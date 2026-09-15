export type NetworkQuality =
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "offline"
  | "unknown"

export interface NetworkInfo {
  online: boolean
  rtt: number | null
  downlink: number | null
  effectiveType: string
  saveData: boolean
  quality: NetworkQuality
}

interface NetworkConnection {
  rtt?: number
  downlink?: number
  effectiveType?: string
  saveData?: boolean
}

/**
 * Decide the current network quality.
 *
 * RTT = Round Trip Time in milliseconds.
 * Downlink = estimated download speed in Mbps.
 *
 * These are initial thresholds. Later we will combine them
 * with actual WebRTC/LiveKit statistics such as packet loss
 * and jitter.
 */
function calculateNetworkQuality(
  online: boolean,
  rtt: number | null,
  downlink: number | null,
): NetworkQuality {
  if (!online) {
    return "offline"
  }

  // Some browsers do not support the Network Information API.
  if (rtt === null || downlink === null) {
    return "unknown"
  }

  if (rtt <= 75 && downlink >= 5) {
    return "excellent"
  }

  if (rtt <= 150 && downlink >= 2.5) {
    return "good"
  }

  if (rtt <= 300 && downlink >= 1) {
    return "fair"
  }

  return "poor"
}

/**
 * Read network information provided by the browser.
 */
export function getNetworkInfo(): NetworkInfo {
  // Protect against Next.js server-side rendering.
  if (typeof window === "undefined") {
    return {
      online: true,
      rtt: null,
      downlink: null,
      effectiveType: "unknown",
      saveData: false,
      quality: "unknown",
    }
  }

  const navigatorWithConnection = navigator as Navigator & {
    connection?: NetworkConnection
    mozConnection?: NetworkConnection
    webkitConnection?: NetworkConnection
  }

  const connection =
    navigatorWithConnection.connection ??
    navigatorWithConnection.mozConnection ??
    navigatorWithConnection.webkitConnection

  const online = navigator.onLine

  const rtt =
    typeof connection?.rtt === "number"
      ? connection.rtt
      : null

  const downlink =
    typeof connection?.downlink === "number"
      ? connection.downlink
      : null

  return {
    online,
    rtt,
    downlink,
    effectiveType:
      connection?.effectiveType ?? "unknown",
    saveData:
      connection?.saveData ?? false,
    quality: calculateNetworkQuality(
      online,
      rtt,
      downlink,
    ),
  }
}