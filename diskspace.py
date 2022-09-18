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

f = open('backend.config.json')
config = json.load(f)
paths = ''
for path in config['paths']:
	paths += path + ' '

def cmd(s, default=""):
	try:
		pipe = subprocess.run(s, check=True, timeout=300, shell=True, stdout=subprocess.PIPE)
		out = pipe.stdout.decode("utf-8")
	except Exception as e:
		print(e, file=sys.stderr)
		return default
	return out

now = int(datetime.now().timestamp())
diskspace = cmd("( du -ab --time --time-style=+\%s "+paths+" ) | sort -k 1 -nr")
files = diskspace.splitlines()

hdd = cmd("quota | tail -n1 | awk -F' +' '{ print $3 }'", "0")
try:
	hdd = int(hdd)*1024
except:
	hdd = 0

quota = cmd("quota | tail -n1 | awk -F' +' '{ print $4 }'", "0")
try:
	quota = int(quota)*1024
except:
	quota = 0

df_used = int(cmd("df -B1 "+paths+" | tail -n1 | awk -F' +' '{ print $3 }'"))
df_avail = int(cmd("df -B1 "+paths+" | tail -n1 | awk -F' +' '{ print $4 }'"))

output = {
	"now": now, "files": files, "quota": quota, "hddusage": hdd, "paths": config['paths'], "df_used": df_used, "df_avail": df_avail
}
print( json.dumps(output) )
