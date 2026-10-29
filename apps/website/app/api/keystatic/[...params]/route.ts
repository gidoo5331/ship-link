import { makeRouteHandler } from "@keystatic/next/route-handler"
import config from "@/keystatic.config"

// Keystatic's backend: reads/writes content files locally, or handles GitHub sign-in and commits
export const { POST, GET } = makeRouteHandler({ config })
