<?php
require "connect.php";
header("Content-Type: text/plain; charset=UTF-8");

// Read a tab separated line. Return result as an array
function readLine($file) {
  $line = fgets($file);
  if (!$line) {
	return false;
  }

  $line = rtrim($line); // remove EOL and trailing blanks
  return explode("\t", $line);
}

// Read a tab separated line. Return result as a dictionnary
function readLineAsDict($file, $labels) {
  if (!($data = readLine($file))) {
	return false;
  }

  // Resulting array
  $res = array();

  for ($i = 0; $i < count($data); $i++) {
	if ($i<count($labels)) {
	  $res[$labels[$i]] = trim($data[$i]);
	}
  }

  // Fill missing values with ""
  for ($i = count($data); $i < count($labels); $i++) {
	$res[$labels[$i]] = "";
  }

  return $res;
}

function normalizePunct($text) {
  $text = str_replace(array('(', '〔', '【'), '（', $text);
  $text = str_replace(array(')', '〕', '】'), '）', $text);
  return $text;
}

// Remove all phonetics indications. ? Makes the pattern non greedy.
function normalizeJapanese($text) {
  $text = preg_replace('/（(.*?)）/', "", $text);
  return $text;
}

// Return a string suitable for SET
function setData($mysqli, $row, $keys) {
  $res = "";
  foreach ($keys as $key) {
	if ($res !== "") {
	  $res = $res.", ";
	}
	$res = $res.$key."='".$mysqli->real_escape_string($row[$key])."'";
  }
  return $res;
}

// Return a string suitable for adding a new row
function newData($mysqli, $row, $keys) {
  $keysNames = join(",", $keys);
  $keysValues = array();

  for ($i = 0; $i < count($keys); $i++) {
	$keysValues[$i] = $mysqli->real_escape_string($row[$keys[$i]]);
  }

  return "(".$keysNames.") VALUES ('".join("','", $keysValues)."')";
}

// Open a connection to the sentence DB
$conn = openDB(true, $DBName);

//
// Assume file is encoded in UTF-8. In excel save a Unicode text. Load
// in emacs, set encoding to UTF-8, resave.
$file = fopen('E:/jm-perso/git/leouebe95.github.io/kanji/inputData.txt', 'r', 1);
if (!$file) {
  die("Could not open input file\n");
}

// Read Column labels, convert all labels to lowecase.
$labels = array_map('strtolower', readLine($file));

while (($rowData = readLineAsDict($file, $labels)) !== FALSE) {
  if ($rowData['nihongo'] == "") { continue; }

  $rowData['nihongo'] = normalizePunct($rowData['nihongo']);
  $rowData['nihongoNorm'] = normalizeJapanese($rowData['nihongo']);
  // Check if this entry is already in the DB. Use the normalized
  // japanese text as key
  $key = "nihongoNorm='".$conn->real_escape_string($rowData['nihongoNorm'])."'";
  $sql = "SELECT COUNT(*) FROM ".$TableName." WHERE ".$key." LIMIT 5";

  if ($res = $conn->query($sql)) {
	$resNum = $res->fetch_row();
	if ($resNum[0]>0) {
	  // Row exists
	  $sql = "UPDATE ".$TableName.
		" SET ".setData($conn, $rowData, array('nihongo', 'english', 'grade')).
		" WHERE ".$key;
	} else {
	  // New row
	  $sql = "INSERT INTO ".$TableName." ".newData($conn, $rowData, array('nihongo', 'nihongoNorm', 'english', 'grade'));
	}
	print($sql."\n");
	if (!$conn->query($sql)) {
	  echo "Error: " . $sql . "<br>" . mysqli_error($conn);
	}
	
  } else {
	die("Cannot check if row exists: " . $conn->error);
  }

}

fclose($file);

$conn->close();
?>