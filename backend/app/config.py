import os
from dotenv import load_dotenv

# Force override system environment variables with project .env
load_dotenv(override=True)

PROJECT_NAME = os.getenv("PROJECT_NAME", "LevelUP")
ENV = os.getenv("ENV", "development")
