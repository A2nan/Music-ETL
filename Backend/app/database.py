from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "postgresql://uvanz7hdjlhcwfps7lh7:gRro38Ko8kBCvlBaz3TTf2HPBd6jTz@bhlvoyopvbuuym4bjiim-postgresql.services.clever-cloud.com:5432/bhlvoyopvbuuym4bjiim"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()