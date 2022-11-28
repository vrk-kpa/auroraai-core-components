#!/usr/local/bin/python
# -*- coding: utf-8 -*-
# pylint: skip-file

from gevent import monkey
monkey.patch_all()
from tools.logger import log, LogOperationName
import os

with log.open():
    log.technical.info("operationName", LogOperationName.SERVER_INITIALIZATION)
    log.technical.info("branch", os.getenv("BUILD_BRANCH"))
    log.technical.info("build", os.getenv("BUILD_NUMBER"))
    log.technical.info("commitSha", os.getenv("BUILD_COMMIT_SHA"))


import re
import sys

from gunicorn.app.wsgiapp import run

if __name__ == '__main__':
    sys.argv[0] = re.sub(r'(-script\.pyw|\.exe)?$', '', sys.argv[0])
    sys.exit(run())
