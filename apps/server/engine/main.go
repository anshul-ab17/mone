package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"

	"github.com/mone/engine-go/v2"
)

const (
	streamOrderPlaced   = "order.placed"
	streamTradeExecuted = "trade.executed"
	durableEngine       = "mone-engine"
)

func natsUrl() string {
	if url := os.Getenv("NATS_URL"); url != "" {
		return url
	}
	host := os.Getenv("NATS_HOST")
	if host == "" {
		host = "localhost"
	}
	port := os.Getenv("NATS_PORT")
	if port == "" {
		port = "4222"
	}
	return "nats://" + host + ":" + port
}

func main() {
	url := natsUrl()
	log.Printf("Go matching engine starting — NATS: %s", url)

	nc, err := nats.Connect(url)
	if err != nil {
		log.Fatalf("nats connect: %v", err)
	}
	defer nc.Close()

	js, err := jetstream.New(nc)
	if err != nil {
		log.Fatalf("jetstream init: %v", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	eng := engine.NewMatchingEngine()

	cons, err := js.PullSubscription(ctx, streamOrderPlaced, durableEngine)
	if err != nil {
		log.Fatalf("subscribe %s: %v", streamOrderPlaced, err)
	}

	// JetStream publisher for trade.executed
	acked, err := js.Publish(ctx, streamTradeExecuted, nil)
	if err != nil && acked == nil {
		log.Fatalf("publisher init: %v", err)
	}

	log.Printf("Listening on stream %q (durable=%q) ...", streamOrderPlaced, durableEngine)

	for {
		select {
		case <-ctx.Done():
			log.Println("Shutting down…")
			return
		default:
		}

		msgs, err := cons.Fetch(1)
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			log.Printf("fetch error: %v", err)
			continue
		}

		for _, msg := range msgs {
			var event engine.OrderPlacedEvent
			if err := json.Unmarshal(msg.Data(), &event); err != nil {
				log.Printf("unmarshal error: %v — raw: %s", err, string(msg.Data()))
				_ = msg.Nak()
				continue
			}

			result := eng.Process(&event.Order)
			out, err := json.Marshal(result)
			if err != nil {
				log.Printf("marshal error: %v", err)
				_ = msg.Nak()
				continue
			}

			if _, err := js.Publish(ctx, streamTradeExecuted, out); err != nil {
				log.Printf("publish error: %v", err)
				_ = msg.Nak()
				continue
			}

			fmt.Printf("processed order %s → %d trade(s), filled %.4f\n",
				result.OrderID, len(result.Trades), result.FilledQty)
			_ = msg.Ack()
		}
	}
}
