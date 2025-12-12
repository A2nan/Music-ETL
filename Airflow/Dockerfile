FROM apache/airflow:latest

USER root

# Installer les dépendances système pour psycopg2
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copier le fichier requirements
COPY requirements.txt /requirements.txt

USER airflow

# Installer les dépendances Python
RUN pip install --no-cache-dir -r /requirements.txt
