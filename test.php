
<?php
error_reporting(E_ALL ^ E_NOTICE);
header('charset: utf-8;');
header('content-type:application/json');



//执行查询语句的select函数,参数一为传入的where语句('where xxx = 'xxx'')，
//参数二为数据库地址，参数三为用户名，四为密码，五为数据库名
//参数六为表名，参数七为要选取的列名,参数八是排序依据
function select($where,$serverName,$uid,$pwd,$Database,$tableName,$column,$order){
    $connectionInfo = array("Uid"=>$uid, "Pwd"=>$pwd, "Database"=>$Database,"CharacterSet"=>"UTF-8");
    $conn = sqlsrv_connect($serverName, $connectionInfo);
        if( $conn === false)
        {
            //连接失败
            die(print_r(sqlsrv_errors(), true));
        }else{
            //"链接成功";//连接数据库
            //这个变量是sql语句where之后的句段

            $query = sqlsrv_query($conn, "select ".$column." from ".$tableName.$where.$order);
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


