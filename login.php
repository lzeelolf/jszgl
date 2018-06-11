<?php
include("./test.php");
header('charset: utf-8;');
header('content-type:application/json');
//登录html传来的数据，加工后进行验证
$username = isset($_POST["username"]) ? $_POST["username"] : $_GET["username"];
$password = isset($_POST['password']) ? $_POST["password"] : $_GET["password"];
//执行登录功能的login函数,参数一为传入的用户名，
//参数二为要比对的表名。例如传入‘00000’，比对‘payId’
//参数三为数据库地址，参数四为用户名，五为密码，六为数据库名
//参数七为表名，参数八为需要取出数据的列名
login($username,'PayId','10.101.62.62',
    'sa','2huj15h1','USERINFO','userinfo1','payid,pwd,uname,power');
function login($content,$target,$serverName,$uid,$pwd,$Database,$tableName,$column){
    $connectionInfo = array("Uid"=>$uid, "Pwd"=>$pwd, "Database"=>$Database,"CharacterSet"=>"UTF-8");
    $conn = sqlsrv_connect($serverName, $connectionInfo);
    if( $conn === false)//执行以下代码（切记PayId要和login.php中的字段一致，区分大小写）
    {
        exit();
    }else{
        //"链接成功";
        //连接数据库
        $query = sqlsrv_query($conn, "select ".$column." from ".$tableName." where ".$target."=".'\''.$content.'\'');
        //echo "select ".$column." from ".$tableName." where".$target."=".'\''.$content.'\'';
        if(sqlsrv_rows_affected($query) === 0){
            //通过受影响的列数判断查询信息是否存在，不存在：
            $ret = array();
            $ret['success'] = 0;
            echo json_encode($ret);
        }
        if(!empty($query)){
            //查询数据
            while($row = sqlsrv_fetch_array($query))
            {
                //把password加入全局以比对pwd
                Global $username;
                Global $password;
                $ret = array();
                $ret['success'] = 1;
                if($row['pwd'] === $password && $row['payid']===$username){
                    //'验证正确';
                    $ret['login'] = 1;
                    //用某一列数据生成一个token来验证用户，测试阶段使用uname列
                    $ret['token'] = base64_encode($row['uname']);
                    //系统使用power字段的第21位作为权限判断，截取出来发给客户端存session
                    $ret['power'] = substr($row['power'],20,1);
                    $ret['username'] = $row['uname'];
                }else{
                    $ret['login'] =0;
                }
                echo json_encode($ret);
            }
        }
        sqlsrv_close( $conn);
    }
}
?>