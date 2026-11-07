// SPDX-License-Identifier: Apache-2.0
use axum::{routing::get, Json, Router};
use std::net::SocketAddr;
use yolo_backend_core::{get_system_health, BackendHealth};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let app = Router::new()
        .route("/health", get(health_handler))
        .route("/", get(root_handler));

    let addr = SocketAddr::from(([0, 0, 0, 0], 8796));
    tracing::info!("YOLO Backend Core Rust Server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_handler() -> Json<BackendHealth> {
    Json(get_system_health())
}

async fn root_handler() -> &'static str {
    "Aphrody YOLO Backend Core Systems Engine (Rust 2024 / Fat LTO)"
}
