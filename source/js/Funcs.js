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
    var index = $(this).index();
    if(index<5){
        $("#rightContent .operateContent>div:eq("+index+")").css('display','block').siblings().css('display','none');
    }else{
        if(confirm("确定要注销用户？")){
            sessionRemove('user');
            window.location.href = '../html/login.html'
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
    checkQueryRequest()
        // var ajaxTimeOut = $.ajax({
        //     url: "../../../index.php",
        //     type:"POST",
        //     timeout:8000,
        //     //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
        //     data:{key:data,target:'department',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
        //     tableName:'jbxx',column:'*',order:' '},
        //     dataType:'json',
        //     success:function(data){
        //         if(data.success === 1){
        //             //把使用过的多余属性删除，便于处理数据
        //             delete data['success'];
        //             displayQueryTable(data,document.getElementById('queryCardContent'),'pageMode');
        //             //生成EXCEL按钮出现
        //             $("#htmlToXls").css("visibility",'visible')
        //         }else{
        //             alert('您查询的信息不存在');
        //         }
        //     },
        //     beforeSend:function(){
        //         testSession(userSessionInfo);
        //         loadingPicOpen();
        //         checkQueryRequest()
        //     },
        //     complete: function (XMLHttpRequest,status) {
        //         loadingPicClose();
        //         if(status === 'timeout') {
        //             ajaxTimeOut.abort();    // 超时后中断请求
        //             alert('网络超时，请检查网络连接');
        //         }
        //     }
        // })
}


//displayQueryTable函数，用来显示查询结果的表格(table)并添加内容   最好做成可以通用的函数，根据传入数据的不同来改变
//第一个参数data是传入的数据(obj),第二个参数是要添加表格的位置即父元素,第三个参数分页模式,目前还未增加第二种模式
function displayQueryTable(data,element,mode){
    if(mode === 'pageMode'){
        //分页,每页30条
        pageDividing(data,data['count'],30,document.getElementById('queryCardContent'),document.getElementById('cardPageContent'));
    }
}



//分页函数，data是数据集，参数total是数据总条目数，countPerPage是每页几条,
// dataPosition代表数据插入的位置（父元素）习惯是个table标签，
// pagePosition代表分页器插入的位置(父元素)习惯是个div标签
function pageDividing(data,total,countPerPage,dataPosition,pagePosition){
    //把多余的属性删除，便于处理
    delete data['count'];
    showTableHead(data,dataPosition);
    showList(data,1,countPerPage,dataPosition);
    showPagingList(data,total,countPerPage,pagePosition,1);
    //显示表头，由于表头是固定的，不能每次都动态添加   参数是数据集data和插入的位置dataPosition
    function showTableHead(data,dataPosition){
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
                case '':
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
            }
            html += '<th id='+i+'>'+j+'</th>';
        }
        html += '</tr>';
        $(dataPosition).empty();
        $(dataPosition).append(html);
        $(dataPosition).children('table').attr('cellspacing',0).attr('cellpadding',0).attr('id','queryCardContentTable');
        boundHeadEvent($(dataPosition).children('table').children('tbody').children('tr').children('th'));
        //表头点击排序
        function boundHeadEvent(eventElement){
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
                    orderAjaxRequest($(this).attr('id'),$(this).attr('status'),$("#cur").text());
                }else{
                    alert('请重新进行查询');
                }
            })
        };
    }
    //参数：要按哪列排序、排序方式、当前是第几页
    function orderAjaxRequest(orderColumn,orderWay,current){
        var data ='';
        var checkBoxArray = document.getElementById("queryCardBanner").getElementsByTagName("input");
        for(var i =0,j=0;i<4;i++){
            if(checkBoxArray[i].checked){
                //例如“洛阳运用&洛襄运用&三西运用&”
                data+=  $("#queryCardBanner>label:eq("+i+")").text()+'&';
                j+=1;
            }
        }
        data = data.substr(0,data.length-1);
        var ajaxTimeOut = $.ajax({
            url: "../../../index.php",
            type:"POST",
            timeout:8000,
            //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
            data:{key:data,target:'department',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                tableName:'jbxx',column:'*',order:' order by '+orderColumn+' '+orderWay},
            dataType:'json',
            success:function(data){
                if(data.success === 1){
                    //把使用过的多余属性删除，便于处理数据
                    delete data['success'];
                    delete data['count'];
                    showList(data,current,countPerPage,dataPosition);
                    showPagingList(data,total,countPerPage,pagePosition,current);
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
        var html ='';
        var j =0;
        //取数据，拼接字符串
        for(var i in data){
            if(j>=countPerPage*(page-1) && j<countPerPage*page && i ){
                j++;
                html += '<tr><td>'+data[i]['PayId']+'</td>';
                html += '<td>'+data[i]['ArchivesId']+'</td>';
                html += '<td>'+data[i]['UName']+'</td>';
                html += '<td>'+data[i]['BirthDate']+'</td>';
                html += '<td>'+data[i]['Txrq']+'</td>';
                html += '<td>'+data[i]['Department']+'</td>';
                html += '<td>'+data[i]['fsjDate']+'</td>';
                html += '<td>'+data[i]['fsjRemark']+'</td>';
                html += '<td>'+data[i]['fsjDriveCode']+'</td>';
                html += '<td>'+data[i]['fsjDriveType']+'</td>';
                html += '<td>'+data[i]['sjDate']+'</td>';
                html += '<td>'+data[i]['sjRemark']+'</td>';
                html += '<td>'+data[i]['sjDriveCode']+'</td>';
                html += '<td>'+data[i]['sjDriveType']+'</td>';
                html += '<td>'+data[i]['deadline']+'</td>';
                html += '<td>'+data[i]['status']+'</td></tr>';
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
        if($("#queryCardContentTable tbody").children('tr').length < countPerPage+1){
            //要再添加count行以补满表格
            html ='';
            var count = countPerPage-$("#queryCardContentTable tbody").children('tr').length+1;
            var columns = getHowManyColumns(data);
            //两层循环，添加tr和td
            for(var m=0;m<count;m++){
                html+='<tr>';
                for(var n=0;n<columns;n++){
                    html+="<td></td>";
                }
                html+="</tr>";
            }
            $("#queryCardContentTable tbody").append(html);
        }
        //关闭等待画面
        loadingPicClose()
    }
    //显示分页控件的函数，参数是数据集条数,每页条数，生成分页控件的目标位置，current当前序号
    function showPagingList(data,total,countPerPage,pagePosition,current){
        var html ='';
        //第一次查询，显示分页栏，显示第几页/共几页
        $("#cardPageContent").css("display",'block');
        $("#cur").html(current);
        //共max页
        var max = Math.ceil(total/countPerPage);
        $("#total").html(max);
        //给select标签添加option子元素
        for(var i =0;i<max;i++){
            html+= '<option>'+(i+1)+'</option>';
        }
            $("#selectPage").empty();
        $("#selectPage").append(html);
        //通过参数，获知目前是第几页，更改下拉菜单的当前值
        $("#selectPage option:eq("+(current-1)+")").attr('selected','selected');
        //控件添加完毕，绑定事件。参数是总页数和当前页码
        boundPageEvent(data,max,current);
    }
    //绑定分页控件的点击事件，参数是最大页数和当前页数
    function boundPageEvent(data,max,cur){
        $("#home").off('click').click(function(){
            if(cur!==1){
                showList(data,1,countPerPage,dataPosition);
                showPagingList(data,total,countPerPage,pagePosition,1);
                cur = 1;
            }
        });
        $("#prev").off('click').click(function(){
            if(cur!==1){
                showList(data,cur-1,countPerPage,dataPosition);
                showPagingList(data,total,countPerPage,pagePosition,cur-1);
                cur-=1;
            }
        });
        $("#next").off('click').click(function(){
            if(cur!==max){
                //此处要做类型转换，以免页码的类型由数值变成字符串，+1操作就出现bug了
                cur = parseInt(cur);
                showList(data,cur+1,countPerPage,dataPosition);
                showPagingList(data,total,countPerPage,pagePosition,cur+1);
                cur+=1;
            }
        });
        $("#last").off('click').click(function(){
            if(cur!==max){
                showList(data,max,countPerPage,dataPosition);
                showPagingList(data,total,countPerPage,pagePosition,max);
                cur = max;
            }
        });
        //下拉菜单的事件由change()绑定，off()防止累加绑定。
        $("#selectPage").off('change').change(function(){
            var cur = $(this).children('option:selected').val();
            showList(data,cur,countPerPage,dataPosition);
            showPagingList(data,total,countPerPage,pagePosition,cur);
        })
        //生成excel文件
        $("#htmlToXls").off('click').on('click',function(){
            if(confirm('是否要将查询结果生成Excel文件？')){
                htmlToXls(data)
            }
        })
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
function rememberSession(token,user,power){
    var userInfo = {};
    userInfo.token = sessionGet(token);
    userInfo.user = sessionGet(user);
    userInfo.power = sessionGet(power);
    console.log(userInfo)
    return userInfo;
}


//测试session是否被更改过
function testSession(obj){
    if(obj.token === sessionGet('token') && obj.user ===sessionGet('user') && obj.power ===sessionGet('power')){
        console.log(1)
    }else{
        alert('用户信息发生变化，请重新登录');
        window.location.href = 'login.html'
    }
}

//该函数为查询按钮点击时发送ajax请求前进行的客户端验证函数，主要使用正则表达式来
//校验、补全用户的输入
function checkQueryRequest(){
    var checkBoxArray = document.getElementById("queryCardBanner").getElementsByTagName("input");
    var departArray ='';
    for(var i =0,j=0;i<4;i++){
        if(checkBoxArray[i].checked){
            //例如“洛阳运用&洛襄运用&三西运用&”
            departArray+=  $("#queryCardBanner>label:eq("+i+")").text()+'&';
            j+=1;
        }
    }
    //验证用户没有空选，把字符串最后一个&去掉,发送ajax请求后台处理数据
    if(departArray!==''){
        var column = '';
        var where = '';
        var order = '';
        var arr  = $("#inputArea>div>input:checked");
        if(arr.length === 0){
            alert('请至少选择一列您要查看的信息');
        }else if(arr.length === 16){
            column = '*';
        }else{
            for(var i =0;i<arr.length;i++){
                column += $(arr[i]).attr('id')+',';
            }
            column = column.substring(0,column.length-1)
        }
        //6-11下午继续做拼接字符串
        console.log(column)
    }else{
        alert('请至少选择一个车间');
    }
}
//渲染页面中需要动态添加的元素(高级搜索中的checkbox)
function appendElement(){
    var html ='';
    $.ajax({
        url: "../../../index.php",
        type:"POST",
        timeout:8000,
        //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
        data:{funcName:'appendElement',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
            tableName:'jbxx',column:'top 1 *'},
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
                        j = '截止日期';
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
                for(var i =0;i<16;i++){
                    if($(arr[i]).prop('checked')){
                        numOfSelect++;
                    }
                }
                if(numOfSelect ===0){
                    $("#allNo").prop('checked',true);
                }else if(numOfSelect ===16){
                    $("#all").prop('checked',true);
                }
            });
            //绑定单选框事件
            $("#all").off('change').on("change",function () {
                if($(this).prop('checked')){
                    numOfSelect=16;
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