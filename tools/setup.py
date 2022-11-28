import datetime as dt

from setuptools import setup, find_packages

setup(
    name="tools",
    python_requires='>=3.7',
    version=f"{dt.date.today().strftime('%Y.%m.%d')}.dev0",
    author_email="",  # TODO: what email here?
    description=("Internal tools library for Aurora AI"),
    license="MIT",
    keywords="",
    url="",  # TODO:
    packages=find_packages(exclude=['tests', 'test_*', '*.so', '*.o', '*.a']),
    long_description='',
    classifiers=[],
    install_requires=[
        'boto3',
        'requests'
    ],
    extras_require={
    },
    tests_require=[
        'pytest-cov',
        'mypy'
    ]
)
