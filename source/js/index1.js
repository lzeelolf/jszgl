$(document).ready(function() {
    var queryCardButton = document.getElementById("queryCardButton");
    initialScreen();
    loginStatus();
    //记住登录时的session
    userSessionInfo = rememberSession('token', 'user', 'power', 'department','payId');
    //证件查询按钮的事件,调用displayQueryForm函数
    eventBound(queryCardButton, 'click', displayQueryForm);

    //根据用户的权限来显示左边的li内容
    appendLi(sessionGet('power'))


    //取公用参数信息
    var csData = {};
    $.ajax({
        url: "../../../index.php",
        type: "POST",
        timeout: 8000,
        data: {
            funcName: 'getCsxx', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
            tableName: 'csxx', column: ' * '
        },
        dataType: 'json',
        success: function (Data) {
            csData = Data;
            $("li.statusButton").on('click', function () {
                displayContainer
                checkCardStatus(csData);

            })
        }
    });



    function appendLi(power) {
        var html = '';
        if (power === 'V') {//这里填管理员的权限
            html = '<li class=\"appendButton\">证件添加</li><li class=\"queryButton\">证件查询</li><li class=\"dataButton\">数据统计</li><li class=\"checkButton\">申请审核</li>' +
                '<li class="alertButton">预警信息</li><li class="giveOutButton">证件发放</li><li class="cancelButton">证件注销</li><li class="logOutButton">退出系统</li>'
            $("#buttonList").append(html);
            appendQueryElement(power);
            appendApplyCheck(power);
        } else if (power === '1') {//这里填车间管理人员的权限
            html = '<li class=\"queryButton\">证件查询</li><li class=\"dataButton\">数据统计</li><li class=\"checkButton\">申请审核</li>' +
                '<li class="alertButton">预警信息</li><li class="giveOutButton">证件发放</li><li class="logOutButton">退出系统</li>';
            $("#buttonList").append(html);
            //车间管理人员没有添加和注销功能，移除相应区域
            $("#appendContainer").remove();
            $("#cancelContainer").remove();
            appendQueryElement(power);
            appendApplyCheck(power);
        } else if (power === '0') {//这里填普通人员的权限
            html = '<li class=\"informationButton\">证件信息</li><li class=\"applyButton\">换补申请</li><li class=\"statusButton\">证件状态</li>' +
                '<li class="improveButton">完善信息</li><li class="logOutButton">退出系统</li>';
            $("#buttonList").empty().append(html);
            normalUser();
        }
    }

    //接收参数是权限值，如果是教育科管理人员，显示全部车间，如果是车间管理人员，显示本车间
    function appendQueryElement(power) {
        var html = '';
        if (power === 'V') {
            var ajaxTimeOut = $.ajax({
                //取参数表的车间部门名补全部门选项
                //6.13   实现根据权限来渲染不同页面元素。获取车间人员的所属车间，把检索范围规定住。找几个权限不同的测试用户
                url: "../../../index.php",
                type: "POST",
                timeout: 8000,
                data: {
                    funcName: 'select', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'JSZGL',
                    tableName: 'csxx', column: 'name,nr1', where: ' where lb = \'ssbm\' ', order: ' '
                },
                dataType: 'json',
                success: function (data) {
                    delete data['success'];
                    delete data['count'];
                    html = '';
                    for (var i in data) {
                        if (data[i]['nr1'] !== '') {
                            html += '<div><input type="checkbox" id=\"' + data[i]['name'] + '\"><label for="' + data[i]['name'] + '\">' + data[i]['nr1'] + '</label></div>'
                        }
                    }
                    $("#queryCardBanner").prepend(html);
                },
                beforeSend: function () {
                    //在where字段后加入用户选择的车间范围
                    testSession(userSessionInfo);
                    loadingPicOpen();
                },
                complete: function (XMLHttpRequest, status) {
                    loadingPicClose();
                    if (status === 'timeout') {
                        ajaxTimeOut.abort();    // 超时后中断请求
                        alert('网络超时，请检查网络连接');
                    }
                }
            })
        } else if (power === '1') {
            var department = sessionGet('department').split(',')[0];
            $.ajax({
                url: "../../../index.php",
                type: "POST",
                timeout: 8000,
                data: {
                    funcName: 'select', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'JSZGL',
                    tableName: 'csxx', column: 'name,nr1', where: ' where nr1 = \'' + department + '\' ', order: ' '
                },
                dataType: 'json',
                success: function (data) {
                    delete data['success'];
                    delete data['count'];
                    html = '';
                    for (var i in data) {
                        if (data[i]['nr1'] !== '') {
                            html += '<div><input type="checkbox" id=\"' + data[i]['name'] + '\"><label for="' + data[i]['name'] + '\">' + data[i]['nr1'] + '</label></div>'
                        }
                    }
                    $("#queryCardBanner").prepend(html).css('paddingLeft', '35%');
                    $("#queryCardBanner input").attr({'checked': 'checked', 'disabled': 'true'})
                }
            })
        }
    }

    //添加审核申请界面
    function appendApplyCheck(power) {
        $("#exchangeApplyCheck").off('click').on('click',function(){
            $(this).css({'background':'#ddd','fontWeight':'bold'}).siblings('div').css({'background':'inherit','fontWeight':'normal'});
            $("#exchangeApplyContent").css('zIndex',999).siblings('div').css('zIndex',1);
            if(power === '1'){
                //添加目前正在进行车间审核的补证申请
                var obj = {};
                obj.where = ' where checkStatus = \'车间审核中\' AND changeType = \'换证\'';
                obj.column = ' lotNumber,payId,UName,changeType ';
                obj.order = ' order by lotNumber ';
                var ajaxTimeOut = $.ajax({
                    url: "../../../index.php",
                    type:"POST",
                    timeout:8000,
                    //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                    data:{funcName:'select',where:obj.where,serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                        tableName:' bgxx ',column:obj.column,order:obj.order},
                    dataType:'json',
                    success:function(data){
                        if(data['success'] === 1){
                            delete data['success'];
                            var count = data['count'];
                            delete data['count']
                            var html = '<tr><th>提交日期</th><th>工资号</th><th>姓名</th><th>申请类型</th><th>申请表详情</th><th>操作</th></tr>';
                            if(count<11){
                                for(var i in data){
                                    html += '<tr>';
                                    for(var j in data[i]){
                                        html += '<td>'+data[i][j]+'</td>';
                                    }
                                    html+= '<td><span class="seeInfo">查看详情</span></td>';
                                    html += '<td><span class="pass"></span><span class="reject"></span></td>';
                                    html += '</tr>'
                                }
                                $("#exchangeCheckTable").empty().append(html);
                                //空白tr补齐表格
                                if($("#exchangeCheckTable tbody tr").length<11){
                                    html = '';
                                    var count = 11-$("#exchangeCheckTable tbody tr").length;
                                    var columns = 6;
                                    for(var m=0;m<count;m++){
                                        html+='<tr>';
                                        for(var n=0;n<columns;n++){
                                            html+="<td></td>";
                                        }
                                        html+="</tr>";
                                    }
                                    $("#exchangeCheckTable tbody").append(html);
                                }
                            }else{
                                var q =0;
                                var cur =1;
                                var total = Math.ceil(count/10);
                                $("#exchangeApplyPage").css("display",'block');
                                for(var i in data){
                                    html += '<tr>';
                                    for(var j in data[i]){
                                        html += '<td>'+data[i][j]+'</td>';
                                    }
                                    html += '<td><span class="seeInfo">查看详情</span></td>';
                                    html += '<td><span class="pass"></span><span class="reject"></span></td>';
                                    html += '</tr>';
                                    q+=1;
                                    if(q>9){
                                        break
                                    }
                                }
                                $("#exchangeCheckTable").empty().append(html);
                                $("#exchangeApplyPage .cur").text(cur);
                                $("#exchangeApplyPage .total").text(total);
                                $("#exchangeApplyPage .next").off('click').on('click',function(){
                                    if(cur<total){
                                        var j =0;
                                        var html = '<tr><th>提交日期</th><th>工资号</th><th>姓名</th><th>申请类型</th><th>申请表详情</th><th>操作</th></tr>';
                                        for(var i in data){
                                            if(j>10*cur-1 && j<10*(cur+1) && i ){
                                                j++;
                                                html += '<tr>';
                                                for(var m in data[i]){
                                                    html += '<td>'+data[i][m]+'</td>';
                                                }
                                                html += '<td><span class="seeInfo">查看详情</span></td>';
                                                html += '<td><span class="pass"></span><span class="reject"></span></td>';
                                                html += '</tr>'
                                            }else{
                                                j++;
                                            }
                                        }
                                        $("#exchangeCheckTable").empty().append(html);
                                        //空白tr补齐表格
                                        if($("#exchangeCheckTable tbody tr").length<11){
                                            html = '';
                                            var count = 11-$("#exchangeCheckTable tbody tr").length;
                                            var columns = 6;
                                            for(var m=0;m<count;m++){
                                                html+='<tr>';
                                                for(var n=0;n<columns;n++){
                                                    html+="<td></td>";
                                                }
                                                html+="</tr>";
                                            }
                                            $("#exchangeCheckTable tbody").append(html);
                                        }
                                        cur+=1;
                                        $("#exchangeApplyPage .cur").text(cur);
                                    }

                                })
                                $("#exchangeApplyPage .prev").off('click').on('click',function(){
                                    if(cur>1){
                                        var j =0;
                                        var html = '<tr><th>提交日期</th><th>工资号</th><th>姓名</th><th>申请类型</th><th>申请表详情</th><th>操作</th></tr>';
                                        for(var i in data){
                                            if(j>10*(cur-2)-1 && j<10*(cur-1) && i ){
                                                j++;
                                                html += '<tr>';
                                                for(var m in data[i]){
                                                    html += '<td>'+data[i][m]+'</td>';
                                                }
                                                html += '<td><span class="seeInfo">查看详情</span></td>';
                                                html += '<td><span class="pass"></span><span class="reject"></span></td>';
                                                html += '</tr>'
                                            }else{
                                                j++;
                                            }
                                        }
                                        $("#exchangeCheckTable").empty().append(html);
                                        cur-=1;
                                        $("#exchangeApplyPage .cur").text(cur);
                                    }

                                })
                            }

                        }else{
                            alert('暂无换证申请信息');
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
            //这里尚未添加教育科人员的审核申请界面
            if(power === 'V'){

            }
        });
        $("#fixApplyCheck").off('click').on('click',function(){
            $(this).css({'background':'#ddd','fontWeight':'bold'}).siblings('div').css({'background':'inherit','fontWeight':'normal'});
            $("#fixApplyContent").css('zIndex',999).siblings('div').css('zIndex',1);
            if(power === '1'){
                //添加目前正在进行车间审核的补证申请
                var obj = {};
                obj.where = ' where checkStatus = \'车间审核中\' AND changeType = \'补证\'';
                obj.column = ' lotNumber,payId,UName,changeType ';
                obj.order = ' order by lotNumber ';
                var ajaxTimeOut = $.ajax({
                    url: "../../../index.php",
                    type:"POST",
                    timeout:8000,
                    //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                    data:{funcName:'select',where:obj.where,serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                        tableName:' bgxx ',column:obj.column,order:obj.order},
                    dataType:'json',
                    success:function(data){
                        if(data['success'] === 1){
                            delete data['success'];
                            var count = data['count'];
                            delete data['count'];
                            var html = '<tr><th>提交日期</th><th>工资号</th><th>姓名</th><th>申请类型</th><th>申请表详情</th><th>操作</th></tr>';
                            if(count<11){
                                for(var i in data){
                                    html += '<tr>';
                                    for(var j in data[i]){
                                        html += '<td>'+data[i][j]+'</td>';
                                    }
                                    html+= '<td><span class="seeInfo">查看详情</span></td>';
                                    html += '<td><span class="pass"></span><span class="reject"></span></td>';
                                    html += '</tr>'
                                }
                                $("#fixCheckTable").empty().append(html);
                                boundCheckEvent(power);
                                //空白tr补齐表格
                                if($("#fixCheckTable tbody tr").length<11){
                                    html = '';
                                    var count = 11-$("#fixCheckTable tbody tr").length;
                                    var columns = 6;
                                    for(var m=0;m<count;m++){
                                        html+='<tr>';
                                        for(var n=0;n<columns;n++){
                                            html+="<td></td>";
                                        }
                                        html+="</tr>";
                                    }
                                    $("#fixCheckTable tbody").append(html);
                                }
                            }else{
                                var q =0;
                                var cur =1;
                                var total = Math.ceil(count/10);
                                $("#fixApplyPage").css("display",'block');
                                for(var i in data){
                                    html += '<tr>';
                                    for(var j in data[i]){
                                        html += '<td>'+data[i][j]+'</td>';
                                    }
                                    html += '<td><span class="seeInfo">查看详情</span></td>';
                                    html += '<td><span class="pass"></span><span class="reject"></span></td>';
                                    html += '</tr>'
                                    q+=1;
                                    if(q>9){
                                        break
                                    }
                                }
                                $("#fixCheckTable").empty().append(html);
                                boundCheckEvent(power);
                                $("#fixApplyPage .cur").text(cur);
                                $("#fixApplyPage .total").text(total);
                                $("#fixApplyPage .next").off('click').on('click',function(){
                                    if(cur<total){
                                        var j =0;
                                        var html = '<tr><th>提交日期</th><th>工资号</th><th>姓名</th><th>申请类型</th><th>申请表详情</th><th>操作</th></tr>';
                                        for(var i in data){
                                            if(j>10*cur-1 && j<10*(cur+1) && i ){
                                                j++;
                                                html += '<tr>';
                                                for(var m in data[i]){
                                                    html += '<td>'+data[i][m]+'</td>';
                                                }
                                                html += '<td><span class="seeInfo">查看详情</span></td>';
                                                html += '<td><span class="pass"></span><span class="reject"></span></td>';
                                                html += '</tr>'
                                            }else{
                                                j++;
                                            }
                                        }
                                        $("#fixCheckTable").empty().append(html);
                                        boundCheckEvent(power);
                                        //空白tr补齐表格
                                        if($("#fixCheckTable tbody tr").length<11){
                                            html = '';
                                            var count = 11-$("#fixCheckTable tbody tr").length;
                                            var columns = 6;
                                            for(var m=0;m<count;m++){
                                                html+='<tr>';
                                                for(var n=0;n<columns;n++){
                                                    html+="<td></td>";
                                                }
                                                html+="</tr>";
                                            }
                                            $("#fixCheckTable tbody").append(html);
                                        }
                                        cur+=1;
                                        $("#fixApplyPage .cur").text(cur);
                                    }

                                })
                                $("#fixApplyPage .prev").off('click').on('click',function(){
                                    if(cur>1){
                                        var j =0;
                                        var html = '<tr><th>提交日期</th><th>工资号</th><th>姓名</th><th>申请类型</th><th>申请表详情</th><th>操作</th></tr>';
                                        for(var i in data){
                                            if(j>10*(cur-2)-1 && j<10*(cur-1) && i ){
                                                j++;
                                                html += '<tr>';
                                                for(var m in data[i]){
                                                    html += '<td>'+data[i][m]+'</td>';
                                                }
                                                html += '<td><span class="seeInfo">查看详情</span></td>';
                                                html += '<td><span class="pass"></span><span class="reject"></span></td>';
                                                html += '</tr>'
                                            }else{
                                                j++;
                                            }
                                        }
                                        $("#fixCheckTable").empty().append(html);
                                        boundCheckEvent(power);
                                        cur-=1;
                                        $("#fixApplyPage .cur").text(cur);
                                    }

                                })
                            }

                        }else{
                            alert('暂无补证申请信息');
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
            //这里尚未添加教育科人员的审核申请界面
            if(power === 'V'){

            }
        });

    }

    function boundCheckEvent(power){
        var payId='';
        var lotNumber = '';
        var changeType = '';
        var setStr = '';
        var where = '';
        if(power === '1'){
            //在这里面定义一些变量用来存放数据库字段，节省代码
        }
        $("#fixCheckTable .seeInfo").off('click').on('click',function(){
            console.log(1)
        })
        $("#fixCheckTable .pass").off('click').on('click',function(){
            payId = $(this).parent().prev().prev().prev().prev().text();
            lotNumber = $(this).parent().prev().prev().prev().prev().prev().text();
            changeType = $(this).parent().prev().prev().text();
            setStr = 'checkStatus = \'教育科审核中\'';
            where = ' where payid = \''+payId+'\' and lotNumber = \''+lotNumber+'\' and changeType =\''+changeType+'\'';
            $.ajax({
                url: "../../../index.php",
                type: "POST",
                timeout: 8000,
                data: {
                    funcName: 'update', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                    tableName: ' bgxx', setStr: setStr, where: where
                },
                dataType: 'json',
                success: function (data) {

                }
            })
            console.log()
        })
        $("#fixCheckTable .reject").off('click').on('click',function(){

            console.log($(this).parent().prev().prev().prev().prev())
        })
    }




    //给左边的按钮添加事件，更新右边容器的内容
    $("#buttonList li").each(function () {
        $(this).on('click', displayContainer);
    });


    //以下是普通用户所用函数
    //普通用户渲染页面的函数
    function normalUser() {
        var payId = sessionGet('payId');
        //在这里添加动态渲染页面的代码，根据payid取驾驶证信息
        $.ajax({
            url: "../../../index.php",
            type: "POST",
            data: {
                funcName: 'getInfo', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                tableName: 'jbxx', column: ' * ', where: ' where payId = \'' + payId + '\''
            },
            dataType: 'json',
            success: function (data) {

                var html = '<img style=\"width:100%;height:200px;\" src=\'' + data['row']['cardPath'] + '\'/>';

                $("#cardPicContent").append(html);
                $("#cardInfoContent .name").text(data['row']['UName']);
                $("#cardInfoContent .birth").text(data['row']['BirthDate']);
                $("#cardInfoContent .startDate").text(data['row']['startDate']);
                $("#cardInfoContent .deadline").text(data['row']['deadline']);
                $("#cardInfoContent .sjDate").text(data['row']['sjDate']);
                //$("#cardInfoContent .?").text(data['row']['deadline']);
            }
        })
        $.ajax({
            url: "../../../index.php",
            type: "POST",
            data: {
                funcName: 'getInfo', serverName: '10.101.62.62', uid: 'sa', pwd: '2huj15h1', Database: 'userinfo',
                tableName: 'userinfo1', column: ' cardid ', where: ' where payId = \'' + payId + '\''
            },
            dataType: 'json',
            success: function (data) {
                $("#cardInfoContent .idCard").text(data['row']['cardid']);
            }
        })
    }

    //点击补证按钮，生成表格，发送请求
    $("#fixButton").off('click').on('click', function () {
        if (confirm('是否确定要申请补发驾驶证？\u000d请注意，发出申请不可修改，请谨慎操作！')) {
            var payId = sessionGet('payId');
            var ajaxTimeOut = $.ajax({
                url: "../../../index.php",
                type: "POST",
                timeout: 8000,
                data: {
                    funcName: 'checkIfExist',
                    serverName: '10.101.62.73',
                    uid: 'sa',
                    pwd: '2huj15h1',
                    Database: 'JSZGL',
                    tableName: 'bgxx',
                    column: 'payId,finishStatus,changeType',
                    where: ' where payId = \'' + payId + '\' AND finishStatus != \'ffdgr\'',
                    order: ' '
                },
                dataType: 'json',
                success: function (data) {
                    //说明此人有待办的申请，不予新增请求
                    if (data['success'] === 1) {
                        alert('您还有尚未完结的' + data['changeType'] + '申请,不允许重复提交')
                    } else {
                        $("#fixButton").css('display', 'none');
                        $("#fixTable").css('visibility', 'visible');
                        $("#print").css('visibility', 'visible');
                        $("#applySubmit").css('visibility', 'visible');
                        $("#rightContent").css('width', '84%');
                        $(".operateContent").css('margin', 0);
                        getUserinfo();
                    }
                },
                beforeSend: function () {
                    testSession(userSessionInfo);
                    loadingPicOpen();
                },
                complete: function (XMLHttpRequest, status) {
                    loadingPicClose();
                    if (status === 'timeout') {
                        ajaxTimeOut.abort();    // 超时后中断请求
                        alert('网络超时，请检查网络连接');
                    }
                }
            })
        }
    })

    //从全员信息库中取申请表要用的信息
    function getUserinfo() {
        var payId = sessionGet('payId');
        var ajaxTimeOut = $.ajax({
            url: "../../../index.php",
            type: "POST",
            timeout: 8000,
            data: {
                funcName: 'getInfo',
                serverName: '10.101.62.62',
                uid: 'sa',
                pwd: '2huj15h1',
                Database: 'USERINFO',
                tableName: 'userinfo1',
                column: ' uname,sex,birthdate,cardid,phone1,address,archivesId ',
                where: ' where payId = \'' + payId + '\'',
                order: ' '
            },
            dataType: 'json',
            success: function (data) {
                $.ajax({
                    url: "../../../index.php",
                    type: "POST",
                    timeout: 8000,
                    data: {
                        funcName: 'getInfo', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                        tableName: 'jbxx', column: ' * ', where: ' where payId = \'' + payId + '\'', order: ' '
                    },
                    dataType: 'json',
                    success: function (cardData) {
                        fillInTable(data['row'], cardData['row']);
                    }
                });
            },
            beforeSend: function () {
                //在where字段后加入用户选择的车间范围
                testSession(userSessionInfo);
                loadingPicOpen();
            },
            complete: function (XMLHttpRequest, status) {
                loadingPicClose();
                if (status === 'timeout') {
                    ajaxTimeOut.abort();    // 超时后中断请求
                    alert('网络超时，请检查网络连接');
                }
            }
        })
    }

    //用取回的信息渲染补证申请表
    function fillInTable(data, cardData) {
        var cardId = [];
        cardData['sjDriveCode'] = 'J1';
        cardData['sjDate'] = '1994-12-12';
        //用从全员信息库取出的数据填写基本信息
        for (var i = 0; i < data['cardid'].length; i++) {
            cardId[i] = data['cardid'][i];
            $(".cardIdInTable:eq(" + i + ")").text(cardId[i]);
        }
        $("#nameInTable").text(data['uname']);
        $("#sexInTable").text(data['sex']);
        $("#birthYearInTable").text(data['birthdate'].split('-')[0]);
        $("#birthMonthInTable").text(data['birthdate'].split('-')[1]);
        $("#birthDateInTable").text(data['birthdate'].split('-')[2]);
        $("#mobilePhoneInTable").val(data['phone1']);
        $("#companyInTable").text('郑州局集团');
        $("#addressInTable").val(data['address']);
        $("#mailInTable").val(410000);
        $("#changeCheckBox").attr("disabled", true);
        $("#fixCheckBox").attr({"disabled": true, "checked": "checked"});
        //填写驾驶证信息
        $("#origin" + cardData['sjDriveCode']).attr({
            'checked': 'checked',
            'disabled': true
        }).siblings('input').attr('disabled', true);
        $("#apply" + cardData['sjDriveCode']).attr({
            'checked': 'checked',
            'disabled': true
        }).siblings('input').attr('disabled', true);
        $("#phyOk").attr({'checked': 'checked', 'disabled': true}).siblings('input').attr('disabled', true);
        $("#cardLost").attr({
            'checked': 'checked',
            'disabled': true
        }).parent('div').siblings('div').children('input').attr('disabled', true);
        $("#originYearInTable").text(cardData['sjDate'].split('-')[0]);
        $("#originMonthInTable").text(cardData['sjDate'].split('-')[1]);
        $("#originDateInTable").text(cardData['sjDate'].split('-')[2]);


        //添加提交事件
        $("#applySubmit").off('click').on('click', function () {
            if (confirm('请确认提交内容真实有效且正确无误！提交请点“确定”，返回请点“取消”')) {
                appendFixApply(data, cardData, csData);
            }
        })
        $("#print").off('click').on('click', print);
    }

    //用户提交补证申请，发ajax更新bgxx表,在jbxx表中将此人证件的status改为丢失或损毁
    //并在sqxx表中插入该条申请的信息
    function appendFixApply(data, cardData, csData) {
        var payId = sessionGet('payId');
        var department = sessionGet('department');
        var UName = sessionGet('user');
        var cardId = data['cardid'];
        var archivesId = data['archivesId'];
        var changeType = csData['czlb-bz']['nr2'];
        //以下变量用来更新jbxx表
        var status = csData['zjzt-ds']['nr2'];
        var where = ' where payid = \'' + payId + '\'';

        if ($("#cardLost").attr('checked')) {
            var changeReason = csData['bzyy-jszds']['nr2'];
        } else if ($("#cardBreak").attr('checked')) {
            var changeReason = csData['bzyy-jszsh']['nr2'];
        }
        var driveCode = $(".origin input:checked").next('label').text();
        if (driveCode === '其他（') {
            driveCode = $("#originOtherInput").val()
        }
        var drive = csData['zjlx-' + driveCode]['nr1'];
        var phyTest = $(".phyCheck input:checked").next('label').text();
        var needed = csData['needed-hbzsqb']['nr2'] + ',' + csData['needed-jszdszm']['nr2'];
        var checkStatus = csData['checkStatus-cjshz']['nr2'];
        var lotNumber = new Date();
        lotNumber.month = lotNumber.getMonth() < 9 ? '0' + (lotNumber.getMonth() + 1) : lotNumber.getMonth() + 1;
        lotNumber.date = lotNumber.getDate() < 10 ? '0' + lotNumber.getDate() : lotNumber.getDate();
        lotNumber = lotNumber.getFullYear() + '-' + lotNumber.month + '-' + lotNumber.date;
        var ajaxTimeOut = $.ajax({
            url: "../../../index.php",
            type: "POST",
            timeout: 8000,
            data: {
                funcName: 'insertFixApply',
                serverName: '10.101.62.73',
                uid: 'sa',
                pwd: '2huj15h1',
                Database: 'jszgl',
                tableName: ' bgxx',
                column: ' (id,lotNumber,Department,payId,archivesId,UName,cardId,changeType,changeReason,' +
                'driveCode,drive,phyTest,needed,checkStatus)',
                values: '(getDate(),\'' + lotNumber + '\',\'' + department + '\',\'' + payId + '\',\'' + archivesId + '\',\'' + UName + '\',\'' + cardId + '\',\'' + changeType + '\',\''
                + changeReason + '\',\'' + driveCode + '\',\'' + drive + '\',\'' + phyTest + '\',\'' + needed + '\',\'' + checkStatus + '\')'
            },
            dataType: 'json',
            success: function () {
                $("#applySubmit").css('display', 'none')
                alert('您的补证申请提交成功，请联系车间开具《驾驶证丢失证明》')
            },
            beforeSend: function () {
                //在where字段后加入用户选择的车间范围
                testSession(userSessionInfo);
                loadingPicOpen();
            },
            complete: function (XMLHttpRequest, status) {
                loadingPicClose();
                if (status === 'timeout') {
                    ajaxTimeOut.abort();    // 超时后中断请求
                    alert('网络超时，请检查网络连接');
                }
            }
        })
        //在这里填入要更新的列名：数组；列的值：数组。必须一一对应，长度相同。
        var columnArr = ['status'];
        var valuesArr = [status];
        var setStr = '';
        for (var i = 0; i < columnArr.length; i++) {
            setStr += columnArr[i] + '=' + '\'' + valuesArr[i] + '\'' + ','
        }
        //该变量是update语句中set后面的句段
        setStr = setStr.substring(0, setStr.length - 1);
        $.ajax({
            url: "../../../index.php",
            type: "POST",
            timeout: 8000,
            data: {
                funcName: 'update', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                tableName: ' jbxx', setStr: setStr, where: where
            },
            dataType: 'json',
            success: function (data) {

            }
        })
        //插入sqxx表
        var sex = $("#sexInTable").text();
        var applyDriveCode = $(".apply input:checked").next('label').text();
        var fixedPhone = $("#fixedPhoneInTable").val();
        var mobilePhone = $("#mobilePhoneInTable").val();
        var company = $("#companyInTable").text();
        var address = $("#addressInTable").val();
        var mail = $("#mailInTable").val();
        var date = new Date();
        date.month = date.getMonth() < 9 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
        date.date = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
        date = date.getFullYear() + '-' + date.month + '-' + date.date;
        var sjDate = $("#originYearInTable").text()+'-'+$("#originMonthInTable").text()+'-'+$("#originDateInTable").text();
        $.ajax({
            url: "../../../index.php",
            type: "POST",
            timeout: 8000,
            data: {
                funcName: 'insertFixApply',
                serverName: '10.101.62.73',
                uid: 'sa',
                pwd: '2huj15h1',
                Database: 'jszgl',
                tableName: ' sqxx',
                column: ' (date,Department,payId,UName,sex,cardId,changeType,changeReason,' +
                'driveCode,applyDriveCode,phyTest,fixedPhone,mobilePhone,company,address,mail,sjDate)',
                values: '(\''+date+'\',\''+department + '\',\'' + payId + '\',\'' + UName + '\',\''+sex+'\',\'' + cardId + '\',\'' + changeType + '\',\''
                + changeReason + '\',\'' + driveCode + '\',\'' + applyDriveCode + '\',\'' + phyTest + '\',\'' + fixedPhone + '\',\'' + mobilePhone + '\',\''+company
                +'\',\''+address+'\',\''+mail+'\',\''+sjDate+'\')'
            },
            dataType: 'json',
            success: function (data) {
                console.log(data)
            }
        })
    }

    //打印
    function print() {
        var html = $("#bigContent #rightContent .operateContent #applyContainer #fixTable");
        console.log(html)
        $("body").empty().append(html);
        alert('请根据您的分辨率调整页面大小及页边距以获得更好的打印效果');
        window.print()
        location.reload()
    }

    //查询证件状态
    function checkCardStatus(csData) {
        var payId = sessionGet('payId');
        $.ajax({
            url: "../../../index.php",
            type: "POST",
            timeout: 8000,
            data: {
                funcName: 'getInfo',
                serverName: '10.101.62.73',
                uid: 'sa',
                pwd: '2huj15h1',
                Database: 'jszgl',
                tableName: 'jbxx',
                column: ' uname,status,remainingDays ',
                where: ' where payId = \'' + payId + '\'',
                order: ' '
            },
            dataType: 'json',
            success: function (data) {
                $("#firstName").text(data['row']['uname'][0]);
                $("#cardStatus").text(data['row']['status']).css({'color': 'red', 'fontWeight': 'bold'})
                if (data['row']['status'] === '预警' || data['row']['status'] === '过期') {
                    $("#alert").text('请及时换证或重新参加考试').css({'color': 'red', 'fontWeight': 'bold'})
                }
            }
        });
        $.ajax({
            url: "../../../index.php",
            type: "POST",
            timeout: 8000,
            data: {
                funcName: 'getInfo',
                serverName: '10.101.62.73',
                uid: 'sa',
                pwd: '2huj15h1',
                Database: 'jszgl',
                tableName: 'bgxx',
                column: ' * ',
                where: ' where payId = \'' + payId + '\' AND finishStatus != \'发放到个人\'',
                order: ' '
            },
            dataType: 'json',
            success: function (data) {
                if (data['success'] == 1) {
                    //换证补证，执行以下
                    if (data['row']['changeType'] === csData['czlb-fyxqmhz']['nr2'] || data['row']['changeType'] === csData['czlb-yxqmhz']['nr2'] || data['row']['changeType'] === csData['czlb-bz']['nr2']) {
                        $("#applyInfo").empty().append('您有一项未完结的 ' + data['row']['changeType'] + ' 申请，')
                        $("#applyInfo").append('<span id="checkStatus"></span>\n' +
                            '                    <span id="finishStatus"></span>\n' +
                            '                    <span id="needed"></span>')
                        //审核未通过，执行以下
                        if (data['row']['checkStatus'] === csData['checkStatus-shwtg']['nr2']) {
                            $("#checkStatus").empty().append('审核状态为：' + data['row']['checkStatus'] + '原因是：' + data['row']['failedReason']);
                        }//审核中，执行以下
                        else {
                            $("#checkStatus").empty().append('审核状态为：' + data['row']['checkStatus']);
                            $("#finishStatus").empty().append('，发放状态为：' + data['row']['finishStatus'])
                            if (data['row']['changeType'] === csData['czlb-fyxqmhz']['nr2'] || data['row']['changeType'] === csData['czlb-yxqmhz']['nr2']) {
                                $("#needed").empty().append('您需准备如下材料：' + csData['needed-hbzsqb']['nr2'] + '、' + csData['needed-tjhgbg']['nr2']);
                            } else if (data['row']['changeType'] === csData['czlb-bz']['nr2']) {
                                $("#needed").empty().append('您需准备如下材料：' + csData['needed-hbzsqb']['nr2'] + '、' + csData['needed-jszdszm']['nr2']);
                            }
                        }
                        //新增，执行以下
                    } else if (data['row']['changeType'] === csData['czlb-diaoru']['nr2'] || data['row']['changeType'] === csData['czlb-levelup1']['nr2'] || data['row']['changeType'] === csData['czlb-levelup2']['nr2']) {
                        $("#applyInfo").prepend('您需新发驾驶证');
                        $("#checkStatus").empty().append('审核状态为：' + data['row']['checkStatus']);
                        $("#finishStatus").empty().append('，发放状态为：' + data['row']['finishStatus'])
                    }


                }


            }
        });

    }

    //图片上传功能。
    $("#cardSubmit").off('click').on('click', function () {
        var payId = sessionGet('payId');
        var uname = sessionGet('user');
        //取用户身份证号
        var ajaxTimeOut1 = $.ajax({
            url: "../../../index.php",
            type: "POST",
            timeout: 8000,
            data: {
                funcName: 'getInfo', serverName: '10.101.62.62', uid: 'sa', pwd: '2huj15h1', Database: 'USERINFO',
                tableName: 'userinfo1', column: ' cardid ', where: ' where payId = \'' + payId + '\'', order: ' '
            },
            dataType: 'json',
            success: function (data) {
                var cardId = data['row']['cardid'];
                var fileCard = document.getElementById('cardInput');
                var formData = new FormData($("#cardForm")[0]);
                var path = uname + cardId + '驾驶证' + '.jpg';
                var setStr = 'cardPath = \'..' + '/' + 'images' + '/' + 'userPic' + '/' + path + '\'';
                //该变量是update语句中set后面的句段

                formData.append("file", fileCard);
                formData.append("uname", uname);
                formData.append("cardId", cardId);
                formData.append("serverName", '10.101.62.73');
                formData.append("uid", 'sa');
                formData.append("pwd", '2huj15h1');
                formData.append("Database", 'JSZGL');
                formData.append("tableName", 'jbxx');
                formData.append("where", ' where ' + ' payId = \'' + payId + '\'');
                formData.append("setStr", setStr);
                if (fileCard.value === "" || fileCard.size <= 0) {
                    alert("请选择图片");
                    return;
                }
                $.ajax({
                    url: "../../../storeImg.php",
                    type: "POST",
                    data: formData,
                    dataType: 'json',
                    processData: false,
                    contentType: false,
                    cache: false,
                    success: function (data) {
                        console.log(data);
                        if (data['success'] === 1) {
                            alert('驾驶证上传成功');
                            $("#cardInput").val('');
                            $('#cardPreview').css('display', 'none');
                        }

                    }
                })


            },
            beforeSend: function () {
                //在where字段后加入用户选择的车间范围
                testSession(userSessionInfo);
                loadingPicOpen();
            },
            complete: function (XMLHttpRequest, status) {
                loadingPicClose();
                if (status === 'timeout') {
                    ajaxTimeOut1.abort();    // 超时后中断请求
                    alert('网络超时，请检查网络连接');
                }
            }
        })
    });
    $("#photoSubmit").off('click').on('click', function () {
        var payId = sessionGet('payId');
        var uname = sessionGet('user');
        //取用户身份证号
        var ajaxTimeOut1 = $.ajax({
            url: "../../../index.php",
            type: "POST",
            timeout: 8000,
            data: {
                funcName: 'getInfo', serverName: '10.101.62.62', uid: 'sa', pwd: '2huj15h1', Database: 'USERINFO',
                tableName: 'userinfo1', column: ' cardid ', where: ' where payId = \'' + payId + '\'', order: ' '
            },
            dataType: 'json',
            success: function (data) {
                var cardId = data['row']['cardid'];

                var filePhoto = document.getElementById('photoInput');
                var formData2 = new FormData($("#photoForm")[0]);

                var path = uname + cardId + '电子照' + $("#photoInput").val().substring($("#photoInput").val().lastIndexOf("."));
                var setStr = 'photoPath = \'..' + '/' + 'images' + '/' + 'userPic' + '/' + path + '\'';
                //该变量是update语句中set后面的句段

                formData2.append("file", filePhoto);
                formData2.append("uname", uname);
                formData2.append("cardId", cardId);
                formData2.append("serverName", '10.101.62.73');
                formData2.append("uid", 'sa');
                formData2.append("pwd", '2huj15h1');
                formData2.append("Database", 'JSZGL');
                formData2.append("tableName", 'jbxx');
                formData2.append("where", ' where ' + ' payId = \'' + payId + '\'');
                formData2.append("setStr", setStr);
                if (filePhoto.value === "" || filePhoto.size <= 0) {
                    alert("请选择图片");
                    return;
                }

                $.ajax({
                    url: "../../../storePhoto.php",
                    type: "POST",
                    data: formData2,
                    dataType: 'json',
                    processData: false,
                    contentType: false,
                    cache: false,
                    success: function (data) {
                        if (data['success'] === 1) {
                            alert('电子照上传成功');
                            $("#photoInput").val('');
                            $('#photoPreview').css('display', 'none');
                        }

                    }
                })


            },
            beforeSend: function () {
                //在where字段后加入用户选择的车间范围
                testSession(userSessionInfo);
                loadingPicOpen();
            },
            complete: function (XMLHttpRequest, status) {
                loadingPicClose();
                if (status === 'timeout') {
                    ajaxTimeOut1.abort();    // 超时后中断请求
                    alert('网络超时，请检查网络连接');
                }
            }
        })
    })



    //渲染页面中需要动态添加的元素(高级搜索中的checkbox)
    appendElement()

    //添加用户高级搜索的选项
    appendSelection();
    $('#column').off('change').on('change', appendSelection);


    //绑定“更多”按钮事件
    $("#more").off('click').on('click', function () {
        if ($("#querySelectBanner").attr('class') === 'less') {
            $("#querySelectBanner").dequeue().animate({'height': '0'}, 700, function () {
                $("#querySelectBanner").attr('class', 'more');
                $("#more").text('更多...');
            });
        } else {
            $("#querySelectBanner").dequeue().animate({'height': '200px'}, 700, function () {
                $("#querySelectBanner").attr('class', 'less');
                $("#more").text('收起');
            });
        }

    });

})