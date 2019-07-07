#!/usr/bin/env python3
# -*- coding: UTF-8 -*-

# enable debugging
import cgitb
import sys
import subprocess
import json
from datetime import datetime
cgitb.enable()

print("Content-Type: application/json; charset=utf-8")
print("")

now = int(datetime.now().timestamp())
du = subprocess.Popen("( du -ab --time --time-style=+\%s ~/downloads/ ) | sort -k 1 -nr", shell=True, stdout=subprocess.PIPE)
diskspace = du.stdout.read().decode("utf-8")
files = diskspace.splitlines()

hdd = subprocess.Popen("quota | tail -n1 | awk -F' +' '{ print $3 }'", shell=True, stdout=subprocess.PIPE)
hdd = int(hdd)*1024
quota = subprocess.Popen("quota | tail -n1 | awk -F' +' '{ print $4 }'", shell=True, stdout=subprocess.PIPE)
quota = int(quota)*1024

output = { "now": now, "files": files, "quota": quota, "hddusage": hdd }
print( json.dumps(output) )
