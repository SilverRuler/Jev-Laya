* dependencies install

```bash
$ uv sync
```

* run

```bash
$ uv run uvicorn main:app --reload
```

* test

```bash
$ curl --location 'http://127.0.0.1:8000/v1/systemone' \
--header 'Content-Type: application/json' \
--data '{
    "state": "Help! My payouts have been failing for 3 days.",
    "questions": {
      "is_urgent": { "type": "noul", "instructions": "Does this convey urgency?" },
      "department": {
        "type": "choice",
        "instructions": "Which team should handle this?",
        "criteria": { "billing": "payments, invoicing, refunds", "technical": "bugs, outages", "sales": "pricing, new accounts" }
      }
    }
  }'
```