<?php

error_reporting(E_ALL ^ E_NOTICE);
header('charset: utf-8;');
include 'test.php';

session_start();
$ret = array ();
$_SESSION["userid"]=$_POST['uname'];
if ($_FILES['file']["type"] == 'image/png' || $_FILES['file']["type"] == 'image/jpg' ||$_FILES['file']["type"] == 'image/jpeg')
{
    if ($_FILES['file']["error"] > 0)
    {
        echo "Return Code: " . $_FILES['file']["error"] . "<br />";//获取文件返回错误
    }
    else
    {
        //自定义文件名称
        $newfilename=$_POST['fileName'];
        $_FILES['file']["name"]=$newfilename;
        $upload_file = iconv("UTF-8", "GB2312", $_FILES["file"]["name"]);
        if (!is_dir("source/images/userPic"))//当路径不存在
        {
            mkdir("source/images/userPic");//创建路径
        }
        $url="source/images/userPic/";//记录路径
        $url=$url.$upload_file;
        if (file_exists($url.$upload_file))//当文件存在
        {
            move_uploaded_file($_FILES['file']["tmp_name"],$url);
        }
        else//当文件不存在
        {
            move_uploaded_file($_FILES['file']["tmp_name"],$url);
        }
        $ret['success'] = 1;
        update($_POST['serverName'],$_POST['uid'],$_POST['pwd'],$_POST['Database'],$_POST['tableName'],$_POST['setStr'],$_POST['where']);
    }
}
else
{
    $ret['success'] = 0;
    echo json_encode($ret);
}
?>
