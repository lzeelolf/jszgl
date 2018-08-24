<?php
include("./test.php");
header('charset: utf-8;');
header('content-type:application/json');
if($_POST['funcName'] === 'select'){
    select($_POST['where'],$_POST['serverName'],
        $_POST['uid'],$_POST['pwd'],$_POST['Database'],$_POST['tableName'],
        $_POST['column'],$_POST['order']);
}else if($_POST['funcName'] === 'appendElement'){
    appendElement($_POST['serverName'],
        $_POST['uid'],$_POST['pwd'],$_POST['Database'],$_POST['tableName'],
        $_POST['column']);
}else if($_POST['funcName'] === 'checkIfExist'){
    checkIfExist($_POST['where'],$_POST['serverName'],$_POST['uid'],$_POST['pwd'],
        $_POST['Database'],$_POST['tableName'],$_POST['column'],$_POST['order']);
}else if($_POST['funcName'] === 'getInfo'){
    getInfo($_POST['where'],$_POST['serverName'],$_POST['uid'],$_POST['pwd'],
        $_POST['Database'],$_POST['tableName'],$_POST['column']);
}else if($_POST['funcName'] === 'insert'){
    insert($_POST['serverName'],$_POST['uid'],$_POST['pwd'],
        $_POST['Database'],$_POST['tableName'],$_POST['column'],$_POST['values']);
}else if($_POST['funcName'] === 'getCsxx'){
    getCsxx($_POST['serverName'],$_POST['uid'],$_POST['pwd'],
        $_POST['Database'],$_POST['tableName'],$_POST['column']);
}else if($_POST['funcName'] === 'update'){
    update($_POST['serverName'],$_POST['uid'],$_POST['pwd'],
        $_POST['Database'],$_POST['tableName'],$_POST['setStr'],$_POST['where']);
}else if($_POST['funcName'] === 'delete'){
    delete($_POST['serverName'],$_POST['uid'],$_POST['pwd'],
        $_POST['Database'],$_POST['tableName'],$_POST['where']);
}

?>
