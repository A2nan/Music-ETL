from airflow import DAG 
from airflow.operators.python import PythonOperator  
from datetime import datetime
import sys

sys.path.append("/opt/airflow/Backend")

from app.services.etl_service import run_etl  

def run_music_etl():
    run_etl(genre="pop")   

with DAG(
    dag_id="music_etl_pipeline",
    start_date=datetime(2025, 1, 1),
    schedule="*/1 * * * *",   # Toutes les minutes
    catchup=False,
    tags=["music", "etl", "deezer"],
) as dag:

    etl_task = PythonOperator(
        task_id="run_music_etl",
        python_callable=run_music_etl,
    )

    etl_task


