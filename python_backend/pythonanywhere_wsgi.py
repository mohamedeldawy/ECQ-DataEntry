import os
import sys

# Replace YOUR_USERNAME and the project path with the values for your account.
PROJECT_HOME = "/home/YOUR_USERNAME/Quiz-PaperSummary-Dashboard"
PRIVATE_DATA_HOME = "/home/YOUR_USERNAME/.quality-dashboard"

os.environ.setdefault("QUALITY_DASHBOARD_DATA_DIR", PRIVATE_DATA_HOME)
os.environ.setdefault("QUALITY_DASHBOARD_COOKIE_SECURE", "1")
sys.path.insert(0, PROJECT_HOME)

from app import app as application
