<?php
include("./test.php");
header('charset: utf-8;');
header('content-type:application/json');
if($_POST['funcName'] === 'select'){
    $keyWordsArray = array();
    $key = explode('&',$_POST['key']);
    for($i=0;$i<count($key);$i++){
        if($key[$i]){
            $keyWordsArray[$i] = $key[$i];
        }
    }
    select($keyWordsArray,$_POST['target'],$_POST['serverName'],
        $_POST['uid'],$_POST['pwd'],$_POST['Database'],$_POST['tableName'],
        $_POST['column'],$_POST['order']);
}else if($_POST['funcName'] === 'appendElement'){
    appendElement($_POST['serverName'],
        $_POST['uid'],$_POST['pwd'],$_POST['Database'],$_POST['tableName'],
        $_POST['column']);
}

?>
