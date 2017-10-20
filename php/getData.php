<?php

require "connect.php";
header("Content-Type: application/json; charset=UTF-8");

// For testing:
//$_GET = array("ids" => "1-2-4-6-7-8-9-22");

$response = array();

$conn = openDB(false, $DBName);

// If explicit IDs are passed, just get those lines
if (array_key_exists("ids", $_GET)) {
  $ids = explode("-", $_GET["ids"]);
  
  $num = min(count($ids), 20);
  for ($i=0 ; $i<$num ; $i++) {
	$id = $ids[$i];
	$sql = "SELECT nihongo,english,grade FROM ".$TableName." WHERE id=".$conn->real_escape_string($id);
	if ($res = $conn->query($sql)) {
	  $resData = $res->fetch_row();
	  if (count($resData)>0) {
		$response[$i] = array("nihongo" => $resData[0],
							  "english" => $resData[1],
							  "grade"   => $resData[2]);
	  }
	}
  }
}

// Send result as JSON
echo json_encode($response);
echo "\n";
?>