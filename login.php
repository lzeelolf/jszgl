<?php
include("./test.php");
header('charset: utf-8;');
header('content-type:application/json');
//登录html传来的数据，加工后进行验证
$username = isset($_POST["username"]) ? $_POST["username"] : $_GET["username"];
$password = isset($_POST['password']) ? $_POST["password"] : $_GET["password"];
//执行查询语句的select函数,参数一为传入的数据，
//参数二为要比对的表名。例如传入‘张三’，比对‘UName’
//参数三为数据库地址，参数四为用户名，五为密码，六为数据库名
//参数七为表名，参数八为需要取出数据的列名
select($username,'PayId','10.101.62.62',
    'sa','2huj15h1','USERINFO','userinfo1','payid,pwd,uname,power','');
?>