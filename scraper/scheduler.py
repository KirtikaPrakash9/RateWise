"""
RateWise AI - Scheduler
Runs the scraper on a configurable schedule (default: daily at 06:00 UTC).
"""

import schedule
import time
import logging
from scraper import run as scrape

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def job():
    logger.info("Scheduled scrape starting…")
    try:
        scrape()
        logger.info("Scheduled scrape completed.")
    except Exception as exc:
        logger.error("Scheduled scrape failed: %s", exc)


if __name__ == "__main__":
    # Run once immediately, then schedule
    job()
    schedule.every().day.at("06:00").do(job)
    logger.info("Scheduler running — next run at 06:00 UTC daily. Press Ctrl+C to stop.")
    while True:
        schedule.run_pending()
        time.sleep(60)
