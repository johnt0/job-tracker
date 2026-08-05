# Job Application Tracker

A single-user REST API for tracking job applications — company, role, application link, current stage, and date applied. Built with Django and Django REST Framework.

## Tech stack

- Python 3.12+, [uv](https://docs.astral.sh/uv/) for dependency management
- Django 6.0
- Django REST Framework
- SQLite (development database)

## Data model

`applications/models.py`

```python
class ApplicationState(models.TextChoices):
    APPLIED = "APPLIED", "Applied"
    INTERVIEWING = "INTERVIEWING", "Interviewing"
    OFFERED = "OFFER", "Offer"
    REJECTED = "REJECTED", "Rejected"

class Application(models.Model):
    title = models.CharField(max_length=128)
    company = models.CharField(max_length=128)
    date_applied = models.DateField()
    state = models.CharField(max_length=128, choices=ApplicationState.choices)
    link = models.URLField(blank=True)
```

## API

All endpoints are mounted under `/applications/`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/applications/` | List all applications. Supports `?state=APPLIED\|INTERVIEWING\|OFFER\|REJECTED` to filter. |
| `POST` | `/applications/` | Create a new application. `state` is always forced to `APPLIED` server-side (see Business rules). |
| `GET` | `/applications/<id>/` | Retrieve a single application. |
| `PUT` / `PATCH` | `/applications/<id>/` | Update an application (e.g. move to a new state). |
| `DELETE` | `/applications/<id>/` | Delete an application. |

The browsable API (visit any endpoint in a browser) provides an HTML form for manual testing without a frontend.

Django admin is also available at `/admin/` for direct data inspection (requires `manage.py createsuperuser`).

## Business rules

- **New applications always start at `APPLIED`.** The client can't set an initial state — enforced in `ApplicationSerializer.create()`, which overwrites whatever `state` value is submitted on creation.
- **Free state transitions.** Any state can move to any other state via `PATCH`/`PUT`, allowing the user to correct mistakes (e.g. an accidental `Rejected`).
- **Filtering by state** is handled in `ApplicationViewSet.get_queryset()`, reading the `state` query parameter and narrowing the queryset when present.

## Setup

```bash
uv sync
uv run manage.py migrate
uv run manage.py createsuperuser   # optional, for /admin/
uv run manage.py runserver
```

Then visit `http://127.0.0.1:8000/applications/`.

## Tests

```bash
uv run manage.py test applications
```

Covers the state-default-on-create rule and state filtering (both with a matching and non-matching case).

## Future improvements

- **Stale-application reminders**: notify when an application has sat in `APPLIED` for 2+ weeks with no update. Needs a `last_updated` timestamp field on the model, plus a scheduled job to check it.
- **State transition validation**: currently any state can move to any other state with no guardrails; could add confirmation for unusual transitions (e.g. `Offer` → `Rejected`).
- **Multiple interview rounds**: `Interviewing` is currently a single state; could be broken into individual rounds (phone screen, onsite, final) with their own outcomes.
- **Auth**: single-user, no auth currently — would be needed if this became multi-user.
