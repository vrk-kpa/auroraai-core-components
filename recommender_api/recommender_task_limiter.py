from contextlib import contextmanager
from threading import Lock

from tools.config import config


class RecommenderTaskLimiterCapacityError(Exception):
    pass


class RecommenderTaskLimiter:
    def __init__(self, limit: int):
        self._task_count = 0
        self._size = limit
        self.lock = Lock()

    def add_task(self):
        if self._task_count >= self._size:
            raise RecommenderTaskLimiterCapacityError("Max task count reached.")

        self.lock.acquire()
        self._task_count += 1
        self.lock.release()

    def end_task(self):
        if self._task_count == 0:
            raise RecommenderTaskLimiterCapacityError("Cannot decrement task count below 0.")

        self.lock.acquire()
        self._task_count -= 1
        self.lock.release()


@contextmanager
def recommender_task_limit(app):
    if app.recommender_task_limiter is None:
        app.recommender_task_limiter = RecommenderTaskLimiter(config['worker_max_recommendations_tasks'])

    app.recommender_task_limiter.add_task()
    yield
    app.recommender_task_limiter.end_task()


