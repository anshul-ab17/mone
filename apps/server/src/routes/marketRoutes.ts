import { Hono } from "hono";
import { MarketController } from "../controllers/marketController";

const controller = new MarketController();
export const marketRoutes = new Hono();

marketRoutes.get("/", (c) => controller.list(c));
// Live Backpack routes — must be before /:id to avoid conflicts
marketRoutes.get("/live", (c) => controller.allLiveTickers(c));
marketRoutes.get("/live/:symbol/depth", (c) => controller.depth(c));
marketRoutes.get("/live/:symbol/klines", (c) => controller.klines(c));
marketRoutes.get("/live/:symbol", (c) => controller.liveTicker(c));
// Find or create DB market by base/quote symbol
marketRoutes.get("/symbol/:base/:quote", (c) => controller.findOrCreateBySymbol(c));
// Internal DB market routes
marketRoutes.get("/:id/ticker", (c) => controller.ticker(c));
marketRoutes.get("/:id/candles", (c) => controller.candles(c));
marketRoutes.get("/:id/trades", (c) => controller.recentTrades(c));
