//初始化视窗
function initialScreen(){
    $("body").css('width',screen.width);
    if(screen.width < 1024){
        alert('为了更好地显示页面,请至少将分辨率设置为1024*768');
    }
}

//取公用参数信息
var csData = getCs();
function getCs(){
    var csData = {};
        $.ajax({
        url: "../../../ways.php",
        type: "POST",
        timeout: 8000,
        async:false,
        data: {
            funcName: 'getCsxx', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
            tableName: 'csxx', column: ' * '
        },
        dataType: 'json',
        success: function (data) {
            csData = Object.assign({},data)
            return csData
        }
    });
    return csData;
}


//session存储函数,参数为：键名，值名
function sessionSet(key,value){
    sessionStorage.setItem(key,value);
}

//session查询函数
function sessionGet(key){
    return sessionStorage.getItem(key);
}

//session删除函数
function sessionRemove(key){
    sessionStorage.removeItem(key)
}

//session清空函数
function sessionClear(){
    sessionStorage.clear()
}

//用户等待时，显示‘请稍候’图层
function loadingPicOpen(){
    $("#loadingPic").css('display','block');
}

//关闭图层
function loadingPicClose(){
    $("#loadingPic").css('display','none');
}

//获取数据集的列数
function getHowManyColumns(data){
    for(var q in data){
        var t =0;
        for(var p in data[q]){
            t++
        }
    }
    return t;
}

//获取视窗高度并渲染
function resizePage(){
    var windowHeight = $(window).height();
    $("#banner").css('height',windowHeight*0.25+'px');
    $("#banner h1").css('line-height',windowHeight*0.25+'px');
    $("#main").css('height',windowHeight*0.5+'px');
    $("#bottom").css('height',windowHeight*0.25+'px');
}

//检查arr数组中是否含有值为字符串str的元素，
function checkIfInArray(str,arr){
    for(var i =0;i<arr.length;i++){
        if(arr[i] === str){
            return true
        }
    }
    return false
}
//检查登录状态和用户名
function loginStatus(){
    if(sessionGet('user')){
        $(".navbar-inverse .name").text(sessionGet('user'))
    }else{
        alert('请先登录！');
        window.location.href = 'login.html';
    }
}



//生成excel函数
function htmlToXls(data,name,filterArray,headerArray){
    var option={};
    option.fileName = name;
    var arr =[];
    var j =0;
    for(var i in data){
        arr[j] = data[i];
        j++;
    }
    option.datas=[
        {
            //sheetData要求是数组类型
            sheetData:arr,
            sheetName:'sheet',
            sheetFilter:filterArray,
            sheetHeader:headerArray
        }
    ];
    var toExcel=new ExportJsonExcel(option);
    toExcel.saveExcel();
}



function boundOutputExcel(data){
    //生成excel文件
    $("#queryCardBanner .htmlToXls").off('click').on('click',function(){
        if(confirm('是否要将查询结果生成Excel文件？')){
            var filterArray = [];
            var headerArray =[];
            var arr  = $("#queryTable th");
            for(var i =0;i<arr.length;i++){
                filterArray.push($(arr[i]).attr('id'));
                headerArray.push($(arr[i]).text());
            }
            htmlToXls(data,'机车驾驶证统计信息表',filterArray,headerArray)
        }
    })
}

//绑定事件函数，参数是元素、事件名、函数名
function eventBound(element,event,func){
    element.addEventListener(event,func,false);
}


//登录函数,ajax向php发送请求，调用php的sqlsrv模块查询数据库，login.html
function login(){
    if($("#username").val() && $("#password").val()){
        var ajaxTimeOut = $.ajax({
            url: "../../../login.php",
            type:"POST",
            timeout:8000,
            data: "username=" + $("#username").val() + "&password=" + $("#password").val(),
            //data:{username:$("#username").val(),password:$("#password").val()},
            success: function(data){
                console.log(data)
                if(data.success===1 && data.login ===1){ // 根据返回的数据做不同处理
                    sessionSet('token',data.token);
                    sessionSet('power',data.power);
                    sessionSet('user',data.username);
                    sessionSet('department',data.department);
                    sessionSet('payId',data.payId);
                    //记住登录时的session
                    userSessionInfo = rememberSession('token', 'user', 'power', 'department','payId');
                    alert('欢迎，'+data.username);
                    window.location.href = 'index.html'
                    return userSessionInfo
                }else if(data.success===1 && data.login !==1){
                    alert('密码错误！')
                }else if(data.success===0){
                    alert('用户名不存在！')
                }
            },
            beforeSend:loadingPicOpen(),
            complete: function (XMLHttpRequest,status) {
                loadingPicClose();
                if(status === 'timeout') {
                    ajaxTimeOut.abort();    // 超时后中断请求
                    alert('网络超时，请检查网络连接');
                    window.location.reload();
                }
            }
        });
    }else{
        alert('用户名和密码不能为空！');
    }
}


//记住登陆时的session状态，以免用户更改权限
function rememberSession(token,user,power,department,payId){
    var userInfo = {};
    userInfo.token = sessionGet(token);
    userInfo.user = sessionGet(user);
    userInfo.power = sessionGet(power);
    userInfo.department = sessionGet(department);
    userInfo.payId = sessionGet(payId);
    return userInfo;
}


//测试session是否被更改过
function testSession(obj){
    //2018.8.24
    $.ajax({
        url: "../../../ways.php",
        type:"POST",
        timeout:8000,
        data:{funcName:'select',serverName:'10.101.62.62',uid:'sa',pwd:'2huj15h1',Database:'userinfo',
            tableName:'userinfo1',column:' substring(power,21,1) AS power,uName',where:' where payId = \''+obj.payId+'\''},
        dataType:'json',
        success:function(data){
            if(data['success'] === 1){
                if(data['row1']['power'] === obj.power && data['row1']['uName'] === obj.user ){

                }else{
                    alert('用户信息发生变化，请重新登录')
                    window.location  = 'login.html'
                }
            }else{
                alert('用户信息发生变化，请重新登录')
                window.location  = 'login.html'
            }

        }
    })

    if(obj.token === sessionGet('token') && obj.user ===sessionGet('user') && obj.power ===sessionGet('power') && obj.department === sessionGet('department') && obj.payId === sessionGet('payId')){
    }else{
        alert('用户信息发生变化，请重新登录');
        window.location.href = 'login.html'
    }
}

//该函数为查询按钮点击时发送ajax请求前进行的客户端验证函数，主要使用正则表达式来
//校验、补全用户的输入
function checkQueryRequest(){
    if($("#value").length>0){
        $("#value").css('backgroundColor','white');
    }else if($("#value1").length>0){
        $("#value1").css('backgroundColor','white');
        $("#value2").css('backgroundColor','white');
    }
    var checkBoxArray = $('#queryCardBanner>div>input');
    var departArray ='';
    for(var i =0,j=0;i<checkBoxArray.length;i++){
        if(checkBoxArray[i].checked){
            //例如“洛阳运用&洛襄运用&三西运用&”
            departArray+=  $("#queryCardBanner>label:eq("+i+")").text()+'&';
            j+=1;
        }
    }
    //验证用户没有空选，把字符串最后一个&去掉,发送ajax请求后台处理数据
    if(departArray!==''){
        var querySql = {};
        querySql.where = '';
        querySql.order = '';
        querySql.column = 'payId,archivesId,uName,department,birthDate,txrq,cardId,sjDate,sjDriveCode,status,startDate,deadline,yearlyCheckDate,PC';
        var arr  = $("#inputArea>div>input:checked");
        if(arr.length === 0){
            alert('请至少选择一列您要查看的信息');
        }else{
            querySql.column = '';
            for(var i =0;i<arr.length;i++){
                querySql.column += $(arr[i]).attr('id')+',';
            }
            //该column变量是sql语句的列名（*）
            querySql.column = querySql.column.substring(0,querySql.column.length-1)
        }
        //以下代码做用户输入的正则验证，为便于后期修改，将每种情况都分开
        if($("#column option:selected").val() === 'payId'){
            if($("#selectType option:selected").val() === 'greater'){
                //工资号的正则表达式,五位数字，待定
                if($("#value").val().match(/^[0-9]{5}$/)){
                    querySql.where = ' where payId >= '+$("#value").val();
                    querySql.order = ' order by payId';
                    return querySql;
                }else{
                    alert('请输入正确的工资号');
                    $("#value").focus().css('backgroundColor','#ffcccc');
                }
            }else if($("#selectType option:selected").val() === 'less'){
                if($("#value").val().match(/^[0-9]{5}$/)){
                    querySql.where = ' where payId <= '+$("#value").val();
                    querySql.order = ' order by payId';
                    return querySql;
                }else{
                    alert('请输入正确的工资号');
                    $("#value").focus().css('backgroundColor','#ffcccc');
                }
            }else if($("#selectType option:selected").val() === 'between'){
                if($("#value1").val() !== '' || $("#value2").val() !== ''){
                    if($("#value1").val().match(/^[0-9]{5}$/) && $("#value2").val().match(/^[0-9]{5}$/)){
                        var a = $("#value1").val();
                        var b = $("#value2").val();
                        if(a<b){
                            querySql.where = ' where payId between \''+a+'\' AND \''+b+'\'';
                            querySql.order = ' order by payId';
                            return querySql;
                        }else {
                            querySql.where = ' where payId between \''+b+'\' AND \''+a+'\'';
                            querySql.order = ' order by payId';
                            return querySql;
                        }
                    }else{
                        alert('请输出正确的工资号');
                        if(!$("#value1").val().match(/^[0-9]{5}$/)){
                            $("#value1").focus().css('backgroundColor','#ffcccc');
                        }else{
                            $("#value2").focus().css('backgroundColor','#ffcccc');
                        }
                        return false;
                    }
                }
            }
            else{
                //如果用户没有选择内容则以默认值检索
                return querySql;
            }
        }
        if($("#column option:selected").val() === 'archivesId'){
            if($("#selectType option:selected").val() === 'greater'){
                //工资号的正则表达式,五位数字，待定
                if($("#value").val().match(/^[0-9]{5}$/)){
                    querySql.where = ' where archivesId >= '+$("#value").val();
                    querySql.order = ' order by archivesId';
                    return querySql;
                }else{
                    alert('请输入正确的档案号');
                    $("#value").focus().css('backgroundColor','#ffcccc');
                }
            }else if($("#selectType option:selected").val() === 'less'){
                if($("#value").val().match(/^[0-9]{5}$/)){
                    querySql.where = ' where archivesId <= '+$("#value").val();
                    querySql.order = ' order by archivesId';
                    return querySql;
                }else{
                    alert('请输入正确的档案号');
                    $("#value").focus().css('backgroundColor','#ffcccc');
                }
            }else if($("#selectType option:selected").val() === 'between'){
                if($("#value1").val() !== '' || $("#value2").val() !== ''){
                    if($("#value1").val().match(/^[0-9]{5}$/) && $("#value2").val().match(/^[0-9]{5}$/)){
                        var c = $("#value1").val();
                        var d = $("#value2").val();
                        if(c<d){
                            querySql.where = ' where archivesId between \''+c+'\' AND \''+d+'\'';
                            querySql.order = ' order by archivesId';
                            return querySql;
                        }else {
                            querySql.where = ' where archivesId between \''+d+'\' AND \''+c+'\'';
                            querySql.order = ' order by archivesId';
                            return querySql;
                        }
                    }else{
                        alert('请输出正确的档案号');
                        if(!$("#value1").val().match(/^[0-9]{5}$/)){
                            $("#value1").focus().css('backgroundColor','#ffcccc');
                        }else{
                            $("#value2").focus().css('backgroundColor','#ffcccc');
                        }
                        return false;
                    }
                }
            }
            else{
                //如果用户没有选择内容则以默认值检索
                return querySql;
            }
        }
        if($("#column option:selected").val() === 'age'){
            if($("#selectType option:selected").val() === 'greater'){
                //年龄的正则表达式,1到3位数字，待定
                if($("#value").val().match(/^[0-9]{1,3}$/)){
                    querySql.where = ' where DATEDIFF(day,birthdate,getdate())/365 >= '+$("#value").val();
                    querySql.order = ' order by age';
                    querySql.column += ',DATEDIFF(day,birthdate,getdate())/365 as age';
                    return querySql;
                }else{
                    alert('请输入正确的年龄');
                    $("#value").focus().css('backgroundColor','#ffcccc');
                }
            }else if($("#selectType option:selected").val() === 'less'){
                if($("#value").val().match(/^[0-9]{1,3}$/)){
                    querySql.where = ' where DATEDIFF(day,birthdate,getdate())/365 <= '+$("#value").val();
                    querySql.order = ' order by age';
                    querySql.column += ',DATEDIFF(day,birthdate,getdate())/365 as age';
                    return querySql;
                }else{
                    alert('请输入正确的年龄');
                    $("#value").focus().css('backgroundColor','#ffcccc');
                }
            }else if($("#selectType option:selected").val() === 'between'){
                if($("#value1").val() !== '' || $("#value2").val() !== ''){
                    if($("#value1").val().match(/^[0-9]{1,3}$/) && $("#value2").val().match(/^[0-9]{1,3}$/)){
                        var e = $("#value1").val();
                        var f = $("#value2").val();
                        if(e<f){
                            querySql.where = ' where DATEDIFF(day,birthdate,getdate())/365 between \''+e+'\' AND \''+f+'\'';
                            querySql.order = ' order by age';
                            querySql.column += ',DATEDIFF(day,birthdate,getdate())/365 as age';
                            return querySql;
                        }else {
                            querySql.where = ' where DATEDIFF(day,birthdate,getdate())/365 between \''+f+'\' AND \''+e+'\'';
                            querySql.order = ' order by age';
                            querySql.column += ',DATEDIFF(day,birthdate,getdate())/365 as age';
                            return querySql;
                        }
                    }else{
                        alert('请输出正确的年龄');
                        if(!$("#value1").val().match(/^[0-9]{1,3}$/)){
                            $("#value1").focus().css('backgroundColor','#ffcccc');
                        }else{
                            $("#value2").focus().css('backgroundColor','#ffcccc');
                        }
                        return false;
                    }
                }
            }
            else{
                //如果用户没有选择内容则以默认值检索
                return querySql;
            }
        }
        if($("#column option:selected").val() === 'sjDate'){
            var sjdate ='';
            var sjtoday = new Date;
            var sjyear = '';
            var sjmonth = '';
            var sjday = '';
            if($("#selectType option:selected").val() === 'later'){
                //日期的正则表达式
                if($("#value").val().match(/^\d{8}$/) || $("#value").val().match(/^\d{4}-\d{2}-\d{2}$/)){
                    if($("#value").val().match(/^\d{8}$/)){
                        sjyear = $("#value").val().substr(0,4);
                        sjmonth = $("#value").val().substr(4,2);
                        sjday = $("#value").val().substr(6,2);
                    }else{
                        sjyear = $("#value").val().split('-')[0];
                        sjmonth = $("#value").val().split('-')[1];
                        sjday = $("#value").val().split('-')[2];
                    }
                    if((sjyear>=sjtoday.getFullYear() && sjmonth>=(sjtoday.getMonth()+1) && sjday>=sjtoday.getDate()) || sjyear<1900 || sjmonth>12 || sjmonth<1 || sjday<1 ||sjday>31){
                        alert('请输入正确的时间');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else if(sjyear%4 !== 0 && sjmonth==='02' && sjday>28){
                        alert('请输入正确的时间，该年不是闰年');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else if((sjmonth === '04' || sjmonth === '06' || sjmonth === '09' || sjmonth === '11') && sjday>30){
                        alert('请输入正确的时间，该月最多30天');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else{
                        sjdate = sjyear+'-'+sjmonth+'-'+sjday;
                        querySql.where = ' where sjDate >= \''+sjdate+'\'';
                        querySql.order = ' order by sjDate';
                        return querySql;
                    }
                }else{
                    alert('请输入正确的时间:\"xxxxxxxx\"或\"xxxx-xx-xx\"');
                    $("#value").focus().css('backgroundColor','#ffcccc');
                    return false;
                }
            }
            else if($("#selectType option:selected").val() === 'earlier'){
                //日期的正则表达式
                if($("#value").val().match(/^\d{8}$/) || $("#value").val().match(/^\d{4}-\d{2}-\d{2}$/)){
                    if($("#value").val().match(/^\d{8}$/)){
                        sjyear = $("#value").val().substr(0,4);
                        sjmonth = $("#value").val().substr(4,2);
                        sjday = $("#value").val().substr(6,2);
                    }else{
                        sjyear = $("#value").val().split('-')[0];
                        sjmonth = $("#value").val().split('-')[1];
                        sjday = $("#value").val().split('-')[2];
                    }
                    if(sjyear<1900 || sjmonth>12 || sjmonth<1 || day<1 ||day>31){
                        alert('请输入正确的时间');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else if(sjyear%4 !== 0 && sjmonth==='02' && sjday>28){
                        alert('请输入正确的时间，该年不是闰年');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else if((sjmonth === '04' || sjmonth === '06' || sjmonth === '09' || sjmonth === '11') && sjday>30){
                        alert('请输入正确的时间，该月最多30天');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else{
                        sjdate = sjyear+'-'+sjmonth+'-'+sjday;
                        querySql.where = ' where sjDate <= \''+sjdate+'\'';
                        querySql.order = ' order by sjDate';
                        return querySql;
                    }
                }else{
                    alert('请输入正确的时间:\"xxxxxxxx\"或\"xxxx-xx-xx\"');
                    $("#value").focus().css('backgroundColor','#ffcccc');
                    return false;
                }
            }
            else if($("#selectType option:selected").val() === 'between'){
                //日期的正则表达式
                if($("#value1").val().match(/^\d{8}$/) || $("#value1").val().match(/^\d{4}-\d{2}-\d{2}$/)) {
                    if ($("#value1").val().match(/^\d{8}$/)) {
                        var sjyear1 = $("#value1").val().substr(0, 4);
                        var sjmonth1 = $("#value1").val().substr(4, 2);
                        var sjday1 = $("#value1").val().substr(6, 2);
                        var sjdate1 ='';
                    } else {
                        sjyear1 = $("#value1").val().split('-')[0];
                        sjmonth1 = $("#value1").val().split('-')[1];
                        sjday1 = $("#value1").val().split('-')[2];
                    }
                }else{
                    alert('请输入正确的时间:\"xxxxxxxx\"或\"xxxx-xx-xx\"');
                    $("#value1").focus().css('backgroundColor','#ffcccc');
                    return false;
                }
                if($("#value2").val().match(/^\d{8}$/) || $("#value2").val().match(/^\d{4}-\d{2}-\d{2}$/)) {
                    if ($("#value2").val().match(/^\d{8}$/)) {
                        var sjyear2 = $("#value2").val().substr(0, 4);
                        var sjmonth2 = $("#value2").val().substr(4, 2);
                        var sjday2 = $("#value2").val().substr(6, 2);
                        var sjdate2 ='';
                    } else {
                        sjyear2 = $("#value2").val().split('-')[0];
                        sjmonth2 = $("#value2").val().split('-')[1];
                        sjday2 = $("#value2").val().split('-')[2];
                    }
                    if((sjyear1>=sjtoday.getFullYear() && sjmonth1>=(sjtoday.getMonth()+1) && sjday1>=sjtoday.getDate()) || sjyear1<1900 || sjmonth1>12 || sjmonth1<1 || sjday1<1 ||sjday1>31){
                        alert('请输入正确的时间');
                        $("#value1").focus().css('backgroundColor','#ffcccc');
                    }else if(sjyear1%4 !== 0 && sjmonth1==='02' && sjday1>28){
                        alert('请输入正确的时间，该年不是闰年');
                        $("#value1").focus().css('backgroundColor','#ffcccc');
                    }else if((sjmonth1 === '04' || sjmonth1 === '06' || sjmonth1 === '09' || sjmonth1 === '11') && sjday1>30){
                        alert('请输入正确的时间，该月最多30天');
                        $("#value1").focus().css('backgroundColor','#ffcccc');
                    }else if((sjyear2>=sjtoday.getFullYear() && sjmonth2>=(sjtoday.getMonth()+1) && sjday2>=sjtoday.getDate()) || sjyear2<1900 || sjmonth2>12 || sjmonth2<1 || sjday2<1 ||sjday2>31){
                        alert('请输入正确的时间');
                        $("#value2").focus().css('backgroundColor','#ffcccc');
                    }else if(sjyear2%4 !== 0 && sjmonth2==='02' && sjday2>28){
                        alert('请输入正确的时间，该年不是闰年');
                        $("#value2").focus().css('backgroundColor','#ffcccc');
                    }else if((sjmonth2 === '04' || sjmonth2 === '06' || sjmonth2 === '09' || sjmonth2 === '11') && sjday2>30){
                        alert('请输入正确的时间，该月最多30天');
                        $("#value2").focus().css('backgroundColor','#ffcccc');
                    }else{
                        sjdate1 = sjyear1+'-'+sjmonth1+'-'+sjday1;
                        sjdate2 = sjyear2+'-'+sjmonth2+'-'+sjday2;
                        if(sjyear1>sjyear2 || (sjyear1===sjyear2 && sjmonth1>sjmonth2) || (sjyear1===sjyear2 && sjmonth1===sjmonth2 && sjday1>sjday2)){
                            querySql.where = ' where sjDate between \''+sjdate2+'\' AND \''+sjdate1+'\'';
                        }else{
                            querySql.where = ' where sjDate between \''+sjdate1+'\' AND \''+sjdate2+'\'';
                        }
                        querySql.order = ' order by sjDate';
                        return querySql;
                    }
                }else{
                    alert('请输入正确的时间:\"xxxxxxxx\"或\"xxxx-xx-xx\"');
                    $("#value2").focus().css('backgroundColor','#ffcccc');
                    return false;
                }
            }
            else{
                //如果用户没有选择内容则以默认值检索
                return querySql;
            }
        }
        if($("#column option:selected").val() === 'sjRemark'){
            querySql.order = ' order by sjRemark';
            querySql.where = ' where sjRemark =\''+$("#value option:selected").val()+'\'';
            return querySql;
        }
        if($("#column option:selected").val() === 'sjDriveCode'){
            querySql.where = ' where ';
            for(var n=0;n<$("#valueDiv input:checked").length;n++){
                querySql.where += ' sjDriveCode = \''+$("#valueDiv input:checked:eq("+n+")").attr('id')+'\' or';
            }
            querySql.order = ' order by sjDriveCode';
            querySql.where = querySql.where.slice(0,querySql.where.length-2);
            return querySql;
        }
        if($("#column option:selected").val() === 'sjDriveType'){
            querySql.where = ' where ';
            for(var m=0;m<$("#valueDiv input:checked").length;m++){
                querySql.where += ' sjDriveCode = \''+$("#valueDiv input:checked:eq("+m+")").attr('id')+'\' or';
            }
            querySql.order = ' order by sjDriveType';
            querySql.where = querySql.where.slice(0,querySql.where.length-2);
            return querySql;
        }
        if($("#column option:selected").val() === 'deadline'){
            var yearD = '';
            var monthD = '';
            var dayD = '';
            var dateD='';
            if($("#selectType option:selected").val() === 'later'){
                //日期的正则表达式
                if($("#value").val().match(/^\d{8}$/) || $("#value").val().match(/^\d{4}-\d{2}-\d{2}$/)){
                    if($("#value").val().match(/^\d{8}$/)){
                        yearD = $("#value").val().substr(0,4);
                        monthD = $("#value").val().substr(4,2);
                        dayD = $("#value").val().substr(6,2);
                    }else{
                        yearD = $("#value").val().split('-')[0];
                        monthD = $("#value").val().split('-')[1];
                        dayD = $("#value").val().split('-')[2];
                    }
                    if(yearD<1900 || monthD>12 || monthD<1 || dayD<1 ||dayD>31){
                        alert('请输入正确的时间');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else if(yearD%4 !== 0 && monthD==='02' && dayD>28){
                        alert('请输入正确的时间，该年不是闰年');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else if((monthD === '04' || monthD === '06' || monthD === '09' || monthD === '11') && dayD>30){
                        alert('请输入正确的时间，该月最多30天');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else{
                        dateD = yearD+'-'+monthD+'-'+dayD;
                        querySql.where = ' where deadline >= \''+dateD+'\'';
                        querySql.order = ' order by deadline';
                        return querySql;
                    }
                }else{
                    alert('请输入正确的时间:\"xxxxxxxx\"或\"xxxx-xx-xx\"');
                    $("#value").focus().css('backgroundColor','#ffcccc');
                    return false;
                }
            }
            else if($("#selectType option:selected").val() === 'earlier'){
                //日期的正则表达式
                if($("#value").val().match(/^\d{8}$/) || $("#value").val().match(/^\d{4}-\d{2}-\d{2}$/)){
                    if($("#value").val().match(/^\d{8}$/)){
                        yearD = $("#value").val().substr(0,4);
                        monthD = $("#value").val().substr(4,2);
                        dayD = $("#value").val().substr(6,2);
                    }else{
                        yearD = $("#value").val().split('-')[0];
                        monthD = $("#value").val().split('-')[1];
                        dayD = $("#value").val().split('-')[2];
                    }
                    if(yearD<1900 || monthD>12 || monthD<1 || dayD<1 ||dayD>31){
                        alert('请输入正确的时间');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else if(yearD%4 !== 0 && monthD==='02' && dayD>28){
                        alert('请输入正确的时间，该年不是闰年');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else if((monthD === '04' || monthD === '06' || monthD === '09' || monthD === '11') && dayD>30){
                        alert('请输入正确的时间，该月最多30天');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else{
                        dateD = yearD+'-'+monthD+'-'+dayD;
                        querySql.where = ' where deadline <= \''+dateD+'\'';
                        querySql.order = ' order by deadline';
                        return querySql;
                    }
                }else{
                    alert('请输入正确的时间:\"xxxxxxxx\"或\"xxxx-xx-xx\"');
                    $("#value").focus().css('backgroundColord','#ffcccc');
                    return false;
                }
            }
            else if($("#selectType option:selected").val() === 'between'){
                //日期的正则表达式
                if($("#value1").val().match(/^\d{8}$/) || $("#value1").val().match(/^\d{4}-\d{2}-\d{2}$/)) {
                    if ($("#value1").val().match(/^\d{8}$/)) {
                        var yearD1 = $("#value1").val().substr(0, 4);
                        var monthD1 = $("#value1").val().substr(4, 2);
                        var dayD1 = $("#value1").val().substr(6, 2);
                        var dateD1 ='';
                    } else {
                        yearD1 = $("#value1").val().split('-')[0];
                        monthD1 = $("#value1").val().split('-')[1];
                        dayD1 = $("#value1").val().split('-')[2];
                    }
                }else{
                    alert('请输入正确的时间:\"xxxxxxxx\"或\"xxxx-xx-xx\"');
                    $("#value1").focus().css('backgroundColor','#ffcccc');
                    return false;
                }
                if($("#value2").val().match(/^\d{8}$/) || $("#value2").val().match(/^\d{4}-\d{2}-\d{2}$/)) {
                    if ($("#value2").val().match(/^\d{8}$/)) {
                        var yearD2 = $("#value2").val().substr(0, 4);
                        var monthD2 = $("#value2").val().substr(4, 2);
                        var dayD2 = $("#value2").val().substr(6, 2);
                        var dateD2 ='';
                    } else {
                        yearD2 = $("#value2").val().split('-')[0];
                        monthD2 = $("#value2").val().split('-')[1];
                        dayD2 = $("#value2").val().split('-')[2];
                    }
                    if(yearD1<1900 || monthD1>12 || monthD1<1 || dayD1<1 ||dayD1>31){
                        alert('请输入正确的时间');
                        $("#value1").focus().css('backgroundColor','#ffcccc');
                    }else if(yearD1%4 !== 0 && monthD1==='02' && dayD1>28){
                        alert('请输入正确的时间，该年不是闰年');
                        $("#value1").focus().css('backgroundColor','#ffcccc');
                    }else if((monthD1 === '04' || monthD1 === '06' || monthD1 === '09' || monthD1 === '11') && dayD1>30){
                        alert('请输入正确的时间，该月最多30天');
                        $("#value1").focus().css('backgroundColor','#ffcccc');
                    }else if(yearD2<1900 || monthD2>12 || monthD2<1 || dayD2<1 ||dayD2>31){
                        alert('请输入正确的时间');
                        $("#value2").focus().css('backgroundColor','#ffcccc');
                    }else if(yearD2%4 !== 0 && monthD2==='02' && dayD2>28){
                        alert('请输入正确的时间，该年不是闰年');
                        $("#value2").focus().css('backgroundColor','#ffcccc');
                    }else if((monthD2 === '04' || monthD2 === '06' || monthD2 === '09' || monthD2 === '11') && dayD2>30){
                        alert('请输入正确的时间，该月最多30天');
                        $("#value2").focus().css('backgroundColor','#ffcccc');
                    }else{
                        dateD1 = yearD1+'-'+monthD1+'-'+dayD1;
                        dateD2 = yearD2+'-'+monthD2+'-'+dayD2;
                        if(yearD1>yearD2 || (yearD1===yearD2 && monthD1>monthD2) || (yearD1===yearD2 && monthD1===monthD2 && dayD1>dayD2)){
                            querySql.where = ' where deadline between \''+dateD2+'\' AND \''+dateD1+'\'';
                        }else{
                            querySql.where = ' where deadline between \''+dateD1+'\' AND \''+dateD2+'\'';
                        }
                        querySql.order = ' order by deadline';
                        return querySql;
                    }
                }else{
                    alert('请输入正确的时间:\"xxxxxxxx\"或\"xxxx-xx-xx\"');
                    $("#value2").focus().css('backgroundColor','#ffcccc');
                    return false;
                }
            }
            else{
                //如果用户没有选择内容则以默认值检索
                return querySql;
            }
        }
        if($("#column option:selected").val() === 'startDate'){
            var yearS = '';
            var monthS = '';
            var dayS = '';
            var dateS='';
            if($("#selectType option:selected").val() === 'later'){
                //日期的正则表达式
                if($("#value").val().match(/^\d{8}$/) || $("#value").val().match(/^\d{4}-\d{2}-\d{2}$/)){
                    if($("#value").val().match(/^\d{8}$/)){
                        yearS = $("#value").val().substr(0,4);
                        monthS = $("#value").val().substr(4,2);
                        dayS = $("#value").val().substr(6,2);
                    }else{
                        yearS = $("#value").val().split('-')[0];
                        monthS = $("#value").val().split('-')[1];
                        dayS = $("#value").val().split('-')[2];
                    }
                    if(yearS<1900 || monthS>12 || monthS<1 || dayS<1 ||dayS>31){
                        alert('请输入正确的时间');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else if(yearS%4 !== 0 && monthS==='02' && dayS>28){
                        alert('请输入正确的时间，该年不是闰年');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else if((monthS === '04' || monthS === '06' || monthS === '09' || monthS === '11') && dayS>30){
                        alert('请输入正确的时间，该月最多30天');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else{
                        dateS = yearS+'-'+monthS+'-'+dayS;
                        querySql.where = ' where startDate >= \''+dateS+'\'';
                        querySql.order = ' order by startDate';
                        return querySql;
                    }
                }else{
                    alert('请输入正确的时间:\"xxxxxxxx\"或\"xxxx-xx-xx\"');
                    $("#value").focus().css('backgroundColor','#ffcccc');
                    return false;
                }
            }
            else if($("#selectType option:selected").val() === 'earlier'){
                //日期的正则表达式
                if($("#value").val().match(/^\d{8}$/) || $("#value").val().match(/^\d{4}-\d{2}-\d{2}$/)){
                    if($("#value").val().match(/^\d{8}$/)){
                        yearS = $("#value").val().substr(0,4);
                        monthS = $("#value").val().substr(4,2);
                        dayS = $("#value").val().substr(6,2);
                    }else{
                        yearS = $("#value").val().split('-')[0];
                        monthS = $("#value").val().split('-')[1];
                        dayS = $("#value").val().split('-')[2];
                    }
                    if(yearS<1900 || monthS>12 || monthS<1 || dayS<1 ||dayS>31){
                        alert('请输入正确的时间');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else if(yearS%4 !== 0 && monthS==='02' && dayS>28){
                        alert('请输入正确的时间，该年不是闰年');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else if((monthS === '04' || monthS === '06' || monthS === '09' || monthS === '11') && dayS>30){
                        alert('请输入正确的时间，该月最多30天');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else{
                        dateS = yearS+'-'+monthS+'-'+dayS;
                        querySql.where = ' where startDate <= \''+dateS+'\'';
                        querySql.order = ' order by startDate';
                        return querySql;
                    }
                }else{
                    alert('请输入正确的时间:\"xxxxxxxx\"或\"xxxx-xx-xx\"');
                    $("#value").focus().css('backgroundColord','#ffcccc');
                    return false;
                }
            }
            else if($("#selectType option:selected").val() === 'between'){
                //日期的正则表达式
                if($("#value1").val().match(/^\d{8}$/) || $("#value1").val().match(/^\d{4}-\d{2}-\d{2}$/)) {
                    if ($("#value1").val().match(/^\d{8}$/)) {
                        var yearS1 = $("#value1").val().substr(0, 4);
                        var monthS1 = $("#value1").val().substr(4, 2);
                        var dayS1 = $("#value1").val().substr(6, 2);
                        var dateS1 ='';
                    } else {
                        yearS1 = $("#value1").val().split('-')[0];
                        monthS1 = $("#value1").val().split('-')[1];
                        dayS1 = $("#value1").val().split('-')[2];
                    }
                }else{
                    alert('请输入正确的时间:\"xxxxxxxx\"或\"xxxx-xx-xx\"');
                    $("#value1").focus().css('backgroundColor','#ffcccc');
                    return false;
                }
                if($("#value2").val().match(/^\d{8}$/) || $("#value2").val().match(/^\d{4}-\d{2}-\d{2}$/)) {
                    if ($("#value2").val().match(/^\d{8}$/)) {
                        var yearS2 = $("#value2").val().substr(0, 4);
                        var monthS2 = $("#value2").val().substr(4, 2);
                        var dayS2 = $("#value2").val().substr(6, 2);
                        var dateS2 ='';
                    } else {
                        yearS2 = $("#value2").val().split('-')[0];
                        monthS2 = $("#value2").val().split('-')[1];
                        dayS2 = $("#value2").val().split('-')[2];
                    }
                    if(yearS1<1900 || monthS1>12 || monthS1<1 || dayS1<1 ||dayS1>31){
                        alert('请输入正确的时间');
                        $("#value1").focus().css('backgroundColor','#ffcccc');
                    }else if(yearS1%4 !== 0 && monthS1==='02' && dayS1>28){
                        alert('请输入正确的时间，该年不是闰年');
                        $("#value1").focus().css('backgroundColor','#ffcccc');
                    }else if((monthS1 === '04' || monthS1 === '06' || monthS1 === '09' || monthS1 === '11') && dayS1>30){
                        alert('请输入正确的时间，该月最多30天');
                        $("#value1").focus().css('backgroundColor','#ffcccc');
                    }else if(yearS2<1900 || monthS2>12 || monthS2<1 || dayS2<1 ||dayS2>31){
                        alert('请输入正确的时间');
                        $("#value2").focus().css('backgroundColor','#ffcccc');
                    }else if(yearS2%4 !== 0 && monthS2==='02' && dayS2>28){
                        alert('请输入正确的时间，该年不是闰年');
                        $("#value2").focus().css('backgroundColor','#ffcccc');
                    }else if((monthS2 === '04' || monthS2 === '06' || monthS2 === '09' || monthS2 === '11') && dayS2>30){
                        alert('请输入正确的时间，该月最多30天');
                        $("#value2").focus().css('backgroundColor','#ffcccc');
                    }else{
                        dateS1 = yearS1+'-'+monthS1+'-'+dayS1;
                        dateS2 = yearS2+'-'+monthS2+'-'+dayS2;
                        if(yearS1>yearS2 || (yearS1===yearS2 && monthS1>monthS2) || (yearS1===yearS2 && monthS1===monthS2 && dayS1>dayS2)){
                            querySql.where = ' where startDate between \''+dateS2+'\' AND \''+dateS1+'\'';
                        }else{
                            querySql.where = ' where startDate between \''+dateS1+'\' AND \''+dateS2+'\'';
                        }
                        querySql.order = ' order by startDate';
                        return querySql;
                    }
                }else{
                    alert('请输入正确的时间:\"xxxxxxxx\"或\"xxxx-xx-xx\"');
                    $("#value2").focus().css('backgroundColor','#ffcccc');
                    return false;
                }
            }
            else{
                //如果用户没有选择内容则以默认值检索
                return querySql;
            }
        }
        if($("#column option:selected").val() === 'status'){
            querySql.order = ' order by status';
            querySql.where = ' where status =\''+$("#value option:selected").val()+'\'';
            return querySql;
        }
        if($("#column option:selected").val() === 'remainingDays'){
            if($("#selectType option:selected").val() === 'greater'){
                //天数的正则表达式,1到4位数字，待定
                if($("#value").val().match(/^[0-9]{1,4}$/)){
                    querySql.where = ' where DATEDIFF(day,getdate(),deadline) >= '+$("#value").val();
                    querySql.order = ' order by remainingDays';
                    var sen = 'DATEDIFF(day,getdate(),deadline) as remainingDays,'
                    querySql.column  = sen +querySql.column;
                    return querySql;
                }else{
                    alert('请输入正确的年龄');
                    $("#value").focus().css('backgroundColor','#ffcccc');
                }
            }else if($("#selectType option:selected").val() === 'less'){
                if($("#value").val().match(/^[0-9]{1,4}$/)){
                    querySql.where = ' where DATEDIFF(day,getdate(),deadline) <= '+$("#value").val();
                    querySql.order = ' order by remainingDays';
                    var sen = 'DATEDIFF(day,getdate(),deadline) as remainingDays,'
                    querySql.column = sen +querySql.column;
                    return querySql;
                }else{
                    alert('请输入正确的年龄');
                    $("#value").focus().css('backgroundColor','#ffcccc');
                }
            }else if($("#selectType option:selected").val() === 'between'){
                if($("#value1").val() !== '' || $("#value2").val() !== ''){
                    if($("#value1").val().match(/^[0-9]{1,4}$/) && $("#value2").val().match(/^[0-9]{1,4}$/)){
                        var e = parseInt($("#value1").val());
                        var f = parseInt($("#value2").val());
                        if(e<f){
                            querySql.where = ' where DATEDIFF(day,getdate(),deadline) between \''+e+'\' AND \''+f+'\'';
                            querySql.order = ' order by remainingDays';
                            var sen = 'DATEDIFF(day,getdate(),deadline) as remainingDays,'
                            querySql.column = sen +querySql.column;
                            return querySql;
                        }else {
                            querySql.where = ' where DATEDIFF(day,getdate(),deadline) between \''+f+'\' AND \''+e+'\'';
                            querySql.order = ' order by remainingDays';
                            var sen = 'DATEDIFF(day,getdate(),deadline) as remainingDays,'
                            querySql.column = sen +querySql.column;
                            return querySql;
                        }
                    }else{
                        alert('请输出正确的天数：1至4位数字');
                        if(!$("#value1").val().match(/^[0-9]{1,4}$/)){
                            $("#value1").focus().css('backgroundColor','#ffcccc');
                        }else{
                            $("#value2").focus().css('backgroundColor','#ffcccc');
                        }
                        return false;
                    }
                }
            }
            else{
                //如果用户没有选择内容则以默认值检索
                return querySql;
            }
        }
    }else{
        alert('请至少选择一个车间');
    }

}
//渲染页面中需要动态添加的元素(高级搜索中的checkbox等)
function appendElement(){
    var html ='';
    var columnArr = 'payId,archivesId,uName,department,birthDate,txrq,cardId,sjDate,sjDriveCode,status,startDate,deadline,yearlyCheckDate,PC'.split(',');
    $.ajax({
        url: "../../../ways.php",
        type:"POST",
        timeout:8000,
        //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
        data:{funcName:'appendElement',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
            tableName:'jbxx',column:'top 1 payId,archivesId,uName,department,txrq,birthDate,' +
            'sjDate,sjRemark,sjDriveCode,sjDriveType,status,deadline,startDate,yearlyCheckDate,PC'},
        dataType:'json',
        success:function(data){
            for(var i in data['row']){
                //字典，中英文对照
                var j ='';
                switch(i){
                    case 'payId':
                        j = '工资号';
                        break;
                    case 'archivesId':
                        j = '档案号';
                        break;
                    case 'uName':
                        j = '姓名';
                        break;
                    case 'department':
                        j = '部门';
                        break;
                    case 'birthDate':
                        j = '出生日期';
                        break;
                    case 'txrq':
                        j = '退休日期';
                        break;
                    case 'deadline':
                        j = '有效截止日期';
                        break;
                    case 'sjDate':
                        j = '司机初次领证日期';
                        break;
                    case 'sjRemark':
                        j = '批准文号';
                        break;
                    case 'sjDriveCode':
                        j = '准驾类型代码';
                        break;
                    case 'sjDriveType':
                        j = '准驾类型';
                        break;
                    case 'status':
                        j = '驾驶证状态';
                        break;
                    case 'startDate':
                        j = '有效起始日期';
                        break;
                    case 'yearlyCheckDate':
                        j = '年鉴日期';
                        break;
                    case 'PC':
                        j = '批次';
                        break;

                }
                html += '<div><input type=\"checkbox\" id=\"'+ i +'\"><label for=\"'+i+'\">'+j+'</label></div>';
            }
            $("#inputArea").append(html);
            for(var i=0;i<$("#inputArea input").length;i++){
                if(checkIfInArray($("#inputArea input:eq("+i+")").attr('id'),columnArr)){
                    $("#inputArea input:eq("+i+")").prop('checked',true);
                }
            }
            //给单选框和复选框分别绑定事件，全选、全不选
            $("#inputArea>div>input").off('change').on('change',function(){
                $("#all").prop('checked',false);
                $("#allNo").prop('checked',false);
                //该全局变量表示被选中的复选框个数
                numOfSelect =0;
                var arr  = $("#inputArea>div>input");
                for(var i =0;i<$('#inputArea input').length;i++){
                    if($(arr[i]).prop('checked')){
                        numOfSelect++;
                    }
                }
                if(numOfSelect ===0){
                    $("#allNo").prop('checked',true);
                }else if(numOfSelect ===$('#inputArea input').length){
                    $("#all").prop('checked',true);
                }
            });
            //绑定单选框事件
            $("#all").off('change').on("change",function () {
                if($(this).prop('checked')){
                    numOfSelect=$('#inputArea input').length;
                    $("#inputArea>div>input").prop("checked",true);
                }
            });
            $("#allNo").off('change').on("change",function () {
                if($(this).prop('checked')){
                    numOfSelect=0;
                    $("#inputArea>div>input").prop("checked",false);
                }
            });
        }
    });
}
function appendSelection(){
    var _html = '';
    var __html = '';
    var column = $("#column").val();
    if(column === 'payId' || column==='archivesId' || column === 'age' || column === 'remainingDays'){
        _html = '<select name=\"selectType\" id=\"selectType\"><option value="please">--请选择--</option><option value=\"greater\">大于</option><option value=\"less\">小于</option><option value=\"between\">介于</option></select>';
    }else if(column ==='sjDate'){
        _html = '<select name="selectType" id="selectType"><option value="please">--请选择--</option><option value=\"later\">晚于</option><option value=\"earlier\">早于</option><option value=\"between\">介于</option></select>';
    }else if(column === 'sjRemark'){
        _html = '等于';
        $.ajax({
            url: "../../../ways.php",
            type:"POST",
            timeout:8000,
            data:{funcName:'select',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                tableName:'jbxx',column:'DISTINCT '+column,where:' '},
            dataType:'json',
            success:function(data){
                delete data['success'];
                delete data['count'];
                __html = '<select style="margin-top: 20px" name=\"value\" id=\"value\">';
                for(var i in data){
                    if(data[i][column]!==''){
                        __html += '<option value=\"'+data[i][column]+'\">'+data[i][column]+'</option>';
                    }
                }
                __html += '</select>';
                $("#valueDiv").empty().append(__html)
            }
        })

    }else if(column ==='sjDriveCode'){
        _html = '属于';
        $.ajax({
            url: "../../../ways.php",
            type:"POST",
            timeout:8000,
            data:{funcName:'select',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                tableName:'csxx',column:'name',where:' where lb = \'zjlx\' ',order:' '},
            dataType:'json',
            success:function(data){
                delete data['success'];
                delete data['count'];
                __html = '';
                for(var i in data){
                    if(data[i]['name']!==''){
                        __html += '<label class="checkbox inline" for=\"'+data[i]['name']+'\"><input class=\"marginLeft10px\" type=\"checkbox\" id=\"'+data[i]['name']+'\"/>'+data[i]['name']+'</label>';
                    }
                }
                $("#valueDiv").empty().append(__html)
            }
        })
    }else if(column==='sjDriveType'){
        _html = '属于';
        $.ajax({
            url: "../../../ways.php",
            type:"POST",
            timeout:8000,
            data:{funcName:'select',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                tableName:'csxx',column:'name,nr1',where:' where lb = \'zjlx\' ',order:' '},
            dataType:'json',
            success:function(data){
                delete data['success'];
                delete data['count'];
                __html = '';
                for(var i in data){
                    if(data[i]['nr1']!==''){
                        __html += '<label class=\"checkbox inline" for=\"'+data[i]['name']+'\"><input class="marginLeft6px" type=\"checkbox\" id=\"'+data[i]['name']+'\"/>'+data[i]['nr1']+'</label>';
                    }
                }
                $("#valueDiv").empty().append(__html)

            }
        })
    }else if(column === 'deadline' || column === 'startDate'){
        _html = '<select name=\"selectType\" id=\"selectType\"><option value="please">--请选择--</option><option value=\"later\">晚于</option><option value=\"earlier\">早于</option><option value=\"between\">介于</option></select>';
    }else{
        _html = '为';
        $.ajax({
            url: "../../../ways.php",
            type:"POST",
            timeout:8000,
            data:{funcName:'select',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                tableName:'csxx',column:'nr2',where:' where lb = \'zjzt\' ',order:' '},
            dataType:'json',
            success:function(data){
                delete data['success'];
                delete data['count'];
                __html = '<select style="margin-top: 20px" name=\"value\" id=\"value\">';
                for(var i in data){
                    if(data[i]['nr2']!==''){
                        __html += '<option value=\"'+data[i]['nr2']+'\">'+data[i]['nr2']+'</option>';
                    }
                }
                __html += '</select>';
                $("#valueDiv").empty().append(__html)
            }
        })
    }
    $("#selectTypeDiv").empty().append(_html);
    $("#valueDiv").empty().append(__html);
    $('#selectType').off('change').on('change',appendValue);
}
function appendValue(){
    var selectType = $("#selectType").val()? $("#selectType").val() : $("#selectType").text();
    var column = $("#column").val();
    var _html ='';
    if((selectType === 'less' || selectType ==='greater') && (column === 'payId' || column === 'archivesId' || column === 'age' || column ==='remainingDays')){
        _html = '<input type=\"text\" id=\"value\"/>';
    }else if((selectType === 'earlier' || selectType ==='later') && column === 'sjDate'){
        //input type=date 标签只有chrome支持，IE和FF都不支持
        //_html = '<input type=\"date\" id=\"value\"/>';
        _html = '<input type=\"text\" id=\"value\"/>';
    }else if((selectType === 'between') && (column === 'payId' || column === 'archivesId' || column === 'age' || column === 'remainingDays')){
        _html = '<input type="text" id="value1"/><span>至</span><input type="text" id="value2"/><span>之间</span>'
    }else if((selectType === 'between') && column === 'sjDate'){
        _html = '<input type="text" id="value1"/><span>至</span><input type="text" id="value2"/><span>之间</span>'
    }else if((selectType === 'earlier' || selectType ==='later') && (column === 'deadline' || column === 'startDate')){
        var flag = '';
        if(selectType === 'earlier'){
            flag = '<=';
        }else{
            flag = '>=';
        }
        _html = '<input class="marginTop20px" type=\"text\" id=\"value\"/>';
    }else if((selectType === 'between') && (column === 'deadline' || column ==='startDate')){
        _html = '<input class="marginTop20px" type="text" id="value1"/><span>至</span><input type="text" id="value2"/><span>之间</span>'
    }
    $("#valueDiv").empty().append(_html)
}
//绑定“更多”按钮事件
$("#more").off('click').on('click', function () {
    if ($("#querySelectBanner").attr('class') === 'less') {
        $("#querySelectBanner").dequeue().animate({'height': '0'}, 700, function () {
            $("#querySelectBanner").attr('class', 'more');
            $("#more").text('更多...');
        });
    } else {
        $("#querySelectBanner").dequeue().animate({'height': '270px'}, 700, function () {
            $("#querySelectBanner").attr('class', 'less');
            $("#more").text('收起');
        });
    }

});

//添加车间选项
function addQueryDepartment(obj){
    var reg = 'where';
    if(obj){
        if(reg.search(obj.where)){
            obj.where +=' AND (';
        }else{
            obj.where +=' where (';
        }
        for(var i =0;i<$("#queryCardBanner input:checked").length;i++){
            obj.where += 'department like \''+ $("#queryCardBanner input:checked:eq("+i+")").next('label').text()+'%\' or '
        }
        obj.where = obj.where.substr(0,obj.where.length-3)+')';
        return obj;
    }else{
        return false;
    }

}