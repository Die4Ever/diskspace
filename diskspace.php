<?php

$json = file_get_contents("backend.config.json");
$config = json_decode($json);
$paths = '';

foreach($config->{paths} as $path) {
 $paths .= $path . ' ';
}

$res = `( du -ab --time --time-style=+\%s $paths ) | sort -k 1 -nr`;
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
	"requests" => $requests,
	"paths" => $config->{du_paths}
);

echo json_encode($response);

?>
