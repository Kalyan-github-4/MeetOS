"use client"

import { useEffect, useState } from "react"

import {
  getNetworkInfo,
  type NetworkInfo,
} from "./network-quality"

const INITIAL_NETWORK_INFO: NetworkInfo = {
  online: true,
  rtt: null,
  downlink: null,
  effectiveType: "unknown",
  saveData: false,
  quality: "unknown",
}

export function useNetworkQuality() {
  const [networkInfo, setNetworkInfo] =
    useState<NetworkInfo>(INITIAL_NETWORK_INFO)

  useEffect(() => {
    const updateNetworkInfo = () => {
      setNetworkInfo(getNetworkInfo())
    }

    // Check immediately when component loads.
    updateNetworkInfo()

    // Detect online/offline changes.
    window.addEventListener(
      "online",
      updateNetworkInfo,
    )

    window.addEventListener(
      "offline",
      updateNetworkInfo,
    )

    const navigatorWithConnection =
      navigator as Navigator & {
        connection?: EventTarget
        mozConnection?: EventTarget
        webkitConnection?: EventTarget
      }

    const connection =
      navigatorWithConnection.connection ??
      navigatorWithConnection.mozConnection ??
      navigatorWithConnection.webkitConnection

    // Some browsers fire this when network conditions change.
    connection?.addEventListener(
      "change",
      updateNetworkInfo,
    )

    // Also check every 3 seconds.
    const interval = window.setInterval(
      updateNetworkInfo,
      3000,
    )

    return () => {
      window.removeEventListener(
        "online",
        updateNetworkInfo,
      )

      window.removeEventListener(
        "offline",
        updateNetworkInfo,
      )

      connection?.removeEventListener(
        "change",
        updateNetworkInfo,
      )

      window.clearInterval(interval)
    }
  }, [])

  return networkInfo
}