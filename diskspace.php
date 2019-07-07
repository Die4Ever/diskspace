<?php
$res = `( du -ab --time --time-style=+\%s ~/downloads/ ) | sort -k 1 -nr`;
$hdd = `quota | tail -n1 | awk -F' +' '{ print $3 }'`;
$now = intval(`date +%s`);
$quota = `quota | tail -n1 | awk -F' +' '{ print $4 }'`;
$files = preg_split("/((\r?\n)|(\r\n?))/", $res);
$res = '';
$requests = preg_split("/((\r?\n)|(\r\n?))/", $res);

$response = array(
	"now" => (int)$now,
	"files" => $files,
	"hddusage" => (int)$hdd*1024,
	"quota" => (int)$quota*1024,
	"requests" => $requests
);

echo json_encode($response);

?>
