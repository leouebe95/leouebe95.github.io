<?php

$DBName = "nihonsentences";
$TableName = "sentences";

function openDB($asAdmin, $DBName=NULL, $verbose=false) {
  $servername = "localhost";
  if ($asAdmin) {
	$username = "nihonadmin";
	$password = "vs27h2MD484fwCDR";
  }
  else {
	$username = "nihon";
	$password = "USZQP8WtJXj7A74D";
  }

  // Create connection
  $conn = new mysqli($servername, $username, $password, $DBName);
  // Check connection
  if ($conn->connect_error) {
	die("Connection failed: " . $conn->connect_error);
  }

  if ($verbose) {
	printf("Initial character set: %s\n", $conn->character_set_name());
  }
  /* change character set to utf8 */
  if (!$conn->set_charset("utf8")) {
    die("Error loading character set utf8: %s\n" . $conn->error);
  }

  if ($verbose) {
	printf("Current character set: %s\n", $conn->character_set_name());
  }
  return $conn;
}

?>