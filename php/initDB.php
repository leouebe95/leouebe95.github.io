<?php

require "connect.php";
header("Content-Type: text/plain; charset=UTF-8");

$conn = openDB(true);

// Check if DB already exists
// ---------------------------------------------------------------------------
$sql = 'SELECT COUNT(*) AS `exists` FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMATA.SCHEMA_NAME="'.$DBName.'"';

// execute the statement
$query = $conn->query($sql);
if ($query === false) {
  die("Cannot query DB: " . $conn->error);
}

// extract the value
$row = $query->fetch_object();
$dbExists = (bool) $row->exists;

if ($dbExists) {
  echo "DB already exists\n";
  return 0;
}

// Create database
// ---------------------------------------------------------------------------
$sql = "CREATE DATABASE IF NOT EXISTS " . $DBName . " DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci";
if ($conn->query($sql) === TRUE) {
  echo "Database created successfully\n";
} else {
  die("Error creating database: " . $conn->error);
}

$conn->close();

// Open a connection to the newly created DB
$conn = openDB(true, $DBName);

// Create table
// nihongoNorm is an internal column used as a key to decide if a new
// entry shold be created or an old one updated
// ---------------------------------------------------------------------------
$sql = "CREATE TABLE ".$TableName." (
id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
nihongo VARCHAR(80) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
nihongoNorm VARCHAR(80) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
english VARCHAR(200) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
grade INT(2) UNSIGNED
)";

if ($conn->query($sql) === TRUE) {
  echo "Table created successfully\n";
} else {
  die("Error creating table: " . $conn->error);
}
$conn->close();
?>