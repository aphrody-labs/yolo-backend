# Multi-Stage Production Dockerfile for Aphrody YOLO Backend (Bun AoT + Rust Fat LTO)
# Syntax = docker/dockerfile:1

FROM rust:1.85-bookworm AS rust-builder
WORKDIR /usr/src/app
COPY Cargo.toml Cargo.lock ./
COPY crates ./crates
RUN cargo build --release -p yolo-backend-core

FROM oven/bun:1.4.4-alpine AS bun-builder
WORKDIR /usr/src/app
COPY package.json bun.lock ./
COPY packages ./packages
COPY src ./src
COPY scripts ./scripts
COPY tsconfig.json bunfig.toml ./
RUN bun install --frozen-lockfile
RUN bun build --compile --minify --bytecode src/index.ts --outfile dist/yolo-backend

FROM debian:bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl && rm -rf /var/lib/apt/lists/*
COPY --from=bun-builder /usr/src/app/dist/yolo-backend /app/yolo-backend
COPY --from=rust-builder /usr/src/app/target/release/yolo-backend-core /app/yolo-backend-core

EXPOSE 8795 8796
ENV PORT=8795
ENV RUST_PORT=8796

CMD ["/app/yolo-backend"]
