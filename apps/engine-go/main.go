package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/mone/engine-go/engine"
	kafka "github.com/segmentio/kafka-go"
)

const (
	topicOrderPlaced   = "order.placed"
	topicTradeExecuted = "trade.executed"
	groupID            = "mone-engine"
)

func brokerAddr() string {
	if addr := os.Getenv("KAFKA_BROKER"); addr != "" {
		return addr
	}
	return "localhost:9092"
}

func main() {
	addr := brokerAddr()
	log.Printf("Go matching engine starting — broker: %s", addr)

	eng := engine.NewMatchingEngine()

	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        []string{addr},
		Topic:          topicOrderPlaced,
		GroupID:        groupID,
		MinBytes:       1,
		MaxBytes:       1 << 20, // 1 MiB
		CommitInterval: time.Second,
	})

	writer := &kafka.Writer{
		Addr:         kafka.TCP(addr),
		Topic:        topicTradeExecuted,
		Balancer:     &kafka.LeastBytes{},
		RequiredAcks: kafka.RequireOne,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	log.Printf("Listening on topic %q ...", topicOrderPlaced)

	for {
		msg, err := reader.FetchMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				break // graceful shutdown
			}
			log.Printf("fetch error: %v", err)
			continue
		}

		var event engine.OrderPlacedEvent
		if err := json.Unmarshal(msg.Value, &event); err != nil {
			log.Printf("unmarshal error: %v — raw: %s", err, msg.Value)
			_ = reader.CommitMessages(ctx, msg)
			continue
		}

		result := eng.Process(&event.Order)

		out, err := json.Marshal(result)
		if err != nil {
			log.Printf("marshal error: %v", err)
		} else {
			if err := writer.WriteMessages(ctx, kafka.Message{
				Key:   []byte(event.Order.MarketID),
				Value: out,
			}); err != nil {
				log.Printf("write error: %v", err)
			} else {
				fmt.Printf("processed order %s → %d trade(s), filled %.4f\n",
					result.OrderID, len(result.Trades), result.FilledQty)
			}
		}

		_ = reader.CommitMessages(ctx, msg)
	}

	log.Println("Shutting down…")
	_ = reader.Close()
	_ = writer.Close()
}
