FROM python:3.11-slim

WORKDIR /app

COPY ./api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./api /app/api

CMD ["uvicorn", "api.server:app", "--host", "0.0.0.0", "--port", "8000"]