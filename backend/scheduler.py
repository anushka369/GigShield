from apscheduler.schedulers.background import BackgroundScheduler

_scheduler: BackgroundScheduler | None = None


def start_scheduler():
    global _scheduler
    from services.trigger_monitor import run_all_triggers
    _scheduler = BackgroundScheduler(timezone="UTC")
    _scheduler.add_job(
        run_all_triggers,
        "interval",
        minutes=5,
        id="trigger_monitor",
        misfire_grace_time=60,
    )
    _scheduler.start()
    print("APScheduler started — trigger monitor polling every 5 minutes")


def stop_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        print("APScheduler stopped")
