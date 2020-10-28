#!/bin/bash

if [[ -n "${HEROKU_APP_NAME}" ]];
then
  export HOSTNAME=${HEROKU_APP_NAME}.herokuapp.com
fi
