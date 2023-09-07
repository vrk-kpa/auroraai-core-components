from time import sleep
from threading import Event
from concurrent.futures import ThreadPoolExecutor

import pytest

from recommender_api.recommender_task_limiter import recommender_task_limit, RecommenderTaskLimiter, \
    RecommenderTaskLimiterCapacityError


class MockApp:
    def __init__(self):
        self.recommender_task_limiter = None


def test_adding_adding_and_ending_single_task():
    app = MockApp()
    with recommender_task_limit(app):
        assert app.recommender_task_limiter._task_count == 1
    assert app.recommender_task_limiter._task_count == 0


def test_adding_multiple_tasks():
    app = MockApp()
    app.recommender_task_limiter = RecommenderTaskLimiter(2)
    with recommender_task_limit(app):
        assert app.recommender_task_limiter._task_count == 1
        with recommender_task_limit(app):
            assert app.recommender_task_limiter._task_count == 2

    assert app.recommender_task_limiter._task_count == 0


def test_adding_task_at_full_capacity_raises_error():
    app = MockApp()
    app.recommender_task_limiter = RecommenderTaskLimiter(4)
    app.recommender_task_limiter._task_count = 4

    with pytest.raises(RecommenderTaskLimiterCapacityError):
        with recommender_task_limit(app):
            pass

    assert app.recommender_task_limiter._task_count == 4


def test_catching_capacity_error():
    app = MockApp()
    app.recommender_task_limiter = RecommenderTaskLimiter(4)
    app.recommender_task_limiter._task_count = 4

    try:
        with recommender_task_limit(app):
            assert False
    except RecommenderTaskLimiterCapacityError:
        assert True

    assert app.recommender_task_limiter._task_count == 4


def test_task_pool_in_threads():
    app = MockApp()
    app.recommender_task_limiter = RecommenderTaskLimiter(5)

    def work_hard(event):
        with recommender_task_limit(app):
            while not event.is_set():
                sleep(0.1)

    event = Event()

    with ThreadPoolExecutor() as executor:
        futures = [executor.submit(work_hard, event) for _ in range(6)]
        sleep(0.5)
        max_tasks_active = app.recommender_task_limiter._task_count

        event.set()

    # Tried to create 6 tasks with 5 capacity so 1 task must have failed
    assert max_tasks_active == 5
    assert len([f for f in futures if f.exception() is not None]) == 1

    assert app.recommender_task_limiter._task_count == 0
