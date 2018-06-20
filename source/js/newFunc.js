//初始化视窗
function initialScreen(){
    $("body").css('width',screen.width);
    if(screen.width < 1024){
        alert('为了更好地显示页面,请至少将分辨率设置为1024*768');
    }
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

//主页面单击左边li显示右边内容的函数，注销功能也在这里实现
function displayContainer(){
    var power = sessionGet('power');
    if(power === 'V' || power==='1'){
        //教育科管理人员或车间管理人员
        var index = $(this).index();
        if($(this).next().length>0){
            $("#rightContent .operateContent>div:eq("+index+")").css('display','block').siblings().css('display','none');
        }else{
            //最后一个按钮退出系统
            if(confirm("确定要退出系统？")){
                sessionClear();
                window.location.href = '../html/login.html'
            }
        }
    }else if(power === '0'){
        //把页面中前7个教育科人员使用的div跳过
        var index_7 = $(this).index()+7;
        if($(this).next().length>0){
            $("#rightContent .operateContent>div:eq("+index_7+")").css('display','block').siblings().css('display','none');
        }else{
            //最后一个按钮退出系统
            if(confirm("确定要退出系统？")){
                sessionClear();
                window.location.href = '../html/login.html'
            }
        }
    }

}

//检查登录状态和用户名
function loginStatus(){
    if(sessionGet('user')){
        $("#bigContent #leftContent .name").text(sessionGet('user'))
        //$("#bigContent #leftContent .name").text(sessionGet('user'))
    }else{
        alert('请先登录！');
        window.location.href = 'login.html';
    }
}


//显示证件查询结果(index.html)
function displayQueryForm(){
    var obj = checkQueryRequest();
    obj = addQueryDepartment(obj);
    if(obj === undefined){
        return false
    }
    var ajaxTimeOut = $.ajax({
        url: "../../../index.php",
        type:"POST",
        timeout:8000,
        //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
        data:{funcName:'select',where:obj.where,serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
            tableName:'jbxx',column:obj.column,order:obj.order},
        dataType:'json',
        success:function(data){
            if(data.success === 1){
                console.log(data);
                //把使用过的多余属性删除，便于处理数据
                delete data['success'];
                displayQueryTable(data,document.getElementById('queryCardContent'),document.getElementById('cardPageContent'),'pageMode',obj,'queryCardContentTable');
                //生成EXCEL按钮出现
                $(".htmlToXls").css("visibility",'visible');
            }else{
                alert('您查询的信息不存在');
            }
        },
        beforeSend:function(){
            //在where字段后加入用户选择的车间范围
            testSession(userSessionInfo);
            loadingPicOpen();
        },
        complete: function (XMLHttpRequest,status) {
            loadingPicClose();
            if($("#querySelectBanner").attr('class') === 'less'){
                $("#querySelectBanner").dequeue().animate({'height':'0'},700,function(){
                    $("#querySelectBanner").attr('class','more');
                    $("#more").text('更多...');
                });
            }
            if(status === 'timeout') {
                ajaxTimeOut.abort();    // 超时后中断请求
                alert('网络超时，请检查网络连接');
            }
        }
    })
}


//displayQueryTable函数，用来显示查询结果的表格(table)并添加内容   最好做成可以通用的函数，根据传入数据的不同来改变
//第一个参数data是传入的数据(obj),第二个参数是要添加表格的位置即父元素,第三个参数分页模式,目前还未增加第二种模式
//obj是sql语句对象,tableName是要给新建的表格添加的ID，true是是否添加表头排序功能
function displayQueryTable(data,element,pageElement,mode,obj,tableName){
    if(mode === 'pageMode'){
        //分页,每页30条
        pageDividing(data,data['count'],30,element,pageElement,obj,tableName,true);
    }
}



//分页函数，data是数据集，参数total是数据总条目数，countPerPage是每页几条,
// dataPosition代表数据插入的位置（父元素）习惯是个div标签，
// pagePosition代表分页器插入的位置(父元素)习惯是个div标签
//obj是sql语句对象
function pageDividing(data,total,countPerPage,dataPosition,pagePosition,obj,tableName,headEvent){
    //把多余的属性删除，便于处理
    delete data['count'];
    showTableHead(data,pagePosition,dataPosition,headEvent,tableName,obj,total,countPerPage);
    showList(data,1,countPerPage,dataPosition);
    showPagingList(data,total,countPerPage,pagePosition,1,dataPosition);

}

//生成excel函数
function htmlToXls(data){
    var option={};
    option.fileName = '机车驾驶证统计信息表';
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
            sheetFilter:['PayId','ArchivesId','UName','BirthDate','Txrq','Department','fsjDate','fsjRemark','fsjDriveCode',
                'fsjDriveType','sjDate','sjRemark','sjDriveCode','sjDriveType','deadline','status'],
            sheetHeader:['工资号','档案号','姓名','出生日期','退休日期','部门','副司机初次领证日期','批准文号','准驾类型代码','准驾类型',
                '司机初次领证日期','批准文号','准驾类型代码','准驾类型','证件有效截止日期','驾驶证状态']
        }
    ];
    var toExcel=new ExportJsonExcel(option);
    toExcel.saveExcel();
}

//显示表头，由于表头是固定的，不能每次都动态添加   参数是数据集data和插入的位置dataPosition
function showTableHead(data,pagePosition,dataPosition,headEvent,tableName,obj,total,countPerPage){
    var html = '<table><tr>';
    for(var i in data['row1']){
        //字典，中英文对照
        var j ='';
        switch(i){
            case 'PayId':
                j = '工资号';
                break;
            case 'ArchivesId':
                j = '档案号';
                break;
            case 'UName':
                j = '姓&nbsp;&nbsp;&nbsp;&nbsp;名';
                break;
            case 'Department':
                j = '部&nbsp;&nbsp;&nbsp;&nbsp;门';
                break;
            case 'BirthDate':
                j = '出生日期';
                break;
            case 'Txrq':
                j = '退休日期';
                break;
            case 'deadline':
                j = '截止日期';
                break;
            case 'payid':
                j = '工资号';
                break;
            case 'fsjDate':
                j = '副司机初次<br>领证日期';
                break;
            case 'fsjRemark':
                j = '批&nbsp;准&nbsp;文&nbsp;号';
                break;
            case 'fsjDriveCode':
                j = '准驾类型代码';
                break;
            case 'fsjDriveType':
                j = '准&nbsp;驾&nbsp;类&nbsp;型';
                break;
            case 'sjDate':
                j = '司机初次<br>领证日期';
                break;
            case 'sjRemark':
                j = '批&nbsp;准&nbsp;文&nbsp;号';
                break;
            case 'sjDriveCode':
                j = '准驾类型代码';
                break;
            case 'sjDriveType':
                j = '准&nbsp;驾&nbsp;类&nbsp;型';
                break;
            case 'status':
                j = '驾驶证状态';
                break;
            case 'age':
                j = '年龄';
                break;
            case 'startDate':
                j = '有效起始日期';
                break;
            case 'remainingDays':
                j = '剩余天数';
                break;
            case 'cardPath':
                break;
            case 'changeType':
                j = '申请类型';
                break;
        }
        html += '<th id='+i+'>'+j+'</th>';
    }
    html += '</tr>';
    $(dataPosition).empty();
    $(dataPosition).append(html);
    $(dataPosition).children('table').attr('cellspacing',0).attr('cellpadding',0).attr('id',tableName);

    //是否给表头添加事件
    if(headEvent === true){
        boundHeadEvent($(dataPosition).children('table').children('tbody').children('tr').children('th'),obj,$(pagePosition),total,countPerPage);
        //表头点击排序
        function boundHeadEvent(eventElement,obj,pagePosition,total,countPerPage){
            //permission变量用来记录是否允许用户进行排序：
            //如果用户在查询之后变更了勾选的车间，就不能进行排序了
            var permission = 1;
            $('#queryCardBanner input').off('change').change(function(){
                permission =0;
                $(eventElement).css({'cursor':'default','color':"#bbb"});
            });
            //给表头栏目添加事件：例如点击工资号，升序，再次点击，降序排列
            $(eventElement).off('click').on('click',function(){
                var width = parseInt($(this).css('width').split('px')[0]);
                var positionY = -78;
                //做火狐兼容
                if(navigator.userAgent.indexOf('Firefox')>=0){
                    positionY = -66;
                }
                if(permission){
                    //把点击的th的所有兄弟th的背景清空、排序属性重置
                    $(this).siblings().attr('status','');
                    $(this).siblings().css({"background-image":'none','background-position-y':'-3px'});
                    //如果已有status属性并为空，说明是从升序转来，转降序排列并且设置背景
                    if($(this).attr('status') === ' '){
                        $(this).attr('status','DESC');
                        $(this).css({'background-position-y':positionY+'px'});
                        //两行文本的背景略有不同
                        if($(this).text().length>7){
                            $(this).css('background-position-y',(positionY+12)+'px')
                        }
                    }else if($(this).attr('status') === 'DESC'){
                        $(this).css({'background-position-y':(positionY+75)+'px'});
                        $(this).attr('status',' ');
                        if($(this).text().length>7){
                            $(this).css('background-position-y',(positionY+87)+'px')
                        }
                    }else{
                        $(this).attr('status',' ');
                        $(this).css({'background-position-x':width*0.89+'px','background-image':'url(../images/sprite.png)','background-position-y':(positionY+75)+'px'});
                        if($(this).text().length>7){
                            $(this).css('background-position-y',(positionY+87)+'px')
                        }
                    }
                    orderAjaxRequest($(this).attr('id'),$(this).attr('status'),$(pagePosition).children('.cur').text(),obj,total,countPerPage,dataPosition,pagePosition);
                }else{
                    alert('请重新进行查询');
                }
            })
        };
    }


}
//参数：要按哪列排序、排序方式、当前是第几页、sql语句对象
function orderAjaxRequest(orderColumn,orderWay,current,obj,total,countPerPage,dataPosition,pagePosition){
    var ajaxTimeOut = $.ajax({
        url: "../../../index.php",
        type:"POST",
        timeout:8000,
        //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
        data:{funcName:'select',where:obj.where,serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
            tableName:'jbxx',column:obj.column,order:' order by '+orderColumn+' '+orderWay},
        dataType:'json',
        success:function(data){
            if(data.success === 1){
                //把使用过的多余属性删除，便于处理数据
                delete data['success'];
                delete data['count'];
                showList(data,current,countPerPage,dataPosition);
                showPagingList(data,total,countPerPage,pagePosition,current,dataPosition);
            }else{
                alert('您查询的信息不存在');
            }
        },
        beforeSend:function(){
            loadingPicOpen();
            testSession(userSessionInfo);
        },
        complete: function (XMLHttpRequest,status) {
            loadingPicClose();
            if(status === 'timeout') {
                ajaxTimeOut.abort();    // 超时后中断请求
                alert('网络超时，请检查网络连接');
            }
        }
    })
}

//显示数据列表的函数，参数是数据集data,第page页,每页条数,目标位置
function showList(data,page,countPerPage,dataPosition){
    //等待画面
    loadingPicOpen();
    //添加表头
    var html ='<tr>';
    var j =0;
    //取数据，拼接字符串
    for(var i in data){
        if(j>=countPerPage*(page-1) && j<countPerPage*page && i ){
            j++;
            for(var m in data[i]){
                html += '<td>'+data[i][m]+'</td>';
            }
            html+="</tr>"
        }else if(j>countPerPage*page){
            html += '</table>';
            break;
        }else{
            j++;
        }
    }
    //把字符串加入文档，注意要先把表格清空。表头固定，所以只删除除表头之外的tr
    var id = $(dataPosition).attr('id');
    $("#"+id+" tr:not(:first)").remove();
    $($("#"+id+" tbody")).append(html);
    //判断条目是否不够一页，如果不够，用空白栏目布满
    if($(dataPosition).children('table').children('tbody').children('tr').length < countPerPage+1){
        //要再添加count行以补满表格
        html ='';
        var count = countPerPage-$(dataPosition).children('table').children('tbody').children('tr').length+1;
        var columns = getHowManyColumns(data);
        //两层循环，添加tr和td
        for(var m=0;m<count;m++){
            html+='<tr>';
            for(var n=0;n<columns;n++){
                html+="<td></td>";
            }
            html+="</tr>";
        }
        $(dataPosition).children('table').children('tbody').append(html);
    }
    //关闭等待画面
    loadingPicClose()
}
//显示分页控件的函数，参数是数据集条数,每页条数，生成分页控件的目标位置，current当前序号
function showPagingList(data,total,countPerPage,pagePosition,current,dataPosition){
    var html ='';
    //第一次查询，显示分页栏，显示第几页/共几页
    $(pagePosition).css("display",'block');
    $(pagePosition).children(".cur").html(current);
    //共max页
    var max = Math.ceil(total/countPerPage);
    $(pagePosition).children(".total").html(max);
    //给select标签添加option子元素
    for(var i =0;i<max;i++){
        html+= '<option>'+(i+1)+'</option>';
    }
    $(pagePosition).children(".selectPage").empty();
    $(pagePosition).children(".selectPage").append(html);
    //通过参数，获知目前是第几页，更改下拉菜单的当前值
    $(pagePosition).children(".selectPage").children("option:eq("+(current-1)+")").attr('selected','selected');
    //控件添加完毕，绑定事件。参数是总页数和当前页码
    boundPageEvent(data,max,current,total,countPerPage,pagePosition,dataPosition);
}
//绑定分页控件的点击事件，参数是最大页数和当前页数
function boundPageEvent(data,max,cur,total,countPerPage,pagePosition,dataPosition){
    $(pagePosition).children(".home").off('click').click(function(){
        if(cur!==1){
            showList(data,1,countPerPage,dataPosition);
            showPagingList(data,total,countPerPage,pagePosition,1,dataPosition);
            cur = 1;
        }
    });
    $(pagePosition).children(".prev").off('click').click(function(){
        if(parseInt(cur)!==1){
            showList(data,cur-1,countPerPage,dataPosition);
            showPagingList(data,total,countPerPage,pagePosition,cur-1,dataPosition);
            cur-=1;
        }
    });
    $(pagePosition).children(".next").off('click').click(function(){
        cur =parseInt(cur);
        if(cur!==max){
            //此处要做类型转换，以免页码的类型由数值变成字符串，+1操作就出现bug了
            showList(data,cur+1,countPerPage,dataPosition);
            showPagingList(data,total,countPerPage,pagePosition,cur+1,dataPosition);
            cur+=1;
        }
    });
    $(pagePosition).children(".last").off('click').click(function(){
        if(cur!==max){
            showList(data,max,countPerPage,dataPosition);
            showPagingList(data,total,countPerPage,pagePosition,max,dataPosition);
            cur = max;
        }
    });
    //下拉菜单的事件由change()绑定，off()防止累加绑定。
    $(pagePosition).children(".selectPage").off('change').change(function(){
        var cur = $(this).children('option:selected').val();
        showList(data,cur,countPerPage,dataPosition);
        showPagingList(data,total,countPerPage,pagePosition,cur,dataPosition);
    })
    //生成excel文件
    $("#htmlToXls").off('click').on('click',function(){
        if(confirm('是否要将查询结果生成Excel文件？')){
            htmlToXls(data)
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
                    alert('欢迎，'+data.username);
                    sessionSet('token',data.token);
                    sessionSet('power',data.power);
                    sessionSet('user',data.username);
                    sessionSet('department',data.department);
                    sessionSet('payId',data.payId);
                    window.location.href = 'index.html'
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
    if(obj.token === sessionGet('token') && obj.user ===sessionGet('user') && obj.power ===sessionGet('power') && obj.department === sessionGet('department') && obj.payId === sessionGet('payId')){
        console.log('session 正常')
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
        querySql.column = '';
        var arr  = $("#inputArea>div>input:checked");
        if(arr.length === 0){
            alert('请至少选择一列您要查看的信息');
            //后期如果数据库jbxx写入了更多列，在这里更改
        }else if(arr.length === 18){
            querySql.column = 'PayId,ArchivesId,UName,Department,Txrq,BirthDate,fsjDate,fsjRemark,' +
                '           fsjDriveCode,fsjDriveType,sjDate,sjRemark,sjDriveCode,sjDriveType,status,deadline,startDate,remainingDays';
        }else{
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
        if($("#column option:selected").val() === 'fsjDate'){
            var date ='';
            var today = new Date;
            var year = '';
            var month = '';
            var day = '';
            if($("#selectType option:selected").val() === 'later'){
                //日期的正则表达式
                if($("#value").val().match(/^\d{8}$/) || $("#value").val().match(/^\d{4}-\d{2}-\d{2}$/)){
                    if($("#value").val().match(/^\d{8}$/)){
                        year = $("#value").val().substr(0,4);
                        month = $("#value").val().substr(4,2);
                        day = $("#value").val().substr(6,2);
                    }else{
                        year = $("#value").val().split('-')[0];
                        month = $("#value").val().split('-')[1];
                        day = $("#value").val().split('-')[2];
                    }
                    if(year<1900 || month>12 || month<1 || day<1 ||day>31){
                        alert('请输入正确的时间');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else if(year%4 !== 0 && month==='02' && day>28){
                        alert('请输入正确的时间，该年不是闰年');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else if((month === '04' || month === '06' || month === '09' || month === '11') && day>30){
                        alert('请输入正确的时间，该月最多30天');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else{
                        date = year+'-'+month+'-'+day;
                        querySql.where = ' where fsjDate >= \''+date+'\'';
                        querySql.order = ' order by fsjDate';
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
                        year = $("#value").val().substr(0,4);
                        month = $("#value").val().substr(4,2);
                        day = $("#value").val().substr(6,2);
                    }else{
                        year = $("#value").val().split('-')[0];
                        month = $("#value").val().split('-')[1];
                        day = $("#value").val().split('-')[2];
                    }
                    if(year<1900 || month>12 || month<1 || day<1 ||day>31){
                        alert('请输入正确的时间');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else if(year%4 !== 0 && month==='02' && day>28){
                        alert('请输入正确的时间，该年不是闰年');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else if((month === '04' || month === '06' || month === '09' || month === '11') && day>30){
                        alert('请输入正确的时间，该月最多30天');
                        $("#value").focus().css('backgroundColor','#ffcccc');
                    }else{
                        date = year+'-'+month+'-'+day;
                        querySql.where = ' where fsjDate <= \''+date+'\'';
                        querySql.order = ' order by fsjDate';
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
                        var year1 = $("#value1").val().substr(0, 4);
                        var month1 = $("#value1").val().substr(4, 2);
                        var day1 = $("#value1").val().substr(6, 2);
                        var date1 ='';
                    } else {
                        year1 = $("#value1").val().split('-')[0];
                        month1 = $("#value1").val().split('-')[1];
                        day1 = $("#value1").val().split('-')[2];
                    }
                }else{
                    alert('请输入正确的时间:\"xxxxxxxx\"或\"xxxx-xx-xx\"');
                    $("#value1").focus().css('backgroundColor','#ffcccc');
                    return false;
                }
                if($("#value2").val().match(/^\d{8}$/) || $("#value2").val().match(/^\d{4}-\d{2}-\d{2}$/)) {
                    if ($("#value2").val().match(/^\d{8}$/)) {
                        var year2 = $("#value2").val().substr(0, 4);
                        var month2 = $("#value2").val().substr(4, 2);
                        var day2 = $("#value2").val().substr(6, 2);
                        var date2 ='';
                    } else {
                        year2 = $("#value2").val().split('-')[0];
                        month2 = $("#value2").val().split('-')[1];
                        day2 = $("#value2").val().split('-')[2];
                    }
                    if(month1>12 || month1<1 || day1<1 ||day1>31){
                        alert('请输入正确的时间');
                        $("#value1").focus().css('backgroundColor','#ffcccc');
                    }else if(year1%4 !== 0 && month1==='02' && day1>28){
                        alert('请输入正确的时间，该年不是闰年');
                        $("#value1").focus().css('backgroundColor','#ffcccc');
                    }else if((month1 === '04' || month1 === '06' || month1 === '09' || month1 === '11') && day1>30){
                        alert('请输入正确的时间，该月最多30天');
                        $("#value1").focus().css('backgroundColor','#ffcccc');
                    }else if((year2>=today.getFullYear() && month2>=(today.getMonth()+1) && day2>=today.getDate()) || year2<1900 || month2>12 || month2<1 || day2<1 ||day2>31){
                        alert('请输入正确的时间');
                        $("#value2").focus().css('backgroundColor','#ffcccc');
                    }else if(year2%4 !== 0 && month2==='02' && day2>28){
                        alert('请输入正确的时间，该年不是闰年');
                        $("#value2").focus().css('backgroundColor','#ffcccc');
                    }else if((month2 === '04' || month2 === '06' || month2 === '09' || month2 === '11') && day2>30){
                        alert('请输入正确的时间，该月最多30天');
                        $("#value2").focus().css('backgroundColor','#ffcccc');
                    }else{
                        date1 = year1+'-'+month1+'-'+day1;
                        date2 = year2+'-'+month2+'-'+day2;
                        if(year1>year2 || (year1===year2 && month1>month2) || (year1===year2 && month1===month2 && day1>day2)){
                            querySql.where = ' where fsjDate between \''+date2+'\' AND \''+date1+'\'';
                        }else{
                            querySql.where = ' where fsjDate between \''+date1+'\' AND \''+date2+'\'';
                        }
                        querySql.order = ' order by fsjDate';
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
        if($("#column option:selected").val() === 'fsjRemark'){
            querySql.order = ' order by fsjRemark';
            querySql.where = ' where fsjRemark =\''+$("#value option:selected").val()+'\'';
            return querySql;
        }
        if($("#column option:selected").val() === 'fsjDriveCode'){
            querySql.where = ' where ';
            for(var n=0;n<$("#valueDiv input:checked").length;n++){
                querySql.where += ' fsjDriveCode = \''+$("#valueDiv input:checked:eq("+n+")").attr('id')+'\' or';
            }
            querySql.order = ' order by fsjDriveCode';
            querySql.where = querySql.where.slice(0,querySql.where.length-2);
            return querySql;
        }
        if($("#column option:selected").val() === 'fsjDriveType'){
            querySql.where = ' where ';
            for(var m=0;m<$("#valueDiv input:checked").length;m++){
                querySql.where += ' fsjDriveCode = \''+$("#valueDiv input:checked:eq("+m+")").attr('id')+'\' or';
            }
            querySql.order = ' order by fsjDriveType';
            querySql.where = querySql.where.slice(0,querySql.where.length-2);
            return querySql;
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
                //剩余天数的正则表达式,1到4位数字，待定
                if($("#value").val().match(/^[0-9]{1,4}$/)){
                    querySql.where = ' where remainingDays >= '+$("#value").val();
                    querySql.order = ' order by remainingDays';
                    return querySql;
                }else{
                    alert('请输入正确的年龄');
                    $("#value").focus().css('backgroundColor','#ffcccc');
                }
            }else if($("#selectType option:selected").val() === 'less'){
                if($("#value").val().match(/^[0-9]{1,4}$/)){
                    querySql.where = ' where remainingDays <= '+$("#value").val();
                    querySql.order = ' order by remainingDays';
                    return querySql;
                }else{
                    alert('请输入正确的年龄');
                    $("#value").focus().css('backgroundColor','#ffcccc');
                }
            }else if($("#selectType option:selected").val() === 'between'){
                if($("#value1").val() !== '' || $("#value2").val() !== ''){
                    if($("#value1").val().match(/^[0-9]{1,4}$/) && $("#value2").val().match(/^[0-9]{1,4}$/)){
                        var g = parseInt($("#value1").val());
                        var h = parseInt($("#value2").val());
                        if(g<h){
                            querySql.where = ' where remainingDays between '+g+' AND '+h+'';
                            querySql.order = ' order by remainingDays';
                            return querySql;
                        }else {
                            querySql.where = ' where remainingDays between '+h+' AND '+g+'';
                            querySql.order = ' order by remainingDays';
                            return querySql;
                        }
                    }else{
                        alert('请输出正确的年龄');
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
    $.ajax({
        url: "../../../index.php",
        type:"POST",
        timeout:8000,
        //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
        data:{funcName:'appendElement',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
            tableName:'jbxx',column:'top 1 PayId,ArchivesId,UName,Department,Txrq,BirthDate,fsjDate,fsjRemark,' +
            'fsjDriveCode,fsjDriveType,sjDate,sjRemark,sjDriveCode,sjDriveType,status,deadline,startDate,remainingDays'},
        dataType:'json',
        success:function(data){
            for(var i in data['row']){
                //字典，中英文对照
                var j ='';
                switch(i){
                    case 'PayId':
                        j = '工资号';
                        break;
                    case 'ArchivesId':
                        j = '档案号';
                        break;
                    case 'UName':
                        j = '姓名';
                        break;
                    case 'Department':
                        j = '部门';
                        break;
                    case 'BirthDate':
                        j = '出生日期';
                        break;
                    case 'Txrq':
                        j = '退休日期';
                        break;
                    case 'deadline':
                        j = '有效截止日期';
                        break;
                    case '':
                        j = '工资号';
                        break;
                    case 'fsjDate':
                        j = '副司机初次领证日期';
                        break;
                    case 'fsjRemark':
                        j = '批准文号';
                        break;
                    case 'fsjDriveCode':
                        j = '准驾类型代码';
                        break;
                    case 'fsjDriveType':
                        j = '准驾类型';
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
                    case 'remainingDays':
                        j = '有效剩余天数';
                        break;

                }
                html += '<div><input type=\"checkbox\" id=\"'+ i +'\"><label for=\"'+i+'\">'+j+'</label></div>';
            }
            $("#inputArea").append(html);
            //给单选框和复选框分别绑定事件，全选、全不选
            $("#inputArea>div>input").off('change').on('change',function(){
                $("#all").prop('checked',false);
                $("#allNo").prop('checked',false);
                //该全局变量表示被选中的复选框个数
                numOfSelect =0;
                var arr  = $("#inputArea>div>input");
                for(var i =0;i<18;i++){
                    if($(arr[i]).prop('checked')){
                        numOfSelect++;
                    }
                }
                if(numOfSelect ===0){
                    $("#allNo").prop('checked',true);
                }else if(numOfSelect ===18){
                    $("#all").prop('checked',true);
                }
            });
            //绑定单选框事件
            $("#all").off('change').on("change",function () {
                if($(this).prop('checked')){
                    numOfSelect=18;
                    $("#inputArea>div>input").prop("checked",true);
                }
            });
            $("#allNo").off('change').on("change",function () {
                if($(this).prop('checked')){
                    numOfSelect=0;
                    $("#inputArea>div>input").prop("checked",false);
                }
            });
            $("#all").prop("checked",true);
            $("#inputArea>div>input").prop("checked",true);
        }
    });
}
function appendSelection(){
    var _html = '';
    var __html = '';
    var column = $("#column").val();
    if(column === 'payId' || column==='archivesId' || column === 'age'){
        _html = '<select name=\"selectType\" id=\"selectType\"><option value="please">--请选择--</option><option value=\"greater\">大于</option><option value=\"less\">小于</option><option value=\"between\">介于</option></select>';
    }else if(column === 'fsjDate' || column ==='sjDate'){
        _html = '<select name="selectType" id="selectType"><option value="please">--请选择--</option><option value=\"later\">晚于</option><option value=\"earlier\">早于</option><option value=\"between\">介于</option></select>';
    }else if(column === 'fsjRemark' || column === 'sjRemark'){
        _html = '等于';
        $.ajax({
            url: "../../../index.php",
            type:"POST",
            timeout:8000,
            data:{funcName:'select',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                tableName:'jbxx',column:'DISTINCT '+column,where:' '},
            dataType:'json',
            success:function(data){
                delete data['success'];
                delete data['count'];
                __html = '<select name=\"value\" id=\"value\">';
                for(var i in data){
                    if(data[i][column]!==''){
                        __html += '<option value=\"'+data[i][column]+'\">'+data[i][column]+'</option>';
                    }
                }
                __html += '</select>';
                $("#valueDiv").empty().append(__html)
            }
        })

    }else if(column === 'fsjDriveCode' || column ==='sjDriveCode'){
        _html = '属于';
        $.ajax({
            url: "../../../index.php",
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
                        __html += '<input class=\"marginLeft10px marginTop24px\" type=\"checkbox\" id=\"'+data[i]['name']+'\"/><label for=\"'+data[i]['name']+'\">'+data[i]['name']+'</label>';
                    }
                }
                $("#valueDiv").empty().append(__html)
            }
        })
    }else if(column === 'fsjDriveType' || column==='sjDriveType'){
        _html = '属于';
        $.ajax({
            url: "../../../index.php",
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
                        __html += '<input class="marginLeft6px" type=\"checkbox\" id=\"'+data[i]['name']+'\"/><label class=\"font12px" for=\"'+data[i]['name']+'\">'+data[i]['nr1']+'</label>';
                    }
                }
                $("#valueDiv").empty().append(__html)
            }
        })
    }else if(column === 'deadline' || column === 'startDate'){
        _html = '<select name=\"selectType\" id=\"selectType\"><option value="please">--请选择--</option><option value=\"later\">晚于</option><option value=\"earlier\">早于</option><option value=\"between\">介于</option></select>';
    }else if(column === 'remainingDays'){
        _html = '<select name=\"selectType\" id=\"selectType\"><option value="please">--请选择--</option><option value=\"greater\">大于</option><option value=\"less\">小于</option><option value=\"between\">介于</option></select>';
    }else{
        _html = '为';
        $.ajax({
            url: "../../../index.php",
            type:"POST",
            timeout:8000,
            data:{funcName:'select',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                tableName:'csxx',column:'nr2',where:' where lb = \'zjzt\' ',order:' '},
            dataType:'json',
            success:function(data){
                delete data['success'];
                delete data['count'];
                __html = '<select name=\"value\" id=\"value\">';
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
    }else if((selectType === 'earlier' || selectType ==='later') && (column === 'fsjDate' || column === 'sjDate')){
        //input type=date 标签只有chrome支持，IE和FF都不支持
        //_html = '<input type=\"date\" id=\"value\"/>';
        _html = '<input type=\"text\" id=\"value\"/>';
    }else if((selectType === 'between') && (column === 'payId' || column === 'archivesId' || column === 'age' || column ==='remainingDays')){
        _html = '<input type="text" id="value1"/>至<input type="text" id="value2"/>之间'
    }else if((selectType === 'between') && (column === 'fsjDate' || column === 'sjDate')){
        _html = '<input type="text" id="value1"/>至<input type="text" id="value2"/>之间'
    }else if((selectType === 'earlier' || selectType ==='later') && (column === 'deadline' || column === 'startDate')){
        var flag = '';
        if(selectType === 'earlier'){
            flag = '<=';
        }else{
            flag = '>=';
        }
        _html = '<input class="marginTop20px" type=\"text\" id=\"value\"/>';
    }else if((selectType === 'between') && (column === 'deadline' || column ==='startDate')){
        _html = '<input class="marginTop20px" type="text" id="value1"/>至<input type="text" id="value2"/>之间'
    }
    $("#valueDiv").empty().append(_html)
}

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