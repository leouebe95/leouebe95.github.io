<?php

require "connect.php";
header("Content-Type: application/json; charset=UTF-8");

$maxAnswer = 20;

define('MODE_ALL', '0');
define('MODE_INCL', '1');
define('MODE_EXCL', '2');

mb_internal_encoding('utf8');
// For testing
//$_GET = array("incl" => "足入円出子石空花月年雨青");
//$_GET = array("incl" => "足");
//$_GET = array("incl" => "入");
//$_GET = array("incl" => "め");
//$_GET = array("excl" => "足入円出子石空花月年雨青");

$response = array();

$conn = openDB(false, $DBName);

// Get all samples containing those kanjis
$mode = MODE_ALL;
if (array_key_exists("incl", $_GET)) {
  $mode = MODE_INCL;
  $chars = $_GET["incl"];
} else if (array_key_exists("excl", $_GET)) {
  $mode = MODE_EXCL;
  $chars = $_GET["excl"];
}

$response = Array();

// Could not find a way to use RLIKE with UTF-8 characters.
// Loop explicitely on all chars then.
//$where = "nihongo RLIKE '[".$_GET["kanjis"]."]'";
//$where = "nihongo RLIKE '".$_GET["kanjis"]."'";
//$where = "nihongo LIKE '%入%' OR nihongo LIKE '%足%'";
//$where = "id = 1";

if ($mode == MODE_ALL) {
  $where = '1=1';
} else {
  $chrArray = preg_split('//u', $chars, -1, PREG_SPLIT_NO_EMPTY);
  $whereChr = Array();
  foreach($chrArray as $chr) {
	$whereChr[] = "(nihongo LIKE '%".$chr."%')";
  }
  $where = join(" OR ", $whereChr);

  if ($mode == MODE_EXCL) {
	$where = "NOT (".$where.")";
  }
}

$sql = "SELECT id,nihongoNorm,english,grade FROM ".$TableName." WHERE ".$where;

if ($res = $conn->query($sql)) {
  $resData = $res->fetch_all();
  // make the order random
  shuffle($resData);
  
  // Return the first $maxAnswer entries
  $count = 0;
  foreach ($resData as $data) {
	$response[] = array("id"      => $data[0],
						"nihongo" => $data[1],
						"english" => $data[2],
						"grade"   => $data[3]);
	$count++;
	if ($count>= $maxAnswer) {
	  break;
	}
  }
}

// Send string directly not unicode
function jsonRemoveUnicodeSequences($struct) {
   return preg_replace("/\\\\u([a-f0-9]{4})/e", "iconv('UCS-4LE','UTF-8',pack('V', hexdec('U$1')))", json_encode($struct));
}

// Send result as JSON
echo jsonRemoveUnicodeSequences($response);
echo "\n";
//echo mb_internal_encoding();
//echo "\n";
//echo $sql;
//echo "\n";
//print_r($response[0]);
?>