#!/bin/bash

#TRANSIFEX_API_TOKEN=""
TROPY="https://www.transifex.com/api/2/project/tropy"

for lang in de fr es pt ja it zh_CN
do
  for resource in app-menu context-menu browser renderer
  do
    curl -L --user api:$TRANSIFEX_API_TOKEN -X GET \
      $TROPY/resource/$resource/translation/$lang/?file=yml \
      > for_use_tropy_${resource}_${lang//zh_CN/cn}.yml
  done
done

sed -si 1s/zh_CN:/cn:/ for_use_tropy_*

