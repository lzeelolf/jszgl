
<?php
error_reporting(E_ALL ^ E_NOTICE);
header('charset: utf-8;');
header('content-type:application/json');



//执行查询语句的select函数,参数一为传入的数据（字符串），
//参数二为要比对的表名。例如传入‘张三’，比对‘UName’
//参数三为数据库地址，参数四为用户名，五为密码，六为数据库名
//参数七为表名，参数八为要选取的列名
function select($content,$target,$serverName,$uid,$pwd,$Database,$tableName,$column,$order){
    $connectionInfo = array("Uid"=>$uid, "Pwd"=>$pwd, "Database"=>$Database,"CharacterSet"=>"UTF-8");
    $conn = sqlsrv_connect($serverName, $connectionInfo);
    if($target === 'PayId' && is_string($content)){//如果比对的是工资号，说明是登录操作，
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
    else if($target === 'department' && is_array($content)){//如果比对department并且传来的是数组，
        //是按部门查询证件操作，执行以下代码
        if( $conn === false)
        {
            //连接失败
            die(print_r(sqlsrv_errors(), true));
        }else{
            //"链接成功";//连接数据库
            //判断传来的数组长度来决定sql语句中的where...如何定义；今后若有加别的部门的需求，可以直接在html页面上添加元素即可
            //这个变量是sql语句where之后的句段
            $departmentSelected = "";
            for($i=0;$i<count($content);$i++){
                $departmentSelected .= $target." like '".$content[$i]."%' or ";
            }
            $departmentSelected = substr($departmentSelected,0,strlen($departmentSelected)-4);
            //查询语句

            $query = sqlsrv_query($conn, "select ".$column." from ".$tableName." where ".$departmentSelected.$order);
            //若查询无数据，html页面alert输出
            if(sqlsrv_rows_affected($query) === 0){
                $ret = array();
                $ret['success'] = 0;
                echo json_encode($ret);
            }else{
                //$ret是返回结果数组。状态码1表示选取有结果，$i临时变量，用来标识结果集数目
                $ret = array();
                $ret['success'] = 1;
                $i = 1;
                while($row= sqlsrv_fetch_array($query,SQLSRV_FETCH_ASSOC)){
                    //$ret['sql'] = "select ".$column." from ".$tableName." where ".$departmentSelected.$order;
                    $ret['row'.$i] = $row;
                    $i++;
                }
                //传回数据条数，用于分页设计,减去'success'
                $ret['count'] = $i-1;
                echo json_encode($ret);
            }
            sqlsrv_close($conn);
        }
    }
}


            //ceshi


//            if(sqlsrv_rows_affected($query) === 0){
//                //通过受影响的列数判断查询信息是否存在，不存在：
//                $ret = array();
//                $ret['success'] = 0;
//                echo json_encode($ret);
//            }
//
//            if(sqlsrv_rows_affected($query)){
//                //查询数据
//                $ret = array();
//                $ret['success'] = 1;
//                while($row = sqlsrv_fetch_object($query))
//                {
//
//                    $ret['row'] = $row->UName;
//                    echo json_encode($ret);
//                }
//            }

function appendElement($serverName,$uid,$pwd,$Database,$tableName,$column){
    $connectionInfo = array("Uid" => $uid, "Pwd" => $pwd, "Database" => $Database, "CharacterSet" => "UTF-8");
    $conn = sqlsrv_connect($serverName, $connectionInfo);
    if ($conn === false) {
        exit();
    } else {
        //"链接成功";
        //连接数据库
        $query = sqlsrv_query($conn, "select " . $column . " from " . $tableName);
        if (sqlsrv_rows_affected($query) === 0) {
            //通过受影响的列数判断查询信息是否存在，不存在：
            $ret = array();
            $ret['success'] = 0;
            echo json_encode($ret);
        }
        if (!empty($query)) {
            //查询数据
            while ($row = sqlsrv_fetch_array($query,SQLSRV_FETCH_ASSOC)) {
                $ret = array();
                $ret['success'] = 1;
                $ret['row'] = $row;
                echo json_encode($ret);
            }
        }
        sqlsrv_close($conn);
    }
}
?>


