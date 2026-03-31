FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o engine .

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/engine .
ENV KAFKA_BROKER=redpanda:9092
CMD ["./engine"]
