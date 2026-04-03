import { kafka, Topics } from "@repo/eventbroker";
import { prisma } from "@repo/db";
import { settleTrades } from "../services/execution/settlement";
import { publishOrderbook, publishTrades } from "../services/pubService";
import type { Trade } from "../engine/v1/types";

interface TradeExecutedEvent {
  orderId: string;
  filledQty: number;
  remainingQty: number;
  trades: Trade[];
}

export async function startSettlementWorker() {
  const consumer = kafka.consumer({ groupId: "mone-settlement" });
  await consumer.connect();
  await consumer.subscribe({ topic: Topics.TRADE_EXECUTED, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      let event: TradeExecutedEvent;
      try {
        event = JSON.parse(message.value.toString());
      } catch {
        console.error("Settlement worker: invalid JSON", message.value.toString());
        return;
      }

      const { orderId, filledQty, trades } = event;
      if (trades.length === 0) return;

      try {
        await prisma.$transaction(async (tx) => {
          await settleTrades(trades, tx);

          await tx.trade.createMany({
            data: trades.map((t) => ({
              id: t.id,
              buyOrderId: t.buyOrderId,
              sellOrderId: t.sellOrderId,
              price: t.price,
              quantity: t.quantity,
            })),
            skipDuplicates: true,
          });

          const order = await tx.order.findUnique({ where: { id: orderId } });
          if (order) {
            await tx.order.update({
              where: { id: orderId },
              data: {
                filledQty,
                status:
                  filledQty >= order.quantity ? "FILLED"
                  : filledQty > 0 ? "PARTIALLY_FILLED"
                  : "OPEN",
              },
            });
          }
        });

        const marketId = trades[0]?.marketId;
        if (marketId) {
          publishOrderbook(marketId).catch(console.error);
          publishTrades(marketId, trades).catch(console.error);
        }

        console.log(`Settlement worker: settled order ${orderId} (${trades.length} trade(s))`);
      } catch (err) {
        console.error("Settlement worker: failed for order", orderId, err);
      }
    },
  });
}
