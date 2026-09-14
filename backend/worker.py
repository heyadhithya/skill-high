"""Durable, PostgreSQL-backed jobs. Start with `procrastinate --app worker.app worker`."""

import os

from procrastinate import App, PsycopgConnector


def connection_url() -> str:
    return os.getenv("DATABASE_URL", "postgresql+psycopg://skillhigh:skillhigh@127.0.0.1:54329/skillhigh_dev").replace("postgresql+psycopg://", "postgresql://")


app = App(connector=PsycopgConnector(conninfo=connection_url()))


@app.task(retry=True)
def notify_order_completion(order_id: int) -> None:
    # ponytail: local development has no real email provider; add one only at deployment.
    print(f"Skill-High notification: order {order_id} completed")
