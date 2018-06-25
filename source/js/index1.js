$(document).ready(function() {
    var queryCardButton = document.getElementById("queryCardButton");
    initialScreen();
    loginStatus();
    //记住登录时的session
    userSessionInfo = rememberSession('token', 'user', 'power', 'department','payId');
    //证件查询按钮的事件,调用displayQueryForm函数
    eventBound(queryCardButton, 'click', displayQueryForm);



    //取公用参数信息
    var csData = $.ajax({
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
            //取回参数信息，继续下面的代码
            //以下函数都是需要参数信息的
            console.log(csData)
            //根据用户的权限来显示左边的li内容
            appendLi(sessionGet('power'),csData)
            //给左边的按钮添加事件，更新右边容器的内容
            $("#buttonList li").each(function () {
                $(this).on('click', displayContainer);
            });
            //查询证件状态
            $("li.statusButton").on('click', function () {
                displayContainer
                checkCardStatus(csData);
            })
            //添加预警信息
            appendAlert(csData)
            //添加证件调整的select选择车间
            var html='';
            var _html='';
            for(var i in csData){
                if(csData[i]['lb'] === 'ssbm'){
                    html += '<option>'+csData[i]['nr2']+'</option>'
                }else if(csData[i]['lb'] === 'zxyy'){
                    _html += '<option>'+csData[i]['nr2']+'</option>'
                }
            }
            $("#editFixSelect").append(html)
            $("#logOutReason").append(_html)
        }
    });

    //主页面单击左边li显示右边内容的函数，注销功能也在这里实现
    function displayContainer(){
        var power = sessionGet('power');
        if(power === 'V' || power==='1'){
            //教育科管理人员或车间管理人员
            var index = $(this).index();
            if($(this).next().length>0){
                $("#rightContent .operateContent>div:eq("+index+")").css('display','block').siblings().css('display','none');

                switch ($(this).text()){
                    case '预警信息':
                        appendAlert(csData);
                        $('.redPoint').remove()
                    case '数据统计':
                        appendTJxx(csData);
                    case '证件发放':
                        appendGiveOut(csData);
                }

            }else{
                //最后一个按钮退出系统
                if(confirm("确定要退出系统？")){
                    sessionClear();
                    window.location.href = '../html/login.html'
                }
            }
        }else if(power === '0'){
            //把页面中前7个教育科人员使用的div跳过
            var jykUse = $('.jykUse').length;
            var index_plus = $(this).index()+jykUse;
            if($(this).next().length>0){
                $("#rightContent .operateContent>div:eq("+index_plus+")").css('display','block').siblings().css('display','none');
            }else{
                //最后一个按钮退出系统
                if(confirm("确定要退出系统？")){
                    sessionClear();
                    window.location.href = '../html/login.html'
                }
            }
        }

    }

    function appendLi(power,csData) {
        var html = '';
        if (power === 'V') {//这里填管理员的权限
            html = '<li class=\"appendButton\">证件添加</li><li class=\"queryButton\">证件查询</li><li class=\"dataButton\">数据统计</li><li class=\"checkButton\">申请审核</li>' +
                '<li class="alertButton">预警信息<span class="redPoint"></span></li><li class="giveOutButton">证件发放</li><li class="editButton">证件调整</li><li class="cancelButton">证件注销</li><li class="logOutButton">退出系统</li>'
            $("#buttonList").append(html);
            appendQueryElement(power);
            appendApplyCheck(power,csData);
        } else if (power === '1') {//这里填车间管理人员的权限
            html = '<li class=\"queryButton\">证件查询</li><li class=\"dataButton\">数据统计</li><li class=\"checkButton\">申请审核</li>' +
                '<li class="alertButton">预警信息<span class="redPoint"></span></li><li class="giveOutButton">证件发放</li><li class="logOutButton">退出系统</li>';
            $("#buttonList").append(html);
            //车间管理人员没有添加和注销功能，移除相应区域
            $("#appendContainer").remove();
            $("#cancelContainer").remove();
            appendQueryElement(power);
            appendApplyCheck(power,csData);
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

    //证件调整
    $("#editBanner .queryButton").off('click').on('click',function(){
        if(sessionGet('power') === 'V'){
            if($("#editBanner .queryInput").val().match(/^[0-9]{5}$/)){
                var payid = $("#editBanner .queryInput").val();
                var column = ' *';
                var ajaxTimeOut = $.ajax({
                    url: "../../../index.php",
                    type:"POST",
                    timeout:8000,
                    //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                    data:{funcName:'select',where:' where payid =\''+payid+'\'',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                        tableName:' jbxx ',column:column,order:' '},
                    dataType:'json',
                    success:function(data) {
                        if(data['success'] ===1){
                            $('#editContainer .queryInfoContent').css('display','block')
                            $('.queryInfoContent .queryPicInfo img').prop('src',data['row1']['cardPath']);
                            $('.queryInfoContent .queryInfo .payIdInput').val(data['row1']['PayId']);
                            $('.queryInfoContent .queryInfo .name').text(data['row1']['UName']);
                            $('.queryInfoContent .queryInfo .department').text(data['row1']['Department'].split(',')[0]);
                            $('.queryInfoContent .queryInfo .birth').text(data['row1']['BirthDate']);
                            $('.queryInfoContent .queryInfo .sjDateInput').val(data['row1']['sjDate']);
                            $('.queryInfoContent .queryInfo .sjRemark').text(data['row1']['sjRemark']);
                            $('.queryInfoContent .queryInfo .yearlyCheckInput').val(data['row1']['yearlyCheckDate']);
                            $('.queryInfoContent .queryInfo .driveCodeInput').val(data['row1']['sjDriveCode']);
                            $('.queryInfoContent .queryInfo .driveTypeInput').val(data['row1']['sjDriveType']);
                            $('.queryInfoContent .queryInfo .startDateInput').val(data['row1']['startDate']);
                            $('.queryInfoContent .queryInfo .deadlineInput').val(data['row1']['deadline']);
                            $(".queryInfoContent .queryInfo input").prop('disabled',true)
                            $(".editButtonBanner").css('display','block')
                            boundEditEvent(data['row1'])
                        }else{
                            alert('您查询的信息不存在')
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
            }else{
                alert('请输入正确的工资号')
                $("#editBanner .queryInput").focus().css('backgroundColor','#ffcccc');
            }
        }
    })
    //证件调整的按钮事件
    function boundEditEvent(data){
        var payId = $('.queryInput').val();
        var flag = true;
        //车间转调按钮
        $('.cjEdit').off('click').on('click',function(){
            $("#editContainer .textContent .name").text($(".queryInfo .name").text())
            $("#editContainer .textContent").css('display','block');
            $("#editFixSelect").off('change').on('change',function(){
                if(confirm('确认要将'+$(".queryInfo .name").text()+'的关系调入'+$(this).val().split(',')[0]+'？')){
                    var setStr =' department =\''+$(this).val()+'\' ';
                    var where =' where payId =\''+$('.queryInfo .payIdInput').val()+'\'';
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
                            $(".textContent").css('display','none')
                            alert('操作成功')
                        }
                    })
                }
            })
        })
        //人员调出按钮
        $('.rydc').off('click').on('click',function(){
            if(confirm('（注意！请在确认该人员已调出本段的情况下进行调出操作）\u000d'+'确认'+$(".queryInfo .name").text()+'师傅已调出？')){
                var where =' where payId =\''+$('.queryInfo .payIdInput').val()+'\'';
                var setStr = 'status =\''+csData['zjzt-dc']['nr2']+'\''
                $.ajax({
                    url: "../../../index.php",
                    type: "POST",
                    timeout: 8000,
                    data: {
                        funcName: 'update', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                        tableName: ' jbxx',setStr:setStr, where: where
                    },
                    dataType: 'json',
                    success: function () {
                        var lotNumber = new Date();
                        lotNumber.month = lotNumber.getMonth() < 9 ? '0' + (lotNumber.getMonth() + 1) : lotNumber.getMonth() + 1;
                        lotNumber.date = lotNumber.getDate() < 10 ? '0' + lotNumber.getDate() : lotNumber.getDate();
                        lotNumber = lotNumber.getFullYear() + '-' + lotNumber.month + '-' + lotNumber.date;
                        $.ajax({
                            url: "../../../index.php",
                            type: "POST",
                            timeout: 8000,
                            data: {
                                funcName: 'insert',
                                serverName: '10.101.62.73',
                                uid: 'sa',
                                pwd: '2huj15h1',
                                Database: 'jszgl',
                                tableName: ' bgxx',
                                column: ' (id,lotNumber,Department,payId,archivesId,UName,changeType,' +
                                'driveCode,drive,jykOperator)',
                                values: '(getDate(),\'' + lotNumber + '\',\'' + data['Department'] + '\',\'' + data['PayId'] + '\',\'' + data['ArchivesId'] + '\',\'' + data['UName'] + '\',\'' + csData['czlb-dc']['nr2'] +
                                 '\',\'' + data['sjDriveCode'] + '\',\'' + data['sjDriveType'] + '\',\''+sessionGet('user')+'\')'
                            },
                            dataType: 'json',
                            success: function (ret) {
                                console.log(ret)
                                alert('操作成功。该证件的状态目前为：'+csData['zjzt-dc']['nr2']);
                            }
                        })
                    }
                })
            }

        })
        //信息更正按钮
        $('.infoFix').off('click').on('click',function(){
            var arr =[];
            var j=0;
            for(var i in csData){
                if(csData[i]['lb'] === 'zjlx'){
                    arr[j] = csData[i]['name'];
                    j++;
                }
            }

            if($(this).text() === '信息更正'){
                alert('您现在可以对人员部分信息进行更正');
                $(this).text('确认更改').css({'color':'GREEN','fontWeight':'bold'})
                $(".queryInfo input").prop('disabled',false).parent().css('backgroundColor','white');
                $(".queryInfo .driveTypeInput").prop('disabled',true).parent().css('backgroundColor','inherit')
                //准驾代码失焦，自动对应准驾类型
                $(".queryInfo .driveCodeInput").blur(function(){
                    for(var i in csData){
                        if($(this).val() === csData[i]['name']){
                            $('.queryInfo .driveTypeInput').val(csData[i]['nr1'])
                        }
                    }
                    if(checkIfInArray($(this).val(),arr)){
                        flag = true;
                    }else{
                        alert('准驾类型代码输入错误，找不到与之对应的准驾类型')
                        flag =false;
                    }
                })
            }else if($(this).text() === '确认更改'){
                checkIfInArray($(".queryInfo .driveCodeInput").val(),arr)
                //提交
                if($(".queryInfo .payIdInput").val().match(/^[0-9]{5}$/) && $('.queryInfo .sjDateInput').val().match(/^\d{4}-\d{2}-\d{2}$/) && $('.queryInfo .yearlyCheckInput').val().match(/^\d{4}-\d{2}-\d{2}$/) && $('.queryInfo .startDateInput').val().match(/^\d{4}-\d{2}-\d{2}$/) && $('.queryInfo .deadlineInput').val().match(/^\d{4}-\d{2}-\d{2}$/) && flag){
                    if(confirm('确认要进行更改吗？')){
                        var setStr ='payid =\''+$(".queryInfo .payIdInput").val()+'\',sjDate =\''+$(".queryInfo .sjDateInput").val()+'\',yearlyCheckDate =\''+$(".queryInfo .yearlyCheckInput").val()+'\',sjDriveCode =\''+$(".queryInfo .driveCodeInput").val()+'\',sjDriveType =\''+$(".queryInfo .driveTypeInput").val()+'\',startDate =\''+$(".queryInfo .startDateInput").val()+'\',deadline = \''+$(".queryInfo .deadlineInput").val()+'\'';
                        var where = ' where payid =\''+payId+'\'';
                        var ajaxTimeOut = $.ajax({
                            url: "../../../index.php",
                            type: "POST",
                            timeout: 8000,
                            data: {
                                funcName: 'update', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                                tableName: ' jbxx', setStr: setStr, where: where
                            },
                            dataType: 'json',
                            success: function () {
                                alert('信息修改成功')
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
                }else{
                    alert('请检查输入格式！(工资号为5位数字，日期格式为"xxxx-xx-xx")')
                }
            }


        })
        //证件注销按钮
        $('.logout').off('click').on('click',function(){
            $("#editContainer .textContent").css('display','none');
            $("#editContainer .logOutContent").css('display','block');
            $("#logOutReason").off('change').on('change',function(){
                var reason = $(this).val();
                if(data['status'] !== csData['zjzt-dc']['nr2'] && data['status'] !== csData['zjzt-zx']['nr2']){
                    if(confirm('确定要注销该证件吗？')){
                        var setStr =' status=\''+csData['zjzt-zx']['nr2']+'\'';
                        var where =' where payId =\''+$('.queryInfo .payIdInput').val()+'\'';
                        $.ajax({
                            url: "../../../index.php",
                            type: "POST",
                            timeout: 8000,
                            data: {
                                funcName: 'update', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                                tableName: ' jbxx', setStr: setStr, where: where
                            },
                            dataType: 'json',
                            success: function () {
                                var lotNumber = new Date();
                                lotNumber.month = lotNumber.getMonth() < 9 ? '0' + (lotNumber.getMonth() + 1) : lotNumber.getMonth() + 1;
                                lotNumber.date = lotNumber.getDate() < 10 ? '0' + lotNumber.getDate() : lotNumber.getDate();
                                lotNumber = lotNumber.getFullYear() + '-' + lotNumber.month + '-' + lotNumber.date;
                                $.ajax({
                                    url: "../../../index.php",
                                    type: "POST",
                                    timeout: 8000,
                                    data: {
                                        funcName: 'insert',
                                        serverName: '10.101.62.73',
                                        uid: 'sa',
                                        pwd: '2huj15h1',
                                        Database: 'jszgl',
                                        tableName: ' bgxx',
                                        column: ' (id,lotNumber,Department,payId,archivesId,UName,changeType,changeReason,' +
                                        'driveCode,drive,jykOperator)',
                                        values: '(getDate(),\'' + lotNumber + '\',\'' + data['Department'] + '\',\'' + data['PayId'] + '\',\'' + data['ArchivesId'] + '\',\'' + data['UName'] + '\',\'' + csData['czlb-zx']['nr2']+'\',\''+reason +
                                        '\',\'' + data['sjDriveCode'] + '\',\'' + data['sjDriveType'] + '\',\''+sessionGet('user')+'\')'
                                    },
                                    dataType: 'json',
                                    success: function (ret) {
                                        alert('已注销该证件');
                                    }
                                })
                            }
                        })
                    }
                }else{
                    alert('该证件已注销或者调出，不能重复操作')
                }

            })
        })
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
    //添加审核申请界面
    function appendApplyCheck(power,csData) {
        $("#exchangeApplyCheck").off('click').on('click',function(){
            //有效期满换证
            $(this).css({'background':'#ddd','fontWeight':'bold'}).siblings('div').css({'background':'inherit','fontWeight':'normal'});
            $("#exchangeApplyContent").css('zIndex',999).siblings('div').css('zIndex',1);
            var obj = {};
            obj.column = ' id,department,lotNumber,payId,UName,changeType ';
            obj.order = ' order by department,payId ';
            if(power === '1'){
                var department = sessionGet('department');
                //添加目前正在进行车间审核的换证申请
                obj.where = ' where checkStatus = \''+csData['checkStatus-cjshz']['nr2']+'\' AND changeType like \'%'+csData['czlb-yxqmhz']['nr2']+'\' AND department =\''+department+'\'';
                exchangeApplyAjax(obj)
            }
            //这里尚未添加教育科人员的审核申请界面
            if(power === 'V'){
                obj.where = ' where checkStatus = \''+csData['checkStatus-jykshz']['nr2']+'\' AND changeType like \'%'+csData['czlb-yxqmhz']['nr2']+'\'';
                exchangeApplyAjax(obj)
            }
            function exchangeApplyAjax(obj){
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
                            var html = '<tr><th>部门</th><th>提交日期</th><th>工资号</th><th>姓名</th><th>申请类型</th><th>申请表详情</th><th>操作</th></tr>';
                            for(var y in data){
                                if(data[y]['department'].split(',').length>1){
                                    data[y]['department'] = data[y]['department'].split(',')[0];
                                }
                            }
                            if(count<11){
                                for(var i in data){
                                    html += '<tr>';
                                    for(var j in data[i]){
                                        if(j==='id'){
                                            continue;
                                        }
                                        html += '<td class="'+data[i]['id']['date']+'">'+data[i][j]+'</td>';
                                    }
                                    html+= '<td><span class="seeInfo">查看详情</span></td>';
                                    html += '<td><span class="pass"></span><span class="reject"></span></td>';
                                    html += '</tr>'
                                }
                                $("#exchangeCheckTable").empty().append(html);
                                boundCheckEvent(power);
                                //空白tr补齐表格
                                if($("#exchangeCheckTable tbody tr").length<11){
                                    html = '';
                                    var count = 11-$("#exchangeCheckTable tbody tr").length;
                                    var columns = $("#exchangeCheckTable tbody tr:first-child th");
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
                                        if(j==='id'){
                                            continue
                                        }
                                        html += '<td class="'+data[i]['id']['date']+'">'+data[i][j]+'</td>';
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
                                boundCheckEvent(power);
                                $("#exchangeApplyPage .cur").text(cur);
                                $("#exchangeApplyPage .total").text(total);
                                $("#exchangeApplyPage .next").off('click').on('click',function(){
                                    if(cur<total){
                                        var j =0;
                                        var html = '<tr><th>部门</th><th>提交日期</th><th>工资号</th><th>姓名</th><th>申请类型</th><th>申请表详情</th><th>操作</th></tr>';
                                        for(var i in data){
                                            if(j>10*cur-1 && j<10*(cur+1) && i ){
                                                j++;
                                                html += '<tr>';
                                                for(var m in data[i]){
                                                    if(m==='id'){
                                                        continue;
                                                    }
                                                    html += '<td class="'+data[i]['id']['date']+'">'+data[i][m]+'</td>';
                                                }
                                                html += '<td><span class="seeInfo">查看详情</span></td>';
                                                html += '<td><span class="pass"></span><span class="reject"></span></td>';
                                                html += '</tr>'
                                            }else{
                                                j++;
                                            }
                                        }
                                        $("#exchangeCheckTable").empty().append(html);
                                        boundCheckEvent(power);
                                        //空白tr补齐表格
                                        if($("#exchangeCheckTable tbody tr").length<11){
                                            html = '';
                                            var count = 11-$("#exchangeCheckTable tbody tr").length;
                                            var columns = $("#exchangeCheckTable tbody tr:first-child th").length;
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
                                        var html = '<tr><th>部门</th><th>提交日期</th><th>工资号</th><th>姓名</th><th>申请类型</th><th>申请表详情</th><th>操作</th></tr>';
                                        for(var i in data){
                                            if(j>10*(cur-2)-1 && j<10*(cur-1) && i ){
                                                j++;
                                                html += '<tr>';
                                                for(var m in data[i]){
                                                    if(m==='id'){
                                                        continue;
                                                    }
                                                    html += '<td class="'+data[i]['id']['date']+'">'+data[i][m]+'</td>';
                                                }
                                                html += '<td><span class="seeInfo">查看详情</span></td>';
                                                html += '<td><span class="pass"></span><span class="reject"></span></td>';
                                                html += '</tr>'
                                            }else{
                                                j++;
                                            }
                                        }
                                        $("#exchangeCheckTable").empty().append(html);
                                        boundCheckEvent(power);
                                        cur-=1;
                                        $("#exchangeApplyPage .cur").text(cur);
                                    }
                                })
                            }
                        }else{
                            alert('暂无换证申请信息');
                            $("#exchangeCheckTable").empty()
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
        });
        $("#fixApplyCheck").off('click').on('click',function(){
            $(this).css({'background':'#ddd','fontWeight':'bold'}).siblings('div').css({'background':'inherit','fontWeight':'normal'});
            $("#fixApplyContent").css('zIndex',999).siblings('div').css('zIndex',1);
            var obj = {};
            obj.column = ' id,department,lotNumber,payId,UName,changeType ';
            obj.order = ' order by department,payId ';
            if(power === '1'){
                var department = sessionGet('department');
                //添加目前正在进行车间审核的补证申请
                obj.where = ' where checkStatus = \''+csData['checkStatus-cjshz']['nr2']+'\' AND changeType = \''+csData['czlb-bz']['nr2']+'\' AND department = \''+department+'\'';
                fixApplyAjax(obj)
            }
            if(power === 'V'){
                obj.where = ' where checkStatus = \''+csData['checkStatus-jykshz']['nr2']+'\' AND changeType = \''+csData['czlb-bz']['nr2']+'\'';
                fixApplyAjax(obj)
            }
            //这个函数是请求换补证申请，然后添加入页面的函数,传入obj是sql对象，内涵where,column,order三个字段
            function fixApplyAjax(obj){
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
                            var html = '<tr><th>部门</th><th>提交日期</th><th>工资号</th><th>姓名</th><th>申请类型</th><th>申请表详情</th><th>操作</th></tr>';
                            for(var y in data){
                                if(data[y]['department'].split(',').length>1){
                                    data[y]['department'] = data[y]['department'].split(',')[0];
                                }
                            }
                            if(count<11){
                                for(var i in data){
                                    html += '<tr>';
                                    for(var j in data[i]){
                                        if(j==='id'){
                                            continue
                                        }
                                        html += '<td class="'+data[i]['id']['date']+'">'+data[i][j]+'</td>';
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
                                    var columns = $("#fixCheckTable tbody tr:first-child th").length;
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
                                        if(j==='id'){
                                            continue
                                        }
                                        html += '<td class="'+data[i]['id']['date']+'">'+data[i][j]+'</td>';
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
                                        var html = '<tr><th>部门</th><th>提交日期</th><th>工资号</th><th>姓名</th><th>申请类型</th><th>申请表详情</th><th>操作</th></tr>';
                                        for(var i in data){
                                            if(j>10*cur-1 && j<10*(cur+1) && i ){
                                                j++;
                                                html += '<tr>';
                                                for(var m in data[i]){
                                                    if(m==='id'){
                                                        continue
                                                    }
                                                    html += '<td class="'+data[i]['id']['date']+'">'+data[i][m]+'</td>';
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
                                            var columns = $("#fixCheckTable tbody tr:first-child th").length;
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
                                        var html = '<tr><th>部门</th><th>提交日期</th><th>工资号</th><th>姓名</th><th>申请类型</th><th>申请表详情</th><th>操作</th></tr>';
                                        for(var i in data){
                                            if(j>10*(cur-2)-1 && j<10*(cur-1) && i ){
                                                j++;
                                                html += '<tr>';
                                                for(var m in data[i]){
                                                    if(m==='id'){
                                                        continue
                                                    }
                                                    html += '<td class="'+data[i]['id']['date']+'">'+data[i][m]+'</td>';
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
                            $("#fixCheckTable").empty()
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
        });

    }
    //审核申请的按钮事件
    function boundCheckEvent(power){
        var payId='';
        var lotNumber = '';
        var changeType = '';
        var id='';
        var setStr = '';
        var rejectSetStr = '';
        var where = '';
        var uname = '';
        //获取当天的xxxx-xx-xx形式时间戳
        var today = new Date();
        today.month = today.getMonth() < 9 ? '0' + (today.getMonth() + 1) : today.getMonth() + 1;
        today.date = today.getDate() < 10 ? '0' + today.getDate() : today.getDate();
        today = today.getFullYear() + '-' + today.month + '-' + today.date;
        if(power === '1'){
            //在这里面定义一些变量用来存放数据库字段，节省代码
            setStr = 'checkStatus = \''+csData['checkStatus-jykshz']['nr2']+'\', cjOperator = \''+sessionGet('user')+'\', cjCheckDate = \''+today+'\' ';
            rejectSetStr = ' ,cjOperator = \''+sessionGet('user')+'\', cjCheckDate = \''+today+'\' ';
        }else if(power === 'V'){
            setStr = 'checkStatus = \''+csData['checkStatus-shtg']['nr2']+'\', jykOperator = \''+sessionGet('user')+'\', jykCheckDate = \''+today+'\' ';
            rejectSetStr = ' ,jykOperator = \''+sessionGet('user')+'\', jykCheckDate = \''+today+'\' ';
        }
        $("#fixCheckTable .seeInfo").off('click').on('click',displayTable);
        $("#fixCheckTable .pass").off('click').on('click',passApply);
        $("#fixCheckTable .reject").off('click').on('click',rejectApply);
        $("#exchangeCheckTable .seeInfo").off('click').on('click',displayTable);
        $("#exchangeCheckTable .pass").off('click').on('click',passApply);
        $("#exchangeCheckTable .reject").off('click').on('click',rejectApply);

        function displayTable(){
            $("#fixTable").appendTo($("#displayApplyContainer"));
            $("#displayApplyContainer").css('visibility','visible').animate({'opacity':0.9},800)
            $("#fixTable").css({'visibility':'visible','marginLeft':'200px'}).animate({'opacity':1},800)
            var changeType = ''
            if($(this).parent().prev().text() === csData['czlb-yxqmhz']['nr3']){
                changeType = csData['czlb-yxqmhz']['name']
            }else if($(this).parent().prev().text() === csData['czlb-fyxqmhz']['nr3']){
                changeType = csData['czlb-fyxqmhz']['name']
            }else if($(this).parent().prev().text() === csData['czlb-bz']['nr3']){
                changeType = csData['czlb-bz']['name']
            }
            getUserinfo($(this).parent().prev().prev().prev().text(),changeType)
            $("#displayApplyContainer").off('click').on('click',function(){
                $("#displayApplyContainer").dequeue().animate({'opacity':0},800,function(){
                    $("#displayApplyContainer").css('visibility','hidden')
                })
                $("#fixTable").dequeue().animate({'opacity':0},800,function(){
                    $("#fixTable").css({'visibility':'hidden','marginLeft':'200px'})
                })
            })
            $(document).keyup(function(event){
                switch(event.keyCode) {
                    case 27:
                        $("#displayApplyContainer").dequeue().animate({'opacity':0},800,function(){
                            $("#displayApplyContainer").css('visibility','hidden')
                        });
                        $("#fixTable").dequeue().animate({'opacity':0},800,function(){
                            $("#fixTable").css({'visibility':'hidden','marginLeft':'200px'})
                        });
                    case 96:
                        $("#displayApplyContainer").dequeue().animate({'opacity':0},800,function(){
                            $("#displayApplyContainer").css('visibility','hidden')
                        });
                        $("#fixTable").dequeue().animate({'opacity':0},800,function(){
                            $("#fixTable").css({'visibility':'hidden','marginLeft':'200px'})
                        });
                }
            });
        }
        function passApply(){
            if(confirm('请认真核对该申请表信息。操作无法撤回。\u000d确定要通过审核请选“确定”。返回请选“取消”')){
                id = $(this).parent().prev().prev().prop('className').substring(0,$(this).parent().prev().prev().prop('className').length-3);
                payId = $(this).parent().prev().prev().prev().prev().text();
                lotNumber = $(this).parent().prev().prev().prev().prev().prev().text();
                changeType = $(this).parent().prev().prev().text();
                uname = $(this).parent().prev().prev().prev().text();
                var _this = $(this);
                where = ' where id=\''+id+'\'';
                $.ajax({
                    url: "../../../index.php",
                    type: "POST",
                    timeout: 8000,
                    data: {
                        funcName: 'update', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                        tableName: ' bgxx', setStr: setStr, where: where
                    },
                    dataType: 'json',
                    success: function () {
                        alert('操作成功，您已通过了'+uname+'师傅的'+changeType+'申请');
                        $(_this).next('span').remove();
                        $(_this).remove();
                        appendGiveOut(csData)
                    }
                });
            }
        }
        function rejectApply(){
            var shortage ='';
            var failedReason ='';
            var _thisReject = $(this);
            $(".rejectReasonDiv input:checkbox").attr('checked',false);
            $("#reasonContainer").css('visibility','visible').dequeue().animate({'opacity':0.9},500);
            $("#short").off('click').on('click',function(){
                $(".rejectReasonDiv input:checkbox").attr('disabled',false);
            });
            $("#false").off('click').on('click',function(){
                $(".rejectReasonDiv input:checkbox").attr('disabled',true);
                $(".rejectReasonDiv input:checkbox").attr('checked',false);
            });
            $("#rejectReasonSubmit").off('click').on('click',function(){
                var short = document.getElementById('short').checked;
                var _false = document.getElementById('false').checked;
                if(short && $(".rejectReasonDiv input:checked").length===0){
                    alert('请选择缺少的材料');
                }else if(short && $(".rejectReasonDiv input:checked").length>0){
                    for(var i =0;i<$(".rejectReasonDiv input:checked").length;i++){
                        shortage +=$(".rejectReasonDiv input:checked:eq("+i+")").next('label').text();
                        shortage+=','
                    }
                    shortage = shortage.substring(0,shortage.length-1);
                    failedReason = '材料不齐全';
                    if(confirm('请认真核对该申请表信息。操作无法撤回。\u000d确定要驳回该申请请选“确定”。返回请选“取消”')){
                        id = $(_thisReject).parent().prev().prev().prop('className').substring(0,$(_thisReject).parent().prev().prev().prop('className').length-3);
                        console.log(id)
                        payId = $(_thisReject).parent().prev().prev().prev().prev().text();
                        lotNumber = $(_thisReject).parent().prev().prev().prev().prev().prev().text();
                        changeType = $(_thisReject).parent().prev().prev().text();
                        uname = $(_thisReject).parent().prev().prev().prev().text();
                        rejectSetStr = ' checkStatus = \''+csData['checkStatus-shwtg']['nr2']+'\''+' ,shortage = \''+shortage+'\''+ ' ,failedReason = \''+failedReason+'\'' + rejectSetStr;
                        where = ' where id=\''+id+'\'';
                        $.ajax({
                            url: "../../../index.php",
                            type: "POST",
                            timeout: 8000,
                            data: {
                                funcName: 'update', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                                tableName: ' bgxx', setStr: rejectSetStr, where: where
                            },
                            dataType: 'json',
                            success: function () {
                                alert('操作成功，您已驳回了'+uname+'师傅的'+changeType+'申请');
                                $(_thisReject).prev('span').remove();
                                $(_thisReject).remove();
                                $("#reasonContainer").dequeue().animate({'opacity':0},500,function(){
                                    $("#reasonContainer").css('visibility','hidden')
                                });
                            }
                        });
                    }
                }else if(_false){
                    failedReason = '信息有误';
                    if(confirm('请认真核对该申请表信息。操作无法撤回。\u000d确定要驳回该申请请选“确定”。返回请选“取消”')){
                        id = $(_thisReject).parent().prev().prev().prop('className').substring(0,$(_thisReject).parent().prev().prev().prop('className').length-3);
                        payId = $(_thisReject).parent().prev().prev().prev().prev().text();
                        lotNumber = $(_thisReject).parent().prev().prev().prev().prev().prev().text();
                        changeType = $(_thisReject).parent().prev().prev().text();
                        uname = $(_thisReject).parent().prev().prev().prev().text();
                        rejectSetStr = ' checkStatus = \''+csData['checkStatus-shwtg']['nr2']+'\''+' ,shortage = \''+shortage+'\''+ ' ,failedReason = \''+failedReason+'\''+rejectSetStr;
                        where = ' where id=\''+id+'\'';
                        $.ajax({
                            url: "../../../index.php",
                            type: "POST",
                            timeout: 8000,
                            data: {
                                funcName: 'update', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                                tableName: ' bgxx', setStr: rejectSetStr, where: where
                            },
                            dataType: 'json',
                            success: function () {
                                alert('操作成功，您已驳回了'+uname+'师傅的'+changeType+'申请');
                                $(_thisReject).prev('span').remove();
                                $(_thisReject).remove();
                                $("#reasonContainer").dequeue().animate({'opacity':0},500,function(){
                                    $("#reasonContainer").css('visibility','hidden')
                                });
                            }
                        });
                    }
                }

            });
            $("#cancelReject").off('click').on('click',function(){
                $("#reasonContainer").dequeue().animate({'opacity':0},500,function(){
                    $("#reasonContainer").css('visibility','hidden')
                });
            })
            $(document).keyup(function(event){
                switch(event.keyCode) {
                    case 27:
                        $("#reasonContainer").dequeue().animate({'opacity':0},500,function(){
                            $("#reasonContainer").css('visibility','hidden')
                        });
                    case 96:
                        $("#reasonContainer").dequeue().animate({'opacity':0},500,function(){
                            $("#reasonContainer").css('visibility','hidden')
                        });
                }
            });
        }

    }

    //添加预警信息
    function appendAlert(csData){
        var power = sessionGet('power');

        if(power === '1'){
            var department = sessionGet('department');
            appendDepartmentAlert(department)
        }else if(power === 'V'){
            appendAllAlert(csData)
        }
        function appendDepartmentAlert(department){
            var p =  department.split(',')[0];
            if($("#alertBanner .selectArea select").length>0){

            }else{
                $("#alertBanner .selectArea").text(p)
            }
            $.ajax({
                url: "../../../index.php",
                type: "POST",
                data: {
                    funcName: 'select', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'JSZGL',
                    tableName: ' jbxx ', column: ' department,payId,UName,remainingDays', where: ' where department like \''+department+'%\' AND status = \''+csData['zjzt-yj']['nr2']+'\'', order: ' '
                },
                dataType: 'json',
                success: function (data) {
                    if(data['success'] === 1){
                        $.ajax({
                            url: "../../../index.php",
                            type: "POST",
                            data: {
                                funcName: 'select',
                                serverName: '10.101.62.73',
                                uid: 'sa',
                                pwd: '2huj15h1',
                                Database: 'JSZGL',
                                tableName: ' bgxx ',
                                column: ' checkStatus,payId',
                                where: ' where department like \'' + department + '%\' AND (checkstatus != \'' + csData['checkStatus-shwtg']['nr2'] + '\' AND finishstatus != \''+ csData['finishStatus-ffdgr']['nr2'] + '\')',
                                order: ' '
                            },
                            dataType: 'json',
                            success: function (bgxx) {
                                delete data['success'];
                                var alertCount = data['count'];
                                $("#alertBanner .p2").empty().append('驾驶证预警人员共'+alertCount+'人：');
                                delete data['count'];
                                delete bgxx['success'];
                                delete bgxx['count'];
                                var html = '<tr><th>所属车间</th><th>工资号</th><th>姓名</th><th>距到期剩余天数</th><th>是否已申请换证</th><th>审核状态</th></tr>';
                                //处理数据，加入两个属性“是否正在换证”、‘审核状态’
                                for(var i in data){
                                    if(data[i]['department'].split(',').length>1){
                                        data[i]['department'] = data[i]['department'].split(',')[0];
                                    }
                                    for(var j in bgxx){
                                        if(data[i]['payId'] !== bgxx[j]['payId']){
                                            data[i]['checking'] = '否';
                                            data[i]['checkStatus'] = ' ';
                                        }else{
                                            data[i]['checkStatus'] = bgxx[j]['checkStatus'];
                                            data[i]['checking'] = '是';
                                            break
                                        }
                                    }
                                }
                                if(alertCount<11){
                                    for(var i in data){
                                        html += '<tr>';
                                        for(var j in data[i]){
                                            html += '<td>'+data[i][j]+'</td>';
                                        }
                                        html += '</tr>'
                                    }
                                    $("#alertTable").empty().append(html);

                                    for(var m=0;m<$("#alertTable tbody tr td:nth-child(5)").length;m++){
                                        if($("#alertTable tbody tr td:nth-child(5):eq("+m+")").text() === '否'){
                                            $('.redPoint').css('display','block')
                                            $("#alertTable tbody tr td:nth-child(5):eq("+m+")").css('color','red')
                                        }else{
                                            $("#alertTable tbody tr td:nth-child(5):eq("+m+")").css('color','green')
                                        }
                                    }
                                    //空白tr补齐表格
                                    if($("#alertTable tbody tr").length<11){
                                        html = '';
                                        var count = 11-$("#alertTable tbody tr").length;
                                        var columns = 6;
                                        for(var m=0;m<count;m++){
                                            html+='<tr>';
                                            for(var n=0;n<columns;n++){
                                                html+="<td></td>";
                                            }
                                            html+="</tr>";
                                        }
                                        $("#alertTable tbody").append(html);
                                    }
                                }else{
                                    var q =0;
                                    var cur =1;
                                    var total = Math.ceil(alertCount/10);
                                    $("#alertPage").css("display",'block');
                                    for(var i in data){
                                        html += '<tr>';
                                        for(var j in data[i]){
                                            html += '<td>'+data[i][j]+'</td>';
                                        }
                                        html += '</tr>';
                                        q+=1;
                                        if(q>9){
                                            break
                                        }
                                    }
                                    $("#alertTable").empty().append(html);
                                    for(var m=0;m<$("#alertTable tbody tr td:nth-child(5)").length;m++){
                                        if($("#alertTable tbody tr td:nth-child(5):eq("+m+")").text() === '否'){
                                            $('.redPoint').css('display','block')
                                            $("#alertTable tbody tr td:nth-child(5):eq("+m+")").css('color','red')
                                        }else{
                                            $("#alertTable tbody tr td:nth-child(5):eq("+m+")").css('color','green')
                                        }
                                    }
                                    $("#alertPage .cur").text(cur);
                                    $("#alertPage .total").text(total);
                                    $("#alertPage .next").off('click').on('click',function(){
                                        if(cur<total){
                                            var j =0;
                                            var html = '<tr><th>所属车间</th><th>工资号</th><th>姓名</th><th>距到期剩余天数</th><th>是否已申请换证</th><th>审核状态</th></tr>';
                                            for(var i in data){
                                                if(j>10*cur-1 && j<10*(cur+1) && i ){
                                                    j++;
                                                    html += '<tr>';
                                                    for(var m in data[i]){
                                                        html += '<td>'+data[i][m]+'</td>';
                                                    }
                                                    html += '</tr>'
                                                }else{
                                                    j++;
                                                }
                                            }
                                            $("#alertTable").empty().append(html);
                                            for(var m=0;m<$("#alertTable tbody tr td:nth-child(5)").length;m++){
                                                if($("#alertTable tbody tr td:nth-child(5):eq("+m+")").text() === '否'){
                                                    $("#alertTable tbody tr td:nth-child(5):eq("+m+")").css('color','red')
                                                }else{
                                                    $("#alertTable tbody tr td:nth-child(5):eq("+m+")").css('color','green')
                                                }
                                            }
                                            //空白tr补齐表格
                                            if($("#alertTable tbody tr").length<11){
                                                html = '';
                                                var count = 11-$("#alertTable tbody tr").length;
                                                var columns = 6;
                                                for(var m=0;m<count;m++){
                                                    html+='<tr>';
                                                    for(var n=0;n<columns;n++){
                                                        html+="<td></td>";
                                                    }
                                                    html+="</tr>";
                                                }
                                                $("#alertTable tbody").append(html);
                                                for(var m=0;m<$("#alertTable tbody tr td:nth-child(5)").length;m++){
                                                    if($("#alertTable tbody tr td:nth-child(5):eq("+m+")").text() === '否'){
                                                        $("#alertTable tbody tr td:nth-child(5):eq("+m+")").css('color','red')
                                                    }else{
                                                        $("#alertTable tbody tr td:nth-child(5):eq("+m+")").css('color','green')
                                                    }
                                                }
                                            }
                                            cur+=1;
                                            $("#alertPage .cur").text(cur);
                                        }
                                    })
                                    $("#alertPage .prev").off('click').on('click',function(){
                                        if(cur>1){
                                            var j =0;
                                            var html = '<tr><th>所属车间</th><th>工资号</th><th>姓名</th><th>距到期剩余天数</th><th>是否已申请换证</th><th>审核状态</th></tr>';
                                            for(var i in data){
                                                if(j>10*(cur-2)-1 && j<10*(cur-1) && i ){
                                                    j++;
                                                    html += '<tr>';
                                                    for(var m in data[i]){
                                                        html += '<td>'+data[i][m]+'</td>';
                                                    }
                                                    html += '</tr>'
                                                }else{
                                                    j++;
                                                }
                                            }
                                            $("#alertTable").empty().append(html);
                                            for(var m=0;m<$("#alertTable tbody tr td:nth-child(5)").length;m++){
                                                if($("#alertTable tbody tr td:nth-child(5):eq("+m+")").text() === '否'){
                                                    $("#alertTable tbody tr td:nth-child(5):eq("+m+")").css('color','red')
                                                }else{
                                                    $("#alertTable tbody tr td:nth-child(5):eq("+m+")").css('color','green')
                                                }
                                            }
                                            cur-=1;
                                            $("#alertPage .cur").text(cur);
                                        }
                                    })
                                }
                            }
                        })
                    }else{
                        $("#alertTable").empty();
                        $("#alertBanner .p2").text('驾驶证预警人员共0人');
                        $("#alertPage").css('display','none')
                    }
                }
            })
        }
        function appendAllAlert(csData){
            var html = '<select><option>全段</option>';
            for(var i in csData){
                if(csData[i]['lb'] === 'ssbm'){
                    html += '<option>'+csData[i]['nr1']+'</option>'
                }
            }
            html+='</select>';
            $("#alertBanner .selectArea").empty().append(html);

            $.ajax({
                url: "../../../index.php",
                type: "POST",
                data: {
                    funcName: 'select', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'JSZGL',
                    tableName: ' jbxx ', column: ' department,payId,UName,remainingDays', where: ' where status = \''+csData['zjzt-yj']['nr2']+'\'', order: ' order by department'
                },
                dataType: 'json',
                success: function (data) {
                    if(data['success'] === 1){
                        $.ajax({
                            url: "../../../index.php",
                            type: "POST",
                            data: {
                                funcName: 'select',
                                serverName: '10.101.62.73',
                                uid: 'sa',
                                pwd: '2huj15h1',
                                Database: 'JSZGL',
                                tableName: ' bgxx ',
                                column: ' checkStatus,payId',
                                where: ' where checkstatus != \'' + csData['checkStatus-shwtg']['nr2'] + '\' AND finishstatus != \''+ csData['finishStatus-ffdgr']['nr2'] + '\'',
                                order: ' '
                            },
                            dataType: 'json',
                            success: function (bgxx) {
                                delete data['success'];
                                var alertCount = data['count'];
                                $("#alertBanner .p2").empty().append('驾驶证预警人员共'+alertCount+'人：');
                                delete data['count'];
                                delete bgxx['success'];
                                delete bgxx['count'];
                                var html = '<tr><th>所属车间</th><th>工资号</th><th>姓名</th><th>距到期剩余天数</th><th>是否已申请换证</th><th>审核状态</th></tr>';
                                //处理数据，加入两个属性“是否正在换证”、‘审核状态’
                                for(var i in data){
                                    if(data[i]['department'].split(',').length>1){
                                        data[i]['department'] = data[i]['department'].split(',')[0];
                                    }
                                    for(var j in bgxx){
                                        if(data[i]['payId'] !== bgxx[j]['payId']){
                                            data[i]['checking'] = '否';
                                            data[i]['checkStatus'] = ' ';
                                        }else{
                                            data[i]['checkStatus'] = bgxx[j]['checkStatus'];
                                            data[i]['checking'] = '是';
                                            break
                                        }
                                    }
                                }
                                if(alertCount<11){
                                    for(var i in data){
                                        html += '<tr>';
                                        for(var j in data[i]){
                                            html += '<td>'+data[i][j]+'</td>';
                                        }
                                        html += '</tr>'
                                    }
                                    $("#alertTable").empty().append(html);

                                    for(var m=0;m<$("#alertTable tbody tr td:nth-child(5)").length;m++){
                                        if($("#alertTable tbody tr td:nth-child(5):eq("+m+")").text() === '否'){
                                            $('.redPoint').css('display','block')
                                            $("#alertTable tbody tr td:nth-child(5):eq("+m+")").css('color','red')
                                        }else{
                                            $("#alertTable tbody tr td:nth-child(5):eq("+m+")").css('color','green')
                                        }
                                    }
                                    //空白tr补齐表格
                                    if($("#alertTable tbody tr").length<11){
                                        html = '';
                                        var count = 11-$("#alertTable tbody tr").length;
                                        var columns = 6;
                                        for(var m=0;m<count;m++){
                                            html+='<tr>';
                                            for(var n=0;n<columns;n++){
                                                html+="<td></td>";
                                            }
                                            html+="</tr>";
                                        }
                                        $("#alertTable tbody").append(html);
                                    }
                                }else{
                                    var q =0;
                                    var cur =1;
                                    var total = Math.ceil(alertCount/10);
                                    $("#alertPage").css("display",'block');
                                    for(var i in data){
                                        html += '<tr>';
                                        for(var j in data[i]){
                                            html += '<td>'+data[i][j]+'</td>';
                                        }
                                        html += '</tr>';
                                        q+=1;
                                        if(q>9){
                                            break
                                        }
                                    }
                                    $("#alertTable").empty().append(html);
                                    for(var m=0;m<$("#alertTable tbody tr td:nth-child(5)").length;m++){
                                        if($("#alertTable tbody tr td:nth-child(5):eq("+m+")").text() === '否'){
                                            $('.redPoint').css('display','block')
                                            $("#alertTable tbody tr td:nth-child(5):eq("+m+")").css('color','red')
                                        }else{
                                            $("#alertTable tbody tr td:nth-child(5):eq("+m+")").css('color','green')
                                        }
                                    }
                                    $("#alertPage .cur").text(cur);
                                    $("#alertPage .total").text(total);
                                    $("#alertPage .next").off('click').on('click',function(){
                                        if(cur<total){
                                            var j =0;
                                            var html = '<tr><th>所属车间</th><th>工资号</th><th>姓名</th><th>距到期剩余天数</th><th>是否已申请换证</th><th>审核状态</th></tr>';
                                            for(var i in data){
                                                if(j>10*cur-1 && j<10*(cur+1) && i ){
                                                    j++;
                                                    html += '<tr>';
                                                    for(var m in data[i]){
                                                        html += '<td>'+data[i][m]+'</td>';
                                                    }
                                                    html += '</tr>'
                                                }else{
                                                    j++;
                                                }
                                            }
                                            $("#alertTable").empty().append(html);
                                            for(var m=0;m<$("#alertTable tbody tr td:nth-child(5)").length;m++){
                                                if($("#alertTable tbody tr td:nth-child(5):eq("+m+")").text() === '否'){
                                                    $("#alertTable tbody tr td:nth-child(5):eq("+m+")").css('color','red')
                                                }else{
                                                    $("#alertTable tbody tr td:nth-child(5):eq("+m+")").css('color','green')
                                                }
                                            }
                                            //空白tr补齐表格
                                            if($("#alertTable tbody tr").length<11){
                                                html = '';
                                                var count = 11-$("#alertTable tbody tr").length;
                                                var columns = 6;
                                                for(var m=0;m<count;m++){
                                                    html+='<tr>';
                                                    for(var n=0;n<columns;n++){
                                                        html+="<td></td>";
                                                    }
                                                    html+="</tr>";
                                                }
                                                $("#alertTable tbody").append(html);
                                                for(var m=0;m<$("#alertTable tbody tr td:nth-child(5)").length;m++){
                                                    if($("#alertTable tbody tr td:nth-child(5):eq("+m+")").text() === '否'){
                                                        $("#alertTable tbody tr td:nth-child(5):eq("+m+")").css('color','red')
                                                    }else{
                                                        $("#alertTable tbody tr td:nth-child(5):eq("+m+")").css('color','green')
                                                    }
                                                }
                                            }
                                            cur+=1;
                                            $("#alertPage .cur").text(cur);
                                        }
                                    })
                                    $("#alertPage .prev").off('click').on('click',function(){
                                        if(cur>1){
                                            var j =0;
                                            var html = '<tr><th>所属车间</th><th>工资号</th><th>姓名</th><th>距到期剩余天数</th><th>是否已申请换证</th><th>审核状态</th></tr>';
                                            for(var i in data){
                                                if(j>10*(cur-2)-1 && j<10*(cur-1) && i ){
                                                    j++;
                                                    html += '<tr>';
                                                    for(var m in data[i]){
                                                        html += '<td>'+data[i][m]+'</td>';
                                                    }
                                                    html += '</tr>'
                                                }else{
                                                    j++;
                                                }
                                            }
                                            $("#alertTable").empty().append(html);
                                            for(var m=0;m<$("#alertTable tbody tr td:nth-child(5)").length;m++){
                                                if($("#alertTable tbody tr td:nth-child(5):eq("+m+")").text() === '否'){
                                                    $("#alertTable tbody tr td:nth-child(5):eq("+m+")").css('color','red')
                                                }else{
                                                    $("#alertTable tbody tr td:nth-child(5):eq("+m+")").css('color','green')
                                                }
                                            }
                                            cur-=1;
                                            $("#alertPage .cur").text(cur);
                                        }
                                    })
                                }
                            }
                        })
                    }
                }
            })

            $("#alertBanner select").off('change').on('change',function(){
                if($(this).val() === '全段'){
                    appendAllAlert(csData)
                }else{
                    appendDepartmentAlert($(this).val())
                }
            })
        }
    }

    //添加统计信息
    function appendTJxx(csData){
        var power = sessionGet('power');
        var department  = sessionGet('department')
        if(power === '1'){
            var html = '<select class="name"><option>--请选择--</option>';
            for(var i in csData){
                if(csData[i]['lb'] === 'cjtjxx'){
                    html += '<option>'+csData[i]['nr2']+'</option>'
                }
            }
            html+='</select>';
            $("#dataBanner").empty().append(html);
            $('#dataBanner .name').off('change').on('change',function(){
                appendDataTable($(this).val(),department)
            })
        }else if(power === 'V'){
            var html = '<select class="name"><option>--请选择--</option>';
            for(var i in csData){
                if(csData[i]['lb'] === 'jyktjxx'){
                    html += '<option>'+csData[i]['nr2']+'</option>'
                }
            }
            html+='</select>';
            $("#dataBanner").empty().append(html);
            $('#dataBanner .name').off('change').on('change',function(){
                appendDataTableV($(this).val())
            })
        }
        //1级权限人员
        function appendDataTable(name,department){
            if(name === '--请选择--'){

            }else if(name === csData['cjtjxx-shjl']['nr2']){
                //呈现审核记录表
                var ajaxTimeOut = $.ajax({
                    url: "../../../index.php",
                    type:"POST",
                    timeout:8000,
                    //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                    data:{funcName:'select',where:' where department like \''+department+'%\'',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                        tableName:' bgxx ',column:' department,lotNumber,checkStatus,payId,UName,changeType,changeReason,failedReason,shortage,cjOperator,cjCheckDate,jykOperator,jykCheckDate',order:' order by checkStatus , payid'},
                    dataType:'json',
                    success:function(data){
                        if(data['success'] === 1){
                            delete data['success'];
                            var count = data['count'];
                            delete data['count'];
                            for(var i in data){
                                if(data[i]['department'].split(',').length>1){
                                    data[i]['department'] = data[i]['department'].split(',')[0];
                                }
                            }
                            var html = '<tr><th>部门</th><th>日期</th><th>审核状态</th><th>工资号</th><th>姓名</th><th>申请类型</th><th>申请原因</th><th>驳回原因</th><th>缺少材料</th><th>车间经办人</th><th>车间审核日期</th><th>教育科经办人</th><th>教育科审核日期</th></tr>';
                            if(count<11){
                                for(var i in data){
                                    html += '<tr>';
                                    for(var j in data[i]){
                                        html += '<td>'+data[i][j]+'</td>';
                                    }
                                    html += '</tr>'
                                }
                                $("#dataTable").empty().append(html);
                                //空白tr补齐表格
                                if($("#dataTable tbody tr").length<11){
                                    html = '';
                                    var count = 11-$("#dataTable tbody tr").length;
                                    var columns = $("#dataTable tbody tr:first-child th").length;
                                    for(var m=0;m<count;m++){
                                        html+='<tr>';
                                        for(var n=0;n<columns;n++){
                                            html+="<td></td>";
                                        }
                                        html+="</tr>";
                                    }
                                    $("#dataTable tbody").append(html);
                                }
                            }else{
                                var q =0;
                                var cur =1;
                                var total = Math.ceil(count/10);
                                $("#dataPage").css("display",'block');
                                for(var i in data){
                                    html += '<tr>';
                                    for(var j in data[i]){
                                        html += '<td>'+data[i][j]+'</td>';
                                    }
                                    html += '</tr>';
                                    q+=1;
                                    if(q>9){
                                        break
                                    }
                                }
                                $("#dataTable").empty().append(html);
                                $("#dataPage .cur").text(cur);
                                $("#dataPage .total").text(total);
                                $("#dataPage .next").off('click').on('click',function(){
                                    if(cur<total){
                                        var j =0;
                                        var html = '<tr><th>部门</th><th>日期</th><th>审核状态</th><th>工资号</th><th>姓名</th><th>申请类型</th><th>申请原因</th><th>驳回原因</th><th>缺少材料</th><th>车间经办人</th><th>车间审核日期</th><th>教育科经办人</th><th>教育科审核日期</th></tr>';
                                        for(var i in data){
                                            if(j>10*cur-1 && j<10*(cur+1) && i ){
                                                j++;
                                                html += '<tr>';
                                                for(var m in data[i]){
                                                    html += '<td>'+data[i][m]+'</td>';
                                                }
                                                html += '</tr>'
                                            }else{
                                                j++;
                                            }
                                        }
                                        $("#dataTable").empty().append(html);
                                        //空白tr补齐表格
                                        if($("#dataTable tbody tr").length<11){
                                            html = '';
                                            var count = 11-$("#dataTable tbody tr").length;
                                            var columns = $("#dataTable tbody tr:first-child th").length;
                                            for(var m=0;m<count;m++){
                                                html+='<tr>';
                                                for(var n=0;n<columns;n++){
                                                    html+="<td></td>";
                                                }
                                                html+="</tr>";
                                            }
                                            $("#dataTable tbody").append(html);
                                        }
                                        cur+=1;
                                        $("#dataPage .cur").text(cur);
                                    }

                                })
                                $("#dataPage .prev").off('click').on('click',function(){
                                    if(cur>1){
                                        var j =0;
                                        var html = '<tr><th>部门</th><th>日期</th><th>审核状态</th><th>工资号</th><th>姓名</th><th>申请类型</th><th>申请原因</th><th>驳回原因</th><th>缺少材料</th><th>车间经办人</th><th>车间审核日期</th><th>教育科经办人</th><th>教育科审核日期</th></tr>';
                                        for(var i in data){
                                            if(j>10*(cur-2)-1 && j<10*(cur-1) && i ){
                                                j++;
                                                html += '<tr>';
                                                for(var m in data[i]){
                                                    html += '<td>'+data[i][m]+'</td>';
                                                }
                                                html += '</tr>'
                                            }else{
                                                j++;
                                            }
                                        }
                                        $("#dataTable").empty().append(html);
                                        cur-=1;
                                        $("#dataPage .cur").text(cur);
                                    }

                                })
                            }
                        }else{
                            alert('暂无审核记录');
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
            }else if(name === csData['cjtjxx-ffjl']['nr2']){
                //呈现发放记录表
                var ajaxTimeOut1 = $.ajax({
                    url: "../../../index.php",
                    type:"POST",
                    timeout:8000,
                    //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                    data:{funcName:'select',where:' where department like \''+department+'%\' AND (finishStatus = \''+csData['finishStatus-ffdcj']['nr2']+'\' or finishStatus =\''+csData['finishStatus-ffdgr']['nr2']+'\')',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                        tableName:' bgxx ',column:' department,lotNumber,payId,UName,cjArriveOperator,grArriveDate,jykArriveOperator,cjArriveDate',order:' order by lotnumber,payid'},
                    dataType:'json',
                    success:function(data){
                        if(data['success'] === 1){
                            delete data['success'];
                            var count = data['count'];
                            delete data['count'];
                            for(var i in data){
                                if(data[i]['department'].split(',').length>1){
                                    data[i]['department'] = data[i]['department'].split(',')[0];
                                }
                            }
                            var html = '<tr><th>部门</th><th>日期</th><th>工资号</th><th>姓名</th><th>车间发放人</th><th>车间发放日期</th><th>教育科发放人</th><th>教育科发放日期</th></tr>';
                            if(count<11){
                                for(var i in data){
                                    html += '<tr>';
                                    for(var j in data[i]){
                                        html += '<td>'+data[i][j]+'</td>';
                                    }
                                    html += '</tr>'
                                }
                                $("#dataTable").empty().append(html);
                                //空白tr补齐表格
                                if($("#dataTable tbody tr").length<11){
                                    html = '';
                                    var count = 11-$("#dataTable tbody tr").length;
                                    var columns = $("#dataTable tbody tr:first-child th").length;
                                    for(var m=0;m<count;m++){
                                        html+='<tr>';
                                        for(var n=0;n<columns;n++){
                                            html+="<td></td>";
                                        }
                                        html+="</tr>";
                                    }
                                    $("#dataTable tbody").append(html);
                                }
                            }else{
                                var q =0;
                                var cur =1;
                                var total = Math.ceil(count/10);
                                $("#dataPage").css("display",'block');
                                for(var i in data){
                                    html += '<tr>';
                                    for(var j in data[i]){
                                        html += '<td>'+data[i][j]+'</td>';
                                    }
                                    html += '</tr>';
                                    q+=1;
                                    if(q>9){
                                        break
                                    }
                                }
                                $("#dataTable").empty().append(html);
                                $("#dataPage .cur").text(cur);
                                $("#dataPage .total").text(total);
                                $("#dataPage .next").off('click').on('click',function(){
                                    if(cur<total){
                                        var j =0;
                                        var html = '<tr><th>部门</th><th>日期</th><th>工资号</th><th>姓名</th><th>车间发放人</th><th>车间发放日期</th><th>教育科发放人</th><th>教育科发放日期</th></tr>';
                                        for(var i in data){
                                            if(j>10*cur-1 && j<10*(cur+1) && i ){
                                                j++;
                                                html += '<tr>';
                                                for(var m in data[i]){
                                                    html += '<td>'+data[i][m]+'</td>';
                                                }
                                                html += '</tr>'
                                            }else{
                                                j++;
                                            }
                                        }
                                        $("#dataTable").empty().append(html);
                                        //空白tr补齐表格
                                        if($("#dataTable tbody tr").length<11){
                                            html = '';
                                            var count = 11-$("#dataTable tbody tr").length;
                                            var columns = $("#dataTable tbody tr:first-child th").length;
                                            for(var m=0;m<count;m++){
                                                html+='<tr>';
                                                for(var n=0;n<columns;n++){
                                                    html+="<td></td>";
                                                }
                                                html+="</tr>";
                                            }
                                            $("#dataTable tbody").append(html);
                                        }
                                        cur+=1;
                                        $("#dataPage .cur").text(cur);
                                    }

                                })
                                $("#dataPage .prev").off('click').on('click',function(){
                                    if(cur>1){
                                        var j =0;
                                        var html = '<tr><th>部门</th><th>日期</th><th>工资号</th><th>姓名</th><th>车间发放人</th><th>车间发放日期</th><th>教育科发放人</th><th>教育科发放日期</th></tr>';
                                        for(var i in data){
                                            if(j>10*(cur-2)-1 && j<10*(cur-1) && i ){
                                                j++;
                                                html += '<tr>';
                                                for(var m in data[i]){
                                                    html += '<td>'+data[i][m]+'</td>';
                                                }
                                                html += '</tr>'
                                            }else{
                                                j++;
                                            }
                                        }
                                        $("#dataTable").empty().append(html);
                                        cur-=1;
                                        $("#dataPage .cur").text(cur);
                                    }

                                })
                            }
                        }else{
                            alert('暂无审核记录');
                        }
                    },
                    beforeSend:function(){
                        loadingPicOpen();
                        testSession(userSessionInfo);
                    },
                    complete: function (XMLHttpRequest,status) {
                        loadingPicClose();
                        if(status === 'timeout') {
                            ajaxTimeOut1.abort();    // 超时后中断请求
                            alert('网络超时，请检查网络连接');
                        }
                    }
                })
            }else if(name === csData['cjtjxx-zxjl']['nr2']){
                //呈现注销记录表
                var ajaxTimeOut1 = $.ajax({
                    url: "../../../index.php",
                    type:"POST",
                    timeout:8000,
                    //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                    data:{funcName:'select',where:' where department like \''+department+'%\' AND changeType =\''+csData['czlb-zx']['nr2']+'\'',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                        tableName:' bgxx ',column:' department,lotNumber,payId,UName,changeType,changeReason,jykOperator',order:' order by lotnumber,payid'},
                    dataType:'json',
                    success:function(data){
                        if(data['success'] === 1){
                            delete data['success'];
                            var count = data['count'];
                            delete data['count'];
                            for(var i in data){
                                if(data[i]['department'].split(',').length>1){
                                    data[i]['department'] = data[i]['department'].split(',')[0];
                                }
                            }
                            var html = '<tr><th>部门</th><th>日期</th><th>工资号</th><th>姓名</th><th>操作类别</th><th>注销原因</th><th>教育科经办人</th></tr>';
                            if(count<11){
                                for(var i in data){
                                    html += '<tr>';
                                    for(var j in data[i]){
                                        html += '<td>'+data[i][j]+'</td>';
                                    }
                                    html += '</tr>'
                                }
                                $("#dataTable").empty().append(html);
                                //空白tr补齐表格
                                if($("#dataTable tbody tr").length<11){
                                    html = '';
                                    var count = 11-$("#dataTable tbody tr").length;
                                    var columns = $("#dataTable tbody tr:first-child th").length;
                                    for(var m=0;m<count;m++){
                                        html+='<tr>';
                                        for(var n=0;n<columns;n++){
                                            html+="<td></td>";
                                        }
                                        html+="</tr>";
                                    }
                                    $("#dataTable tbody").append(html);
                                }
                            }else{
                                var q =0;
                                var cur =1;
                                var total = Math.ceil(count/10);
                                $("#dataPage").css("display",'block');
                                for(var i in data){
                                    html += '<tr>';
                                    for(var j in data[i]){
                                        html += '<td>'+data[i][j]+'</td>';
                                    }
                                    html += '</tr>';
                                    q+=1;
                                    if(q>9){
                                        break
                                    }
                                }
                                $("#dataTable").empty().append(html);
                                $("#dataPage .cur").text(cur);
                                $("#dataPage .total").text(total);
                                $("#dataPage .next").off('click').on('click',function(){
                                    if(cur<total){
                                        var j =0;
                                        var html = '<tr><th>部门</th><th>日期</th><th>工资号</th><th>姓名</th><th>操作类别</th><th>注销原因</th><th>教育科经办人</th></tr>';
                                        for(var i in data){
                                            if(j>10*cur-1 && j<10*(cur+1) && i ){
                                                j++;
                                                html += '<tr>';
                                                for(var m in data[i]){
                                                    html += '<td>'+data[i][m]+'</td>';
                                                }
                                                html += '</tr>'
                                            }else{
                                                j++;
                                            }
                                        }
                                        $("#dataTable").empty().append(html);
                                        //空白tr补齐表格
                                        if($("#dataTable tbody tr").length<11){
                                            html = '';
                                            var count = 11-$("#dataTable tbody tr").length;
                                            var columns = $("#dataTable tbody tr:first-child th").length;
                                            for(var m=0;m<count;m++){
                                                html+='<tr>';
                                                for(var n=0;n<columns;n++){
                                                    html+="<td></td>";
                                                }
                                                html+="</tr>";
                                            }
                                            $("#dataTable tbody").append(html);
                                        }
                                        cur+=1;
                                        $("#dataPage .cur").text(cur);
                                    }

                                })
                                $("#dataPage .prev").off('click').on('click',function(){
                                    if(cur>1){
                                        var j =0;
                                        var html = '<tr><th>部门</th><th>日期</th><th>工资号</th><th>姓名</th><th>操作类别</th><th>注销原因</th><th>教育科经办人</th></tr>';
                                        for(var i in data){
                                            if(j>10*(cur-2)-1 && j<10*(cur-1) && i ){
                                                j++;
                                                html += '<tr>';
                                                for(var m in data[i]){
                                                    html += '<td>'+data[i][m]+'</td>';
                                                }
                                                html += '</tr>'
                                            }else{
                                                j++;
                                            }
                                        }
                                        $("#dataTable").empty().append(html);
                                        cur-=1;
                                        $("#dataPage .cur").text(cur);
                                    }

                                })
                            }
                        }else{
                            alert('暂无注销记录');
                        }
                    },
                    beforeSend:function(){
                        loadingPicOpen();
                        testSession(userSessionInfo);
                    },
                    complete: function (XMLHttpRequest,status) {
                        loadingPicClose();
                        if(status === 'timeout') {
                            ajaxTimeOut1.abort();    // 超时后中断请求
                            alert('网络超时，请检查网络连接');
                        }
                    }
                })
            }else if(name === csData['cjtjxx-dcjl']['nr2']){
                //呈现调出记录表
                var ajaxTimeOut1 = $.ajax({
                    url: "../../../index.php",
                    type:"POST",
                    timeout:8000,
                    //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                    data:{funcName:'select',where:' where department like \''+department+'%\' AND changeType =\''+csData['czlb-dc']['nr2']+'\'',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                        tableName:' bgxx ',column:' department,lotNumber,payId,UName,changeType,jykOperator',order:' order by lotnumber,payid'},
                    dataType:'json',
                    success:function(data){
                        if(data['success'] === 1){
                            delete data['success'];
                            var count = data['count'];
                            delete data['count'];
                            for(var i in data){
                                if(data[i]['department'].split(',').length>1){
                                    data[i]['department'] = data[i]['department'].split(',')[0];
                                }
                            }
                            var html = '<tr><th>部门</th><th>日期</th><th>工资号</th><th>姓名</th><th>操作类别</th><th>教育科经办人</th></tr>';
                            if(count<11){
                                for(var i in data){
                                    html += '<tr>';
                                    for(var j in data[i]){
                                        html += '<td>'+data[i][j]+'</td>';
                                    }
                                    html += '</tr>'
                                }
                                $("#dataTable").empty().append(html);
                                //空白tr补齐表格
                                if($("#dataTable tbody tr").length<11){
                                    html = '';
                                    var count = 11-$("#dataTable tbody tr").length;
                                    var columns = $("#dataTable tbody tr:first-child th").length;
                                    for(var m=0;m<count;m++){
                                        html+='<tr>';
                                        for(var n=0;n<columns;n++){
                                            html+="<td></td>";
                                        }
                                        html+="</tr>";
                                    }
                                    $("#dataTable tbody").append(html);
                                }
                            }else{
                                var q =0;
                                var cur =1;
                                var total = Math.ceil(count/10);
                                $("#dataPage").css("display",'block');
                                for(var i in data){
                                    html += '<tr>';
                                    for(var j in data[i]){
                                        html += '<td>'+data[i][j]+'</td>';
                                    }
                                    html += '</tr>';
                                    q+=1;
                                    if(q>9){
                                        break
                                    }
                                }
                                $("#dataTable").empty().append(html);
                                $("#dataPage .cur").text(cur);
                                $("#dataPage .total").text(total);
                                $("#dataPage .next").off('click').on('click',function(){
                                    if(cur<total){
                                        var j =0;
                                        var html = '<tr><th>部门</th><th>日期</th><th>工资号</th><th>姓名</th><th>操作类别</th><th>教育科经办人</th></tr>';
                                        for(var i in data){
                                            if(j>10*cur-1 && j<10*(cur+1) && i ){
                                                j++;
                                                html += '<tr>';
                                                for(var m in data[i]){
                                                    html += '<td>'+data[i][m]+'</td>';
                                                }
                                                html += '</tr>'
                                            }else{
                                                j++;
                                            }
                                        }
                                        $("#dataTable").empty().append(html);
                                        //空白tr补齐表格
                                        if($("#dataTable tbody tr").length<11){
                                            html = '';
                                            var count = 11-$("#dataTable tbody tr").length;
                                            var columns = $("#dataTable tbody tr:first-child th").length;
                                            for(var m=0;m<count;m++){
                                                html+='<tr>';
                                                for(var n=0;n<columns;n++){
                                                    html+="<td></td>";
                                                }
                                                html+="</tr>";
                                            }
                                            $("#dataTable tbody").append(html);
                                        }
                                        cur+=1;
                                        $("#dataPage .cur").text(cur);
                                    }

                                })
                                $("#dataPage .prev").off('click').on('click',function(){
                                    if(cur>1){
                                        var j =0;
                                        var html = '<tr><th>部门</th><th>日期</th><th>工资号</th><th>姓名</th><th>操作类别</th><th>教育科经办人</th></tr>';
                                        for(var i in data){
                                            if(j>10*(cur-2)-1 && j<10*(cur-1) && i ){
                                                j++;
                                                html += '<tr>';
                                                for(var m in data[i]){
                                                    html += '<td>'+data[i][m]+'</td>';
                                                }
                                                html += '</tr>'
                                            }else{
                                                j++;
                                            }
                                        }
                                        $("#dataTable").empty().append(html);
                                        cur-=1;
                                        $("#dataPage .cur").text(cur);
                                    }

                                })
                            }
                        }else{
                            alert('暂无调出记录');
                        }
                    },
                    beforeSend:function(){
                        loadingPicOpen();
                        testSession(userSessionInfo);
                    },
                    complete: function (XMLHttpRequest,status) {
                        loadingPicClose();
                        if(status === 'timeout') {
                            ajaxTimeOut1.abort();    // 超时后中断请求
                            alert('网络超时，请检查网络连接');
                        }
                    }
                })
            }else if(name === csData['cjtjxx-xzjl']['nr2']){
                //呈现新增记录表
                var ajaxTimeOut1 = $.ajax({
                    url: "../../../index.php",
                    type:"POST",
                    timeout:8000,
                    //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                    data:{funcName:'select',where:' where department like \''+department+'%\' AND changeType =\''+csData['czlb-levelup2']['nr2']+'\'',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                        tableName:' bgxx ',column:' department,lotNumber,payId,UName,changeType,driveCode,drive,jykOperator',order:' order by lotnumber,payid'},
                    dataType:'json',
                    success:function(data){
                        if(data['success'] === 1){
                            delete data['success'];
                            var count = data['count'];
                            delete data['count'];
                            for(var i in data){
                                if(data[i]['department'].split(',').length>1){
                                    data[i]['department'] = data[i]['department'].split(',')[0];
                                }
                            }
                            var html = '<tr><th>部门</th><th>日期</th><th>工资号</th><th>姓名</th><th>操作类别</th><th>准驾代码</th><th>准驾类型</th><th>教育科经办人</th></tr>';
                            if(count<11){
                                for(var i in data){
                                    html += '<tr>';
                                    for(var j in data[i]){
                                        html += '<td>'+data[i][j]+'</td>';
                                    }
                                    html += '</tr>'
                                }
                                $("#dataTable").empty().append(html);
                                //空白tr补齐表格
                                if($("#dataTable tbody tr").length<11){
                                    html = '';
                                    var count = 11-$("#dataTable tbody tr").length;
                                    var columns = $("#dataTable tbody tr:first-child th").length;
                                    for(var m=0;m<count;m++){
                                        html+='<tr>';
                                        for(var n=0;n<columns;n++){
                                            html+="<td></td>";
                                        }
                                        html+="</tr>";
                                    }
                                    $("#dataTable tbody").append(html);
                                }
                            }else{
                                var q =0;
                                var cur =1;
                                var total = Math.ceil(count/10);
                                $("#dataPage").css("display",'block');
                                for(var i in data){
                                    html += '<tr>';
                                    for(var j in data[i]){
                                        html += '<td>'+data[i][j]+'</td>';
                                    }
                                    html += '</tr>';
                                    q+=1;
                                    if(q>9){
                                        break
                                    }
                                }
                                $("#dataTable").empty().append(html);
                                $("#dataPage .cur").text(cur);
                                $("#dataPage .total").text(total);
                                $("#dataPage .next").off('click').on('click',function(){
                                    if(cur<total){
                                        var j =0;
                                        var html = '<tr><th>部门</th><th>日期</th><th>工资号</th><th>姓名</th><th>操作类别</th><th>准驾代码</th><th>准驾类型</th><th>教育科经办人</th></tr>';
                                        for(var i in data){
                                            if(j>10*cur-1 && j<10*(cur+1) && i ){
                                                j++;
                                                html += '<tr>';
                                                for(var m in data[i]){
                                                    html += '<td>'+data[i][m]+'</td>';
                                                }
                                                html += '</tr>'
                                            }else{
                                                j++;
                                            }
                                        }
                                        $("#dataTable").empty().append(html);
                                        //空白tr补齐表格
                                        if($("#dataTable tbody tr").length<11){
                                            html = '';
                                            var count = 11-$("#dataTable tbody tr").length;
                                            var columns = $("#dataTable tbody tr:first-child th").length;
                                            for(var m=0;m<count;m++){
                                                html+='<tr>';
                                                for(var n=0;n<columns;n++){
                                                    html+="<td></td>";
                                                }
                                                html+="</tr>";
                                            }
                                            $("#dataTable tbody").append(html);
                                        }
                                        cur+=1;
                                        $("#dataPage .cur").text(cur);
                                    }

                                })
                                $("#dataPage .prev").off('click').on('click',function(){
                                    if(cur>1){
                                        var j =0;
                                        var html = '<tr><th>部门</th><th>日期</th><th>工资号</th><th>姓名</th><th>操作类别</th><th>准驾代码</th><th>准驾类型</th><th>教育科经办人</th></tr>';
                                        for(var i in data){
                                            if(j>10*(cur-2)-1 && j<10*(cur-1) && i ){
                                                j++;
                                                html += '<tr>';
                                                for(var m in data[i]){
                                                    html += '<td>'+data[i][m]+'</td>';
                                                }
                                                html += '</tr>'
                                            }else{
                                                j++;
                                            }
                                        }
                                        $("#dataTable").empty().append(html);
                                        cur-=1;
                                        $("#dataPage .cur").text(cur);
                                    }

                                })
                            }
                        }else{
                            alert('暂无新增记录');
                        }
                    },
                    beforeSend:function(){
                        loadingPicOpen();
                        testSession(userSessionInfo);
                    },
                    complete: function (XMLHttpRequest,status) {
                        loadingPicClose();
                        if(status === 'timeout') {
                            ajaxTimeOut1.abort();    // 超时后中断请求
                            alert('网络超时，请检查网络连接');
                        }
                    }
                })
            }
        }
        //V级权限人员，先执行这个函数
        function appendDataTableV(name){
            var html = '<select class="department"><option>--请选择--</option>';
            for(var i in csData){
                if(csData[i]['lb'] === 'ssbm'){
                    html += '<option>'+csData[i]['nr1']+'</option>'
                }
            }
            html+='</select>';
            if(name === '--请选择--'){

            }else if(name === csData['cjtjxx-shjl']['nr2']){
                if($("#dataBanner .department").length>0){
                    $("#dataBanner .department").remove()
                }
                $("#dataBanner").append(html);
                $('#dataBanner .department').off('change').on('change',function(){
                    appendDataTable(csData['cjtjxx-shjl']['nr2'],$(this).val())
                })
            }else if(name === csData['cjtjxx-ffjl']['nr2']){
                if($("#dataBanner .department").length>0){
                    $("#dataBanner .department").remove()
                }
                $("#dataBanner").append(html);
                $('#dataBanner .department').off('change').on('change',function(){
                    appendDataTable(csData['cjtjxx-ffjl']['nr2'],$(this).val())
                })
            }else if(name === csData['cjtjxx-zxjl']['nr2']){
                if($("#dataBanner .department").length>0){
                    $("#dataBanner .department").remove()
                }
                $("#dataBanner").append(html);
                $('#dataBanner .department').off('change').on('change',function(){
                    appendDataTable(csData['cjtjxx-zxjl']['nr2'],$(this).val())
                })
            }else if(name === csData['cjtjxx-dcjl']['nr2']){
                if($("#dataBanner .department").length>0){
                    $("#dataBanner .department").remove()
                }
                $("#dataBanner").append(html);
                $('#dataBanner .department').off('change').on('change',function(){
                    appendDataTable(csData['cjtjxx-dcjl']['nr2'],$(this).val())
                })
            }else if(name === csData['cjtjxx-xzjl']['nr2']){
                if($("#dataBanner .department").length>0){
                    $("#dataBanner .department").remove()
                }
                $("#dataBanner").append(html);
                $('#dataBanner .department').off('change').on('change',function(){
                    appendDataTable(csData['cjtjxx-xzjl']['nr2'],$(this).val())
                })
            }

        }
    }

    //添加发放信息
    function appendGiveOut(csData){
        var power = sessionGet('power');
        var obj = {};
        obj.column = ' id,department,payId,UName,cjArriveDate,grArriveDate ';
        obj.order = ' order by department,payId ';
        if(power === '1'){
            var department = sessionGet('department');
            //添加目前已经发放到车间的信息
            obj.where = ' where checkStatus = \''+csData['checkStatus-shtg']['nr2']+'\' AND finishStatus = \''+csData['finishStatus-ffdcj']['nr2']+'\' AND department =\''+department+'\'';
            appendGiveOutTable(obj)
        }
        if(power === 'V'){
            obj.where = ' where checkStatus = \''+csData['checkStatus-shtg']['nr2']+'\' AND finishStatus !=\''+csData['finishStatus-ffdcj']['nr2']+'\' AND finishStatus !=\''+csData['finishStatus-ffdgr']['nr2']+'\'';
            appendGiveOutTable(obj)
        }

        function appendGiveOutTable(obj){
            var power = sessionGet('power');
            var text ='';
            if(power === '1'){
                text = '发放到个人';
            }else if(power ==='V'){
                text = '发放到车间';
            }
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
                        var html = '<tr><th>部门</th><th>工资号</th><th>姓名</th><th>发到车间日期</th><th>发到个人日期</th><th>操作</th></tr>';
                        for(var y in data){
                            if(data[y]['department'].split(',').length>1){
                                data[y]['department'] = data[y]['department'].split(',')[0];
                            }
                        }
                        if(count<11){
                            for(var i in data){
                                html += '<tr>';
                                for(var j in data[i]){
                                    if(j==='id'){
                                        continue
                                    }
                                    html += '<td class="'+data[i]['id']['date']+'">'+data[i][j]+'</td>';
                                }
                                html += '<td><span class="giveOut"></span></td>';
                                html += '</tr>'
                            }
                            $("#giveOutTable").empty().append(html);
                            for(var i =0;i<$("#giveOutTable tbody tr td .giveOut").length;i++){
                                //做如下判断：如果发到个人日期中的文本indexof"-"<0，说明还没发到个人，继续判断发放到车间日期
                                //通过结果，决定按钮的内容
                                if($("#giveOutTable tbody tr td .giveOut:eq("+i+")").parent().prev().text().indexOf('-')<0){
                                    if($("#giveOutTable tbody tr td .giveOut:eq("+i+")").parent().prev().prev().text().indexOf('-')<0){
                                        $("#giveOutTable tbody tr td .giveOut:eq("+i+")").text(text)
                                    }else if($("#giveOutTable tbody tr td .giveOut:eq("+i+")").parent().prev().prev().text().indexOf('-')>=0 && power==='1'){
                                        $("#giveOutTable tbody tr td .giveOut:eq("+i+")").text(text)
                                    }
                                }
                            }
                            boundGiveOutEvent();
                            //空白tr补齐表格
                            if($("#fixCheckTable tbody tr").length<11){
                                html = '';
                                var count = 11-$("#giveOutTable tbody tr").length;
                                var columns = $("#giveOutTable tbody tr:first-child th").length;
                                for(var m=0;m<count;m++){
                                    html+='<tr>';
                                    for(var n=0;n<columns;n++){
                                        html+="<td></td>";
                                    }
                                    html+="</tr>";
                                }
                                $("#giveOutTable tbody").append(html);
                            }
                        }else{
                            var q =0;
                            var cur =1;
                            var total = Math.ceil(count/10);
                            $("#giveOutPage").css("display",'block');
                            for(var i in data){
                                html += '<tr>';
                                for(var j in data[i]){
                                    if(j==='id'){
                                        continue
                                    }
                                    html += '<td class="'+data[i]['id']['date']+'">'+data[i][j]+'</td>';
                                }
                                html += '<td><span class="giveOut"></span></td>';
                                html += '</tr>'
                                q+=1;
                                if(q>9){
                                    break
                                }
                            }
                            $("#giveOutTable").empty().append(html);
                            for(var i =0;i<$("#giveOutTable tbody tr td .giveOut").length;i++){
                                //做如下判断：如果发到个人日期中的文本indexof"-"<0，说明还没发到个人，继续判断发放到车间日期
                                //通过结果，决定按钮的内容
                                if($("#giveOutTable tbody tr td .giveOut:eq("+i+")").parent().prev().text().indexOf('-')<0){
                                    if($("#giveOutTable tbody tr td .giveOut:eq("+i+")").parent().prev().prev().text().indexOf('-')<0){
                                        $("#giveOutTable tbody tr td .giveOut:eq("+i+")").text(text)
                                    }else if($("#giveOutTable tbody tr td .giveOut:eq("+i+")").parent().prev().prev().text().indexOf('-')>=0 && power==='1'){
                                        $("#giveOutTable tbody tr td .giveOut:eq("+i+")").text(text)
                                    }
                                }
                            }
                            boundGiveOutEvent();
                            $("#giveOutPage .cur").text(cur);
                            $("#giveOutPage .total").text(total);
                            $("#giveOutPage .next").off('click').on('click',function(){
                                if(cur<total){
                                    var j =0;
                                    var html = '<tr><th>部门</th><th>工资号</th><th>姓名</th><th>发到车间日期</th><th>发到个人日期</th><th>操作</th></tr>';
                                    for(var i in data){
                                        if(j>10*cur-1 && j<10*(cur+1) && i ){
                                            j++;
                                            html += '<tr>';
                                            for(var m in data[i]){
                                                if(m==='id'){
                                                    continue
                                                }
                                                html += '<td class="'+data[i]['id']['date']+'">'+data[i][m]+'</td>';
                                            }
                                            html += '<td><span class="giveOut"></span></td>';
                                            html += '</tr>'
                                        }else{
                                            j++;
                                        }
                                    }
                                    $("#giveOutTable").empty().append(html);
                                    for(var i =0;i<$("#giveOutTable tbody tr td .giveOut").length;i++){
                                        //做如下判断：如果发到个人日期中的文本indexof"-"<0，说明还没发到个人，继续判断发放到车间日期
                                        //通过结果，决定按钮的内容
                                        if($("#giveOutTable tbody tr td .giveOut:eq("+i+")").parent().prev().text().indexOf('-')<0){
                                            if($("#giveOutTable tbody tr td .giveOut:eq("+i+")").parent().prev().prev().text().indexOf('-')<0){
                                                $("#giveOutTable tbody tr td .giveOut:eq("+i+")").text(text)
                                            }else if($("#giveOutTable tbody tr td .giveOut:eq("+i+")").parent().prev().prev().text().indexOf('-')>=0 && power==='1'){
                                                $("#giveOutTable tbody tr td .giveOut:eq("+i+")").text(text)
                                            }
                                        }
                                    }
                                    boundGiveOutEvent();
                                    //空白tr补齐表格
                                    if($("#giveOutTable tbody tr").length<11){
                                        html = '';
                                        var count = 11-$("#giveOutTable tbody tr").length;
                                        var columns = $("#giveOutTable tbody tr:first-child th").length;
                                        for(var m=0;m<count;m++){
                                            html+='<tr>';
                                            for(var n=0;n<columns;n++){
                                                html+="<td></td>";
                                            }
                                            html+="</tr>";
                                        }
                                        $("#giveOutTable tbody").append(html);
                                    }
                                    cur+=1;
                                    $("#giveOutPage .cur").text(cur);
                                }

                            })
                            $("#giveOutPage .prev").off('click').on('click',function(){
                                if(cur>1){
                                    var j =0;
                                    var html = '<tr><th>部门</th><th>工资号</th><th>姓名</th><th>发到车间日期</th><th>发到个人日期</th><th>操作</th></tr>';
                                    for(var i in data){
                                        if(j>10*(cur-2)-1 && j<10*(cur-1) && i ){
                                            j++;
                                            html += '<tr>';
                                            for(var m in data[i]){
                                                if(m==='id'){
                                                    continue
                                                }
                                                html += '<td class="'+data[i]['id']['date']+'">'+data[i][m]+'</td>';
                                            }
                                            html += '<td><span class="giveOut"></span></td>';
                                            html += '</tr>'
                                        }else{
                                            j++;
                                        }
                                    }
                                    $("#giveOutTable").empty().append(html);
                                    for(var i =0;i<$("#giveOutTable tbody tr td .giveOut").length;i++){
                                        //做如下判断：如果发到个人日期中的文本indexof"-"<0，说明还没发到个人，继续判断发放到车间日期
                                        //通过结果，决定按钮的内容
                                        if($("#giveOutTable tbody tr td .giveOut:eq("+i+")").parent().prev().text().indexOf('-')<0){
                                            if($("#giveOutTable tbody tr td .giveOut:eq("+i+")").parent().prev().prev().text().indexOf('-')<0){
                                                $("#giveOutTable tbody tr td .giveOut:eq("+i+")").text(text)
                                            }else if($("#giveOutTable tbody tr td .giveOut:eq("+i+")").parent().prev().prev().text().indexOf('-')>=0 && power==='1'){
                                                $("#giveOutTable tbody tr td .giveOut:eq("+i+")").text(text)
                                            }
                                        }
                                    }
                                    boundGiveOutEvent();
                                    cur-=1;
                                    $("#giveOutPage .cur").text(cur);
                                }
                            })
                        }
                    }
                    else {
                        $("#giveOutBanner").empty().text('暂无发放信息');
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


            function boundGiveOutEvent(){
                var user = sessionGet('user')
                var setStr ='';
                var confirmP ='';
                var id='';
                var arriveDate = new Date();
                arriveDate.month = arriveDate.getMonth() < 9 ? '0' + (arriveDate.getMonth() + 1) : arriveDate.getMonth() + 1;
                arriveDate.date = arriveDate.getDate() < 10 ? '0' + arriveDate.getDate() : arriveDate.getDate();
                arriveDate = arriveDate.getFullYear() + '-' + arriveDate.month + '-' + arriveDate.date;

                $("#giveOutTable .giveOut").off('click').on('click',function(){
                    var power = sessionGet('power');
                    var _this = $(this);
                    var payId = $(this).parent().prev().prev().prev().prev().text();
                    var thisName = $(this).parent().prev().prev().prev().text();
                    if(power === '1'){
                        setStr = ' grArriveDate = \''+ arriveDate +'\',finishStatus = \''+csData['finishStatus-ffdgr']['nr2']+'\' ,cjArriveOperator = \''+user+'\'';
                        confirmP = '请确认'+thisName+'师傅的驾驶证已发放到本人手中';
                    }else if(power === 'V'){
                        setStr = ' cjArriveDate = \''+ arriveDate +'\',finishStatus = \''+csData['finishStatus-ffdcj']['nr2']+'\' ,jykArriveOperator = \''+user+'\'';
                        confirmP = '请确认'+thisName+'师傅的驾驶证已发放到其所属车间';
                    }
                    id=$(this).parent().prev().prop('className').substring(0,$(this).parent().prev().prop('className').length-3);
                    if(confirm(confirmP)){
                        var ajaxTimeOut = $.ajax({
                            url: "../../../index.php",
                            type: "POST",
                            timeout: 8000,
                            data: {
                                funcName: 'update',
                                serverName: '10.101.62.73',
                                uid: 'sa',
                                pwd: '2huj15h1',
                                Database: 'jszgl',
                                tableName: ' bgxx',
                                setStr:setStr,
                                where:' where id =\''+id+'\''
                            },
                            dataType: 'json',
                            success: function (data) {
                                if(power==='1'){
                                    $(_this).parent().prev().text(arriveDate)
                                    $(_this).remove();
                                    //发放到个人后，证件状态更新为“正常”
                                    $.ajax({
                                        url: "../../../index.php",
                                        type: "POST",
                                        timeout: 8000,
                                        data: {
                                            funcName: 'update',
                                            serverName: '10.101.62.73',
                                            uid: 'sa',
                                            pwd: '2huj15h1',
                                            Database: 'jszgl',
                                            tableName: ' jbxx',
                                            setStr: ' status = \''+csData['zjzt-zc']['nr2']+'\'',
                                            where: ' where payid =\'' + payId + '\''
                                        },
                                        dataType: 'json',
                                        success:function(data){

                                        }
                                    })
                                }else if(power==='V'){
                                    $(_this).parent().prev().prev().text(arriveDate)
                                    $(_this).remove()
                                }
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
                })
            }
        }
    }

    //以下是普通用户所用函数
    //普通用户渲染页面的函数
    function normalUser() {
        console.log(1)
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
                $("#cardPicContent img").attr('src',data['row']['cardPath']);
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
                    where: ' where payId = \'' + payId + '\' AND (finishStatus != \''+csData['finishStatus-ffdgr']['nr2']+'\' AND checkStatus != \''+csData['checkStatus-shwtg']['nr2']+'\')',
                    order: ' '
                },
                dataType: 'json',
                success: function (data) {
                    //说明此人有待办的申请，不予新增请求
                    if (data['success'] === 1) {
                        alert('您还有尚未完结的' + data['changeType'] + '申请,不允许重复提交')
                    } else {
                        $("#fixButton").css('display', 'none');
                        $("#yxqmButton").css('display', 'none');
                        $("#fyxqmButton").css('display', 'none');
                        $("#fixTable").css('visibility', 'visible');
                        $("#print").css('visibility', 'visible');
                        $("#applySubmit").css('visibility', 'visible');
                        $("#rightContent").css('width', '84%');
                        $(".operateContent").css('margin', 0);
                        getUserinfo(payId,csData['czlb-bz']['name']);
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

    //有效期满换证
    $("#yxqmButton").off('click').on('click', function () {
        if (confirm('是否确定要申请换发驾驶证？\u000d请注意，发出申请不可修改，请谨慎操作！')) {
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
                    where: ' where payId = \'' + payId + '\' AND (finishStatus != \''+csData['finishStatus-ffdgr']['nr2']+'\' AND checkStatus != \''+csData['checkStatus-shwtg']['nr2']+'\')',
                    order: ' '
                },
                dataType: 'json',
                success: function (data) {
                    //说明此人有待办的申请，不予新增请求
                    if (data['success'] === 1) {
                        alert('您还有尚未完结的' + data['changeType'] + '申请,不允许重复提交')
                    } else {
                        $("#fixButton").css('display', 'none');
                        $("#yxqmButton").css('display', 'none');
                        $("#fyxqmButton").css('display', 'none');
                        $("#fixTable").css('visibility', 'visible');
                        $("#print").css('visibility', 'visible');
                        $("#applySubmit").css('visibility', 'visible');
                        $("#rightContent").css('width', '84%');
                        $(".operateContent").css('margin', 0);
                        getUserinfo(payId,csData['czlb-yxqmhz']['name']);
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

    //非有效期满换证
    $("#fyxqmButton").off('click').on('click', function () {
        if (confirm('是否确定要申请换发驾驶证？\u000d请注意，发出申请不可修改，请谨慎操作！')) {
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
                    where: ' where payId = \'' + payId + '\' AND (finishStatus != \''+csData['finishStatus-ffdgr']['nr2']+'\' AND checkStatus != \''+csData['checkStatus-shwtg']['nr2']+'\')',
                    order: ' '
                },
                dataType: 'json',
                success: function (data) {
                    //说明此人有待办的申请，不予新增请求
                    if (data['success'] === 1) {
                        alert('您还有尚未完结的' + data['changeType'] + '申请,不允许重复提交')
                    } else {
                        $("#fixButton").css('display', 'none');
                        $("#yxqmButton").css('display', 'none');
                        $("#fyxqmButton").css('display', 'none');
                        $("#fixTable").css('visibility', 'visible');
                        $("#print").css('visibility', 'visible');
                        $("#applySubmit").css('visibility', 'visible');
                        $("#rightContent").css('width', '84%');
                        $(".operateContent").css('margin', 0);
                        getUserinfo(payId,csData['czlb-fyxqmhz']['name']);
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
    function getUserinfo(payId,changeType) {
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
                        fillInTable(data['row'], cardData['row'],changeType);
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
    function fillInTable(data, cardData, changeType) {
        var cardId = [];
        //这两行是目前没有真实数据，模拟的数据，发布后记得删掉
        cardData['sjDriveCode'] = 'J1';
        cardData['sjDate'] = '1994-12-12';
        //用从全员信息库取出的数据填写基本信息
        for (var i = 0; i < data['cardid'].length; i++) {
            cardId[i] = data['cardid'][i];
            $(".cardIdInTable:eq(" + i + ")").text(cardId[i]);
        }
        //公共信息
        $("#nameInTable").text(data['uname']);
        $("#sexInTable").text(data['sex']);
        $("#birthYearInTable").text(data['birthdate'].split('-')[0]);
        $("#birthMonthInTable").text(data['birthdate'].split('-')[1]);
        $("#birthDateInTable").text(data['birthdate'].split('-')[2]);
        $("#mobilePhoneInTable").text(data['phone1']);
        $("#companyInTable").text('郑州局集团');
        $("#addressInTable").val(data['address']);
        $("#mailInTable").val(410000);
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
        $("#originYearInTable").text(cardData['sjDate'].split('-')[0]);
        $("#originMonthInTable").text(cardData['sjDate'].split('-')[1]);
        $("#originDateInTable").text(cardData['sjDate'].split('-')[2]);
        //判断操作类别
        if(changeType === csData['czlb-bz']['name']){//丢失，补证
            $("#changeCheckBox").prop({"disabled": true,'checked':false});
            $("#fixCheckBox").prop({"disabled": true, "checked": "checked"});
            $("#cardLost").prop({
                'checked': 'checked',
                'disabled': true
            }).parent('div').siblings('div').children('input').prop({'disabled': true,'checked':false});
        }else if(changeType === csData['czlb-yxqmhz']['name']){//有效期满换证
            $("#fixCheckBox").prop({"disabled": true,'checked':false});
            $("#changeCheckBox").prop({"disabled": true, "checked": "checked"});
            $("#reasonDeadline").prop({
                'checked': 'checked',
                'disabled': true
            }).parent('div').siblings('div').children('input').prop({'disabled': true,'checked':false});
        }else if(changeType === csData['czlb-fyxqmhz']['name']){//非有效期满换证。该功能尚未完全
            $("#fixCheckBox").prop({"disabled": true,'checked':false});
            $("#changeCheckBox").prop({"disabled": true, "checked": "checked"});
            $(".apply input").prop({
                'disabled':false,
                'checked':false
            })
            $(".reason div input").prop({
                'disabled':true,
                'checked':false
            })
            $(".fyxqmhz").prop({
                'disabled':false
            })
            $('.apply input').off('change').on('change',function(){
                $(this).siblings('input').prop('checked',false)
            })
            $('.fyxqmhz').off('click').on('click',function(){
                $(this).parent().siblings('div').children('input').prop('checked',false);
                $("#otherReasonText").prop('disabled',true);
                if($(this).prop('id') === 'otherReason'){
                    $("#otherReasonText").prop('disabled',false).focus();
                }
            })
            //此处还要加准驾类型的判断，只能申请比原证级别低的
        }




        //添加提交事件
        $("#applySubmit").off('click').on('click', function () {
            if($('.apply input:checked').length<1 || $(".reason div input:checked").length<1){
                alert('请完整填写表格')
            }else if($("#otherReason").prop('checked') && $("#otherReasonText").val().length<1){
                alert('请填写换证原因')
            }else{
                if (confirm('请确认提交内容真实有效且正确无误！提交请点“确定”，返回请点“取消”')) {
                    appendApply(data, cardData, csData,changeType);
                }
            }

        })
        $("#print").off('click').on('click', print);
    }

    //用户提交换补申请，发ajax更新bgxx表,
    // 根据changeType，如果是补证，在jbxx表中将此人证件的status改为丢失或损毁。换证不用
    //并在sqxx表中插入该条申请的信息
    function appendApply(data, cardData, csData, changeType) {
        changeType = csData['czlb-'+changeType]['nr3'];
        var payId = sessionGet('payId');
        var department = sessionGet('department');
        var UName = sessionGet('user');
        var cardId = data['cardid'];
        var archivesId = data['archivesId'];
        //以下变量用来更新jbxx表
        var status = '';
        var where = ' where payid = \'' + payId + '\'';
        var changeReason =''
        var needed = csData['needed-hbzsqb']['nr2'] ;
        //根据用户勾选，取变更原因
        if ($("#cardLost").prop('checked')) {
            changeReason = csData['bzyy-jszds']['nr2'];
            status =csData['zjzt-ds']['nr2'];
            needed = csData['needed-hbzsqb']['nr2'] + ',' + csData['needed-jszdszm']['nr2']
        } else if ($("#cardBreak").prop('checked')) {
            changeReason = csData['bzyy-jszsh']['nr2'];
            status =csData['zjzt-sh']['nr2'];
            needed = csData['needed-hbzsqb']['nr2'] + ',' + csData['needed-jszdszm']['nr2']
        }else if($("#reasonDeadline").prop('checked')){
            changeReason = csData['hzyy-yxqm']['nr2'];
            status =csData['zjzt-hzz']['nr2'];
        }else if($("#reasonContChange").prop('checked')){
            changeReason = csData['hzyy-nrbh']['nr2'];
            status =csData['zjzt-hzz']['nr2'];
        }else if($("#reasonLower").prop('checked')){
            changeReason = csData['hzyy-jdzjjx']['nr2'];
            status =csData['zjzt-hzz']['nr2'];
        }else if($("#otherReason").prop('checked')){
            changeReason = $("#otherReasonText").val();
            status =csData['zjzt-hzz']['nr2'];
        }

        var driveCode = $(".origin input:checked").next('label').text();
        if (driveCode === '其他（') {
            driveCode = $("#originOtherInput").val()
        }
        var drive = csData['zjlx-' + driveCode]['nr1'];
        var applyDriveCode = $(".apply input:checked").next('label').text();
        var phyTest = $(".phyCheck input:checked").next('label').text();
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
                funcName: 'insert',
                serverName: '10.101.62.73',
                uid: 'sa',
                pwd: '2huj15h1',
                Database: 'jszgl',
                tableName: ' bgxx',
                column: ' (id,lotNumber,Department,payId,archivesId,UName,cardId,changeType,changeReason,' +
                'driveCode,drive,phyTest,needed,checkStatus,applyDriveCode)',
                values: '(getDate(),\'' + lotNumber + '\',\'' + department + '\',\'' + payId + '\',\'' + archivesId + '\',\'' + UName + '\',\'' + cardId + '\',\'' + changeType + '\',\''
                + changeReason + '\',\'' + driveCode + '\',\'' + drive + '\',\'' + phyTest + '\',\'' + needed + '\',\'' + checkStatus + '\',\''+applyDriveCode+'\')'
            },
            dataType: 'json',
            success: function () {
                $("#applySubmit").css('display', 'none');
                if(changeType === csData['czlb-bz']['nr3']){
                    alert('您的补证申请提交成功，请联系车间开具《驾驶证丢失证明》')
                }else{
                    alert('您的换证申请提交成功，请留意审核状态');
                }
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
        var fixedPhone = $("#fixedPhoneInTable").val();
        var mobilePhone = $("#mobilePhoneInTable").text();
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
                column: ' (id,date,Department,payId,UName,sex,cardId,changeType,changeReason,' +
                'driveCode,applyDriveCode,phyTest,fixedPhone,mobilePhone,company,address,mail,sjDate)',
                values: '(getDate(),\''+date+'\',\''+department + '\',\'' + payId + '\',\'' + UName + '\',\''+sex+'\',\'' + cardId + '\',\'' + changeType + '\',\''
                + changeReason + '\',\'' + driveCode + '\',\'' + applyDriveCode + '\',\'' + phyTest + '\',\'' + fixedPhone + '\',\'' + mobilePhone + '\',\''+company
                +'\',\''+address+'\',\''+mail+'\',\''+sjDate+'\')'
            },
            dataType: 'json',
            success: function (data) {

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
                //预警或过期
                if (data['row']['status'] === csData['zjzt-yj']['nr2'] || data['row']['status'] === csData['zjzt-gq']['nr2']) {
                    $("#alert").text('请及时换证或重新参加考试').css({'color': 'red', 'fontWeight': 'bold'})
                }//正常
                else if(data['row']['status'] === csData['zjzt-zc']['nr2']){

                }else{
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
                            console.log(data)
                            if (data['success'] == 1) {
                                //换证补证，执行以下
                                if (data['row']['changeType'] === csData['czlb-fyxqmhz']['nr3'] || data['row']['changeType'] === csData['czlb-yxqmhz']['nr3'] || data['row']['changeType'] === csData['czlb-bz']['nr3']) {
                                    $("#applyInfo").empty().append('您有一项未完结的 ' + data['row']['changeType'] + ' 申请，')
                                    $("#applyInfo").append('<span id="checkStatus"></span>\n' +
                                        '                    <span id="finishStatus"></span>\n' +
                                        '                    <span id="needed"></span>')
                                    //审核未通过，执行以下
                                    if (data['row']['checkStatus'] === csData['checkStatus-shwtg']['nr2']) {
                                        $("#checkStatus").empty().append('审核状态为：' + data['row']['checkStatus'] + '，原因是：' + data['row']['failedReason']+'，'+data['row']['shortage']);
                                    }//审核通过，执行以下
                                    else if(data['row']['checkStatus'] === csData['checkStatus-shtg']['nr2']){
                                        $("#checkStatus").empty().append('审核状态为：' + data['row']['checkStatus']);
                                        $("#finishStatus").empty().append('，发放状态为：' + data['row']['finishStatus'])
                                    }//审核中，执行以下
                                    else if(data['row']['checkStatus'] === csData['checkStatus-jykshz']['nr2']){
                                        $("#checkStatus").empty().append('审核状态为：' + data['row']['checkStatus']);
                                        $("#finishStatus").empty().append('，发放状态为：' + data['row']['finishStatus'])
                                    }else if(data['row']['checkStatus'] === csData['checkStatus-cjshz']['nr2']){
                                        $("#checkStatus").empty().append('审核状态为：' + data['row']['checkStatus']);
                                        $("#finishStatus").empty().append('，发放状态为：' + data['row']['finishStatus'])
                                        if (data['row']['changeType'] === csData['czlb-fyxqmhz']['nr3'] || data['row']['changeType'] === csData['czlb-yxqmhz']['nr3']) {

                                        } else if (data['row']['changeType'] === csData['czlb-bz']['nr3']) {
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
                            alert('驾驶证上传成功。请刷新页面来查看证件信息');
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