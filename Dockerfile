# syntax=docker/dockerfile:1

FROM python:3.12-slim-bookworm AS builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project

COPY . .

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen

# collectstatic only needs a syntactically valid SECRET_KEY, never the real one —
# this value never reaches the runtime stage below.
ENV DJANGO_SECRET_KEY=build-time-placeholder-unused-at-runtime

RUN uv run manage.py collectstatic --noinput

FROM python:3.12-slim-bookworm AS runtime

RUN groupadd --system app && useradd --system --gid app --no-create-home app

WORKDIR /app
RUN chown app:app /app

COPY --from=builder --chown=app:app /app /app

ENV PATH="/app/.venv/bin:$PATH" \
    HOME="/app"

USER app

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", \
     "--workers", "2", "--threads", "4", "--worker-class", "gthread", \
     "--bind", "0.0.0.0:8000", \
     "--access-logfile", "-", "--error-logfile", "-"]
