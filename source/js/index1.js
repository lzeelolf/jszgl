$(document).ready(function() {
    var queryCardButton = document.getElementById("queryCardButton");
    initialScreen();
    loginStatus();
    //记住登录时的session
    userSessionInfo = rememberSession('token', 'user', 'power', 'department','payId');
    //证件查询按钮的事件,调用displayQueryForm函数
    testSession(userSessionInfo)
    eventBound(queryCardButton, 'click', displayQueryForm);
    //以下这些部门人员较少，直接面向教育科，由教育科负责审核
    var straightJYK = ['安全生产指挥中心','技术科','综合分析室','安全科','职工教育科','统计信息科'];

    //取公用参数信息
    var csData = $.ajax({
        url: "../../../ways.php",
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
            appendSummary(csData)
            appendAppend(csData)
            //添加证件调整的select选择车间和注销原因
            var html='<option>--请选择--</option>';
            var _html='<option>--请选择--</option>';
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
        var index = $(this).index();
        testSession(userSessionInfo)
        if(power === 'V'){
            //教育科管理人员或车间管理人员
            if($(this).next().length>0) {
                $("#rightContent .operateContent>.jykUse:eq(" + index + ")").css('display', 'block').siblings().css('display', 'none');
                switch ($(this).text()) {
                    case '预警信息':
                        appendAlert(csData);
                        $('.alertButton .redPoint').remove()
                    case '数据统计':
                        appendTJxx(csData);
                    case '证件发放':
                        appendGiveOut(csData);
                    case '证件变动':
                        $('.appendButton .redPoint').remove()
                }
            }else{
                //最后一个按钮退出系统
                if(confirm("确定要退出系统？")){
                    sessionClear();
                    window.location.href = '../html/login.html'
                }
            }
            }else if( power==='1'){
            if($(this).next().length>0) {
                $("#rightContent .operateContent>.cjUse:eq(" + index + ")").css('display', 'block').siblings().css('display', 'none');
                switch ($(this).text()) {
                    case '预警信息':
                        appendAlert(csData);
                        $('.alertButton .redPoint').remove()
                    case '数据统计':
                        appendTJxx(csData);
                    case '证件发放':
                        appendGiveOut(csData);
                    case '证件变动':
                        $('.appendButton .redPoint').remove()
                }
            }else{
                //最后一个按钮退出系统
                if(confirm("确定要退出系统？")){
                    sessionClear();
                    window.location.href = '../html/login.html'
                }
            }

        }else if(power === '0'){
            if($(this).next().length>0){
                $("#rightContent .operateContent>.sjUse:eq("+index+")").css('display','block').siblings().css('display','none');
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
            html = '<li class=\"appendButton\">证件变动<span class="redPoint"></span></li><li class=\"queryButton\">证件查询</li><li class=\"dataButton\">数据统计</li><li class=\"checkButton\">申请审核</li>' +
                '<li class="alertButton">预警信息<span class="redPoint"></span></li><li class="giveOutButton">证件发放</li><li class="editButton">证件调整</li><li class="summaryButton">汇总信息</li><li class="logOutButton">退出系统</li>'
            $("#buttonList").append(html);
            appendQueryElement(power);
            appendApplyCheck(power,csData);
        } else if (power === '1') {//这里填车间管理人员的权限
            html = '<li class=\"queryButton\">证件查询</li><li class=\"dataButton\">数据统计</li><li class=\"checkButton\">申请审核</li>' +
                '<li class="alertButton">预警信息<span class="redPoint"></span></li><li class="yearlyButton">年鉴体检</li><li class="giveOutButton">证件发放</li><li class="logOutButton">退出系统</li>';
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
                url: "../../../ways.php",
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
                url: "../../../ways.php",
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
    $('#editBanner .queryInput').keyup(function(event){
        if(event.keyCode === 13){
            displayEdit()
        }
    })
    $("#editBanner .queryButton").off('click').on('click',function(){
        displayEdit()
    })
    function displayEdit(){
        if(sessionGet('power') === 'V'){
            if($("#editBanner .queryInput").val().match(/^[0-9]{5}$/)){
                var payid = $("#editBanner .queryInput").val();
                var column = ' *';
                var ajaxTimeOut = $.ajax({
                    url: "../../../ways.php",
                    type:"POST",
                    timeout:8000,
                    //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                    data:{funcName:'select',where:' where payid =\''+payid+'\'',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                        tableName:' jbxx ',column:column,order:' '},
                    dataType:'json',
                    success:function(data) {
                        if(data['success'] ===1){
                            $('.infoFix').text('信息更正').css({'color':'#555','fontWeight':'normal'})
                            $('.queryInfo>div>div').css('backgroundColor','inherit')
                            $('#editContainer .queryInfoContent').css('display','block')
                            console.log(data['row1'])
                            $('.queryInfoContent .queryPicInfo img').prop('src',data['row1']['cardPath']);
                            $('.queryInfoContent .queryInfo .payIdInput').val(data['row1']['payId']);
                            $('.queryInfoContent .queryInfo .name').text(data['row1']['UName']);
                            $('.queryInfoContent .queryInfo .department').text(data['row1']['department']);
                            $('.queryInfoContent .queryInfo .birth').text(data['row1']['birthDate']);
                            $('.queryInfoContent .queryInfo .sjDateInput').val(data['row1']['sjDate']);
                            $('.queryInfoContent .queryInfo .sjRemarkInput').val(data['row1']['sjRemark']);
                            $('.queryInfoContent .queryInfo .yearlyCheckDateInput').val(data['row1']['yearlyCheckDate']);
                            $('.queryInfoContent .queryInfo .driveCodeInput').val(data['row1']['sjDriveCode']);
                            $('.queryInfoContent .queryInfo .driveTypeInput').val(data['row1']['sjDriveType']);
                            $('.queryInfoContent .queryInfo .startDateInput').val(data['row1']['startdate']);
                            $('.queryInfoContent .queryInfo .deadlineInput').val(data['row1']['deadline']);
                            $('.queryInfoContent .queryInfo .phyTest').text(data['row1']['phyTest']);
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
    }

    //证件调整的按钮事件
    function boundEditEvent(data){
        var payId = $('.queryInput').val();
        var flag = true;
        //车间转调按钮
        $('.cjEdit').off('click').on('click',function(){
            $("#editContainer .textContent .name").text($(".queryInfo .name").text())
            $("#editContainer .logOutContent").css('display','none');
            $("#editContainer .textContent").css('display','block');
            $("#editFixSelect").off('change').on('change',function(){
                if(confirm('确认要将'+$(".queryInfo .name").text()+'的关系调入'+$(this).val().split(',')[0]+'？')){
                    var setStr =' department =\''+$(this).val()+'\' ';
                    var where =' where payId =\''+$('.queryInfo .payIdInput').val()+'\'';
                    $.ajax({
                        url: "../../../ways.php",
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
            if(confirm('（注意！请在确认该人员已调出本段的情况下进行调出操作）\u000d'+'确认'+$(".queryInfo .name").html()+'师傅已调出？')){
                if(data['status'] !== csData['zjzt-dc']['nr2'] && data['status'] !== csData['zjzt-zx']['nr2']){
                    var where =' where payId =\''+$('.queryInfo .payIdInput').val()+'\'';
                    var setStr = 'status =\''+csData['zjzt-dc']['nr2']+'\''
                    $.ajax({
                        url: "../../../ways.php",
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
                            lotNumber =  lotNumber.getFullYear()+ '-' + lotNumber.month + '-' + lotNumber.date;
                            $.ajax({
                                url: "../../../ways.php",
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
                                    var date = new Date();
                                    var year = date.getFullYear()
                                    var setStr1 = 'decreaseAmount = decreaseAmount + 1,dc=dc+1,yearlyAmount = yearlyAmount-1';
                                    var where1 =  ' where driveCode = \''+data['sjDriveCode']+'\' AND year = '+year;
                                    $.ajax({
                                        url: "../../../ways.php",
                                        type: "POST",
                                        timeout: 8000,
                                        data: {
                                            funcName: 'update',
                                            serverName: '10.101.62.73',
                                            uid: 'sa',
                                            pwd: '2huj15h1',
                                            Database: 'jszgl',
                                            tableName: ' tjxx',
                                            setStr: setStr1,
                                            where: where1
                                        },
                                        dataType: 'json',
                                        success: function () {

                                        }
                                    })
                                    $(".queryInfoContent").css('display','none')
                                    $(".editButtonBanner").css('display','none')
                                    $(".textContent").css('display','none')
                                    $(".logOutContent").css('display','none')
                                    alert('操作成功。该证件的状态目前为：'+csData['zjzt-dc']['nr2']);
                                }
                            })
                        }
                    })
                }else{
                    alert('该人员已调出或注销，不能继续调出操作')
                }

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
                        $(".driveCode").css('backgroundColor','white')
                        flag = true;
                    }else{
                        $(".driveCode").css('backgroundColor','#ffcccc')
                        flag =false;
                        return false
                    }
                })
            }else if($(this).text() === '确认更改'){
                checkIfInArray($(".queryInfo .driveCodeInput").val(),arr)
                //提交
                if($(".queryInfo .payIdInput").val().match(/^[0-9]{5}$/) && $('.queryInfo .sjDateInput').val().match(/^\d{4}-\d{2}-\d{2}$/) && $('.queryInfo .yearlyCheckDateInput').val().match(/^\d{4}-\d{2}-\d{2}$/) && $('.queryInfo .startDateInput').val().match(/^\d{4}-\d{2}-\d{2}$/) && $('.queryInfo .deadlineInput').val().match(/^\d{4}-\d{2}-\d{2}$/) && flag){
                    if(confirm('确认要进行更改吗？')){
                        var setStr ='payid =\''+$(".queryInfo .payIdInput").val()+'\',sjDate =\''+$(".queryInfo .sjDateInput").val()+'\',yearlyCheckDate =\''+$(".queryInfo .yearlyCheckInput").val()+'\',sjDriveCode =\''+$(".queryInfo .driveCodeInput").val()+'\',sjDriveType =\''+$(".queryInfo .driveTypeInput").val()+'\',startDate =\''+$(".queryInfo .startDateInput").val()+'\',deadline = \''+$(".queryInfo .deadlineInput").val()+'\',sjRemark =\''+$(".queryInfo .sjRemarkInput").val()+'\'';
                        var where = ' where payid =\''+payId+'\'';
                        var ajaxTimeOut = $.ajax({
                            url: "../../../ways.php",
                            type: "POST",
                            timeout: 8000,
                            data: {
                                funcName: 'update', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                                tableName: ' jbxx', setStr: setStr, where: where
                            },
                            dataType: 'json',
                            success: function () {
                                alert('信息修改成功')
                                $('.infoFix').text('信息更正').css({'color':'#555','fontWeight':'normal'})
                                $(".queryInfo input").prop('disabled',true).parent().css('backgroundColor','inherit');
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
                    else{
                        displayEdit()
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
                            url: "../../../ways.php",
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
                                    url: "../../../ways.php",
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
                                        var date = new Date();
                                        var year = date.getFullYear();
                                        var column=''
                                        if(reason === csData['zxyy-yxqmwx']['nr2'] || reason === csData['zxyy-tcsq']['nr2']){
                                            column = 'zx'
                                        }else if(reason === csData['zxyy-cx']['nr2']){
                                            column = 'cx'
                                        }else if(reason === csData['zxyy-sw']['nr2']){
                                            column = 'sw'
                                        }else if(reason === csData['zxyy-tx']['nr2']){
                                            column = 'tx';
                                        }else if(reason === csData['zxyy-qt']['nr2']){
                                            column = 'otherDecrease'
                                        }
                                        var setStr1 = 'decreaseAmount = decreaseAmount + 1,'+column+'='+column+'+1,yearlyAmount = yearlyAmount-1';
                                        var where1 =  ' where driveCode = \''+data['sjDriveCode']+'\' AND year = '+year;
                                        $.ajax({
                                            url: "../../../ways.php",
                                            type: "POST",
                                            timeout: 8000,
                                            data: {
                                                funcName: 'update',
                                                serverName: '10.101.62.73',
                                                uid: 'sa',
                                                pwd: '2huj15h1',
                                                Database: 'jszgl',
                                                tableName: ' tjxx',
                                                setStr: setStr1,
                                                where: where1
                                            },
                                            dataType: 'json',
                                            success: function () {

                                            }
                                        })
                                        $(".queryInfoContent").css('display','none')
                                        $(".editButtonBanner").css('display','none')
                                        $(".textContent").css('display','none')
                                        $(".logOutContent").css('display','none')
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
        $('.phyTestOk').off('click').on('click',function(){
            if(confirm(data['UName']+'师傅的体检结论合格，确定？')){
                $.ajax({
                    url: "../../../ways.php",
                    type: "POST",
                    timeout: 8000,
                    data: {
                        funcName: 'update', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                        tableName: ' jbxx', setStr: 'phyTest = \''+csData['tjjl-hg']['nr2']+'\'', where: ' where payId = \''+data['payId']+'\''
                    },
                    dataType: 'json',
                    success: function (data) {
                        if(data['success'] === 1){
                            $('#editContainer .queryInfoContent .phyTest').text(csData['tjjl-hg']['nr2'])
                        }
                    }
                })
            }
        })
        $('.phyTestNo').off('click').on('click',function(){
            if(confirm(data['UName']+'师傅的体检结论不合格，确定？')){
                $.ajax({
                    url: "../../../ways.php",
                    type: "POST",
                    timeout: 8000,
                    data: {
                        funcName: 'update', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                        tableName: ' jbxx', setStr: 'phyTest = \''+csData['tjjl-bhg']['nr2']+'\'', where: ' where payId = \''+data['payId']+'\''
                    },
                    dataType: 'json',
                    success: function (data) {
                        if(data['success'] === 1){
                            $('#editContainer .queryInfoContent .phyTest').text(csData['tjjl-bhg']['nr2'])
                        }
                    }
                })
            }
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
                var department = sessionGet('department').split(',')[0];
                //添加目前正在进行车间审核的换证申请
                obj.where = ' where checkStatus = \''+csData['checkStatus-cjshz']['nr2']+'\' AND changeType like \'%'+csData['czlb-yxqmhz']['nr2']+'\' AND department like\''+department+'%\'';
                exchangeApplyAjax(obj)
            }
            //这里添加教育科人员的审核申请界面
            if(power === 'V'){
                obj.where = ' where checkStatus = \''+csData['checkStatus-jykshz']['nr2']+'\' AND changeType like \'%'+csData['czlb-yxqmhz']['nr2']+'\'';
                exchangeApplyAjax(obj)
            }
            function exchangeApplyAjax(obj){
                var ajaxTimeOut = $.ajax({
                    url: "../../../ways.php",
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
                                            html+="<td>&nbsp</td>";
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
                                                    html+="<td>&nbsp</td>";
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
                var department = sessionGet('department').split(',')[0];
                //添加目前正在进行车间审核的补证申请
                obj.where = ' where checkStatus = \''+csData['checkStatus-cjshz']['nr2']+'\' AND changeType = \''+csData['czlb-bz']['nr2']+'\' AND department like \''+department+'%\'';
                fixApplyAjax(obj)
            }
            if(power === 'V'){
                obj.where = ' where checkStatus = \''+csData['checkStatus-jykshz']['nr2']+'\' AND changeType = \''+csData['czlb-bz']['nr2']+'\'';
                fixApplyAjax(obj)
            }
            //这个函数是请求换补证申请，然后添加入页面的函数,传入obj是sql对象，内涵where,column,order三个字段
            function fixApplyAjax(obj){
                var ajaxTimeOut = $.ajax({
                    url: "../../../ways.php",
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
                                            html+="<td>&nbsp</td>";
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
                                                    html+="<td>&nbsp</td>";
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
            setStr = 'checkStatus = \''+csData['checkStatus-jykshz']['nr2']+'\', cjOperator = \''+sessionGet('user')+'\', cjCheckDate = \''+today+'\'';
            rejectSetStr = ' ,cjOperator = \''+sessionGet('user')+'\', cjCheckDate = \''+today+'\' ';
        }else if(power === 'V'){
            setStr = 'checkStatus = \''+csData['checkStatus-shtg']['nr2']+'\', jykOperator = \''+sessionGet('user')+'\', jykCheckDate = \''+today+'\'';
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
            getSqInfo($(this),$(this).parent().prev().prev().prev().text(),changeType)
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
                    url: "../../../ways.php",
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
                        payId = $(_thisReject).parent().prev().prev().prev().prev().text();
                        lotNumber = $(_thisReject).parent().prev().prev().prev().prev().prev().text();
                        changeType = $(_thisReject).parent().prev().prev().text();
                        uname = $(_thisReject).parent().prev().prev().prev().text();
                        rejectSetStr = ' checkStatus = \''+csData['checkStatus-shwtg']['nr2']+'\''+' ,shortage = \''+shortage+'\''+ ' ,failedReason = \''+failedReason+'\'' + rejectSetStr;
                        where = ' where id=\''+id+'\'';
                        $.ajax({
                            url: "../../../ways.php",
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
                        $.ajax({
                            url: "../../../ways.php",
                            type: "POST",
                            timeout: 8000,
                            data: {
                                funcName: 'update', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                                tableName: ' jbxx', setStr: ' status =\''+csData['zjzt-yj']['nr2']+'\' ', where: ' where payId =\''+payId+'\''
                            },
                            dataType: 'json',
                            success: function () {

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
                            url: "../../../ways.php",
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
                        $.ajax({
                            url: "../../../ways.php",
                            type: "POST",
                            timeout: 8000,
                            data: {
                                funcName: 'update', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                                tableName: ' jbxx', setStr: ' status =\''+csData['zjzt-yj']['nr2']+'\' ', where: ' where payId =\''+payId+'\''
                            },
                            dataType: 'json',
                            success: function () {

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
                }
            });
        }

    }

    //添加预警信息
    function appendAlert(csData){
        var power = sessionGet('power');

        if(power === '1'){
            var department = sessionGet('department').split(',')[0];
            appendDepartmentAlert(department)
        }else if(power === 'V'){
            appendAllAlert(csData)
        }
        function appendDepartmentAlert(department){
            var p =  department;
            if($("#alertBanner .selectArea select").length>0){

            }else{
                $("#alertBanner .selectArea").text(p)
            }
            $.ajax({
                url: "../../../ways.php",
                type: "POST",
                data: {
                    funcName: 'select', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'JSZGL',
                    tableName: ' jbxx ', column: ' department,payId,UName,deadline,tzDone', where: ' where department like \''+department+'%\' AND DATEDIFF(day,getdate(),deadline) < '+csData['yjsj-cjyjsj']['nr2']+' AND deadline !=\'\'', order: ' order by DATEDIFF(day,getdate(),deadline)'
                },
                dataType: 'json',
                success: function (data) {
                    if(data['success'] === 1){
                        $.ajax({
                            url: "../../../ways.php",
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
                                var html = '<tr><th>所属车间</th><th>工资号</th><th>姓名</th><th>距到期剩余天数</th><th>是否已申请换证</th><th>状态</th></tr>';
                                //处理数据，加入两个属性“是否正在换证”、‘审核状态’
                                var today = new Date();
                                today.month = today.getMonth() < 9 ? '0' + (today.getMonth() + 1) : today.getMonth() + 1;
                                today.date = today.getDate() < 10 ? '0' + today.getDate() : today.getDate();
                                today = today.getFullYear() + '-' + today.month + '-' + today.date;
                                today = new Date(today)
                                var deadline='';
                                for(var i in data){
                                    if(data[i]['department'].split(',').length>1){
                                        data[i]['department'] = data[i]['department'].split(',')[0];
                                    }
                                    deadline = new Date(data[i]['deadline']);
                                    data[i]['deadline'] = (deadline - today)/(1000*60*60*24)
                                    for(var j in bgxx){
                                        if(data[i]['payId'] !== bgxx[j]['payId']){
                                            data[i]['checking'] = '否';
                                            if(data[i]['tzDone'] === csData['tzDone-swtz']['nr2']){
                                                data[i]['checkStatus'] = '<span class="tz">短信通知</span>';
                                                delete data[i]['tzDone']
                                            }else if(data[i]['tzDone'] === csData['tzDone-yjtz']['nr2']){
                                                data[i]['checkStatus'] = csData['tzDone-yjtz']['nr2'];
                                                delete data[i]['tzDone']
                                            }
                                        }else{
                                            data[i]['checking'] = '是';
                                            data[i]['checkStatus'] = bgxx[j]['checkStatus'];
                                            delete data[i]['tzDone']
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
                                    $('#alertTable .tz').off('click').on('click',function(){
                                        tzEvent(csData,csData['zjzt-yj']['nr2'],$(this).parent().prev().prev().prev().prev().text(),$(this))
                                    })
                                    for(var m=0;m<$("#alertTable tbody tr td:nth-child(5)").length;m++){
                                        if($("#alertTable tbody tr td:nth-child(5):eq("+m+")").text() === '否'){
                                            $('.alertButton .redPoint').css('display','block')
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
                                                html+="<td>&nbsp</td>";
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
                                    $('#alertTable .tz').off('click').on('click',function(){
                                        tzEvent(csData,csData['zjzt-yj']['nr2'],$(this).parent().prev().prev().prev().prev().text(),$(this))
                                    })
                                    for(var m=0;m<$("#alertTable tbody tr td:nth-child(5)").length;m++){
                                        if($("#alertTable tbody tr td:nth-child(5):eq("+m+")").text() === '否'){
                                            $('.alertButton .redPoint').css('display','block')
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
                                            var html = '<tr><th>所属车间</th><th>工资号</th><th>姓名</th><th>距到期剩余天数</th><th>是否已申请换证</th><th>状态</th></tr>';
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
                                            $('#alertTable .tz').off('click').on('click',function(){
                                                tzEvent(csData,csData['zjzt-yj']['nr2'],$(this).parent().prev().prev().prev().prev().text(),$(this))
                                            })
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
                                                        html+="<td>&nbsp</td>";
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
                                            var html = '<tr><th>所属车间</th><th>工资号</th><th>姓名</th><th>距到期剩余天数</th><th>是否已申请换证</th><th>状态</th></tr>';
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
                                            $('#alertTable .tz').off('click').on('click',function(){
                                                tzEvent(csData,csData['zjzt-yj']['nr2'],$(this).parent().prev().prev().prev().prev().text(),$(this))
                                            })
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
                url: "../../../ways.php",
                type: "POST",
                data: {
                    funcName: 'select', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'JSZGL',
                    tableName: ' jbxx ', column: ' department,payId,UName,deadline,tzDone', where: ' where DATEDIFF(day,getdate(),deadline) < '+csData['yjsj-cjyjsj']['nr2']+' AND deadline !=\'\'', order: ' order by DATEDIFF(day,getdate(),deadline)'
                },
                dataType: 'json',
                success: function (data) {
                    if(data['success'] === 1){
                        $.ajax({
                            url: "../../../ways.php",
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
                                var html = '<tr><th>所属车间</th><th>工资号</th><th>姓名</th><th>距到期剩余天数</th><th>是否已申请换证</th><th>状态</th></tr>';
                                //处理数据，加入两个属性“是否正在换证”、‘审核状态’
                                var today = new Date();
                                today.month = today.getMonth() < 9 ? '0' + (today.getMonth() + 1) : today.getMonth() + 1;
                                today.date = today.getDate() < 10 ? '0' + today.getDate() : today.getDate();
                                today = today.getFullYear() + '-' + today.month + '-' + today.date;
                                today = new Date(today)
                                var deadline='';
                                for(var i in data){
                                    if(data[i]['department'].split(',').length>1){
                                        data[i]['department'] = data[i]['department'].split(',')[0];
                                    }
                                    deadline = new Date(data[i]['deadline']);
                                    data[i]['deadline'] = (deadline - today)/(1000*60*60*24)
                                    for(var j in bgxx){
                                        if(data[i]['payId'] !== bgxx[j]['payId']){
                                            data[i]['checking'] = '否';
                                            if(data[i]['tzDone'] === csData['tzDone-swtz']['nr2']){
                                                data[i]['checkStatus'] = '<span class="tz">短信通知</span>';
                                                delete data[i]['tzDone']
                                            }else if(data[i]['tzDone'] === csData['tzDone-yjtz']['nr2']){
                                                data[i]['checkStatus'] = csData['tzDone-yjtz']['nr2'];
                                                delete data[i]['tzDone']
                                            }
                                        }else{
                                            data[i]['checking'] = '是';
                                            data[i]['checkStatus'] = bgxx[j]['checkStatus'];
                                            delete data[i]['tzDone']
                                            break
                                        }
                                    }
                                }
                                console.log(data)
                                if(alertCount<11){
                                    for(var i in data){
                                        html += '<tr>';
                                        for(var j in data[i]){
                                            html += '<td>'+data[i][j]+'</td>';
                                        }
                                        html += '</tr>'
                                    }
                                    $("#alertTable").empty().append(html);

                                    $('#alertTable .tz').off('click').on('click',function(){
                                        tzEvent(csData,csData['zjzt-yj']['nr2'],$(this).parent().prev().prev().prev().prev().text(),$(this))
                                    })
                                    for(var m=0;m<$("#alertTable tbody tr td:nth-child(5)").length;m++){
                                        if($("#alertTable tbody tr td:nth-child(5):eq("+m+")").text() === '否'){
                                            $('.alertButton .redPoint').css('display','block')
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
                                                html+="<td>&nbsp</td>";
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
                                    $('#alertTable .tz').off('click').on('click',function(){
                                        tzEvent(csData,csData['zjzt-yj']['nr2'],$(this).parent().prev().prev().prev().prev().text(),$(this))
                                    })
                                    for(var m=0;m<$("#alertTable tbody tr td:nth-child(5)").length;m++){
                                        if($("#alertTable tbody tr td:nth-child(5):eq("+m+")").text() === '否'){
                                            $('.alertButton .redPoint').css('display','block')
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
                                            var html = '<tr><th>所属车间</th><th>工资号</th><th>姓名</th><th>距到期剩余天数</th><th>是否已申请换证</th><th>状态</th></tr>';
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
                                            $('#alertTable .tz').off('click').on('click',function(){
                                                tzEvent(csData,csData['zjzt-yj']['nr2'],$(this).parent().prev().prev().prev().prev().text(),$(this))
                                            })
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
                                                        html+="<td>&nbsp</td>";
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
                                            var html = '<tr><th>所属车间</th><th>工资号</th><th>姓名</th><th>距到期剩余天数</th><th>是否已申请换证</th><th>状态</th></tr>';
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
                                            $('#alertTable .tz').off('click').on('click',function(){
                                                tzEvent(csData,csData['zjzt-yj']['nr2'],$(this).parent().prev().prev().prev().prev().text(),$(this))
                                            })
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

    function tzEvent(csData,type,payId,button){
        if(type === csData['zjzt-yj']['nr2']){
            $.ajax({
                url: "../../../ways.php",
                type: "POST",
                timeout: 8000,
                data: {
                    funcName: 'getInfo',
                    serverName: '10.101.62.62',
                    uid: 'sa',
                    pwd: '2huj15h1',
                    Database: 'USERINFO',
                    tableName: 'userinfo1',
                    column: ' uname,phone1 ',
                    where: ' where payid = \'' + payId + '\'',
                    order: ' '
                },
                dataType: 'json',
                success: function (data) {
                    if(data['success'] === 1){
                        delete data['success'];
                        var phone = data['row']['phone1'];
                        var text = data['row']['uname']+'师傅，您好。您的驾驶证已进入到期预警状态，请及时联系车间教育负责人准备相应材料，谢谢。';
                        $.ajax({
                            url: "../../../ways.php",
                            type: "POST",
                            timeout: 8000,
                            data: {
                                funcName: 'insert',
                                serverName: '10.101.62.199',
                                uid: 'wa',
                                pwd: 'sasasa',
                                Database: 'jiaoban',
                                tableName: ' daifaxinxi',
                                column: ' (jieshoujihao,xinxi,jibie)',
                                values: '(\''+phone+'\',\'' + text + '\',\'' + 1 +'\')'
                            },
                            dataType: 'json',
                            success: function (){
                                var setStr = ' tzDone = \''+csData['tzDone-yjtz']['nr2']+'\'';
                                var where = ' where payid=\''+payId+'\'';
                                $.ajax({
                                    url: "../../../ways.php",
                                    type: "POST",
                                    timeout: 8000,
                                    data: {
                                        funcName: 'update', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                                        tableName: ' jbxx', setStr: setStr, where: where
                                    },
                                    dataType: 'json',
                                    success: function () {

                                    }
                                });
                                alert('发送短信提醒'+data['row']['uname']+'师傅补全换证所需材料')
                                button.remove()
                            }
                        })
                    }
                }
            })
        }else if(type === csData['finishStatus-ffdgr']['nr2']){
            //车间发放到个人后，用于验证和留存
            $.ajax({
                url: "../../../ways.php",
                type: "POST",
                timeout: 8000,
                data: {
                    funcName: 'getInfo',
                    serverName: '10.101.62.62',
                    uid: 'sa',
                    pwd: '2huj15h1',
                    Database: 'USERINFO',
                    tableName: 'userinfo1',
                    column: ' uname,phone1 ',
                    where: ' where payid = \'' + payId + '\'',
                    order: ' '
                },
                dataType: 'json',
                success: function (data) {
                    if(data['success'] === 1){
                        delete data['success'];
                        var phone = data['row']['phone1'];
                        var text = data['row']['uname']+'师傅，您好。您的新驾驶证已由车间发放到个人，若未收到，请联系车间教育负责人核实，谢谢。';
                        $.ajax({
                            url: "../../../ways.php",
                            type: "POST",
                            timeout: 8000,
                            data: {
                                funcName: 'insert',
                                serverName: '10.101.62.199',
                                uid: 'wa',
                                pwd: 'sasasa',
                                Database: 'jiaoban',
                                tableName: ' daifaxinxi',
                                column: ' (jieshoujihao,xinxi,jibie)',
                                values: '(\''+phone+'\',\'' + text + '\',\'' + 1 +'\')'
                            },
                            dataType: 'json',
                            success: function (){

                            }
                        })
                    }
                }
            })
        }else if(type === '提醒取证'){
            //车间收到教育科发的证后，用于提醒乘务员来取证
            $.ajax({
                url: "../../../ways.php",
                type: "POST",
                timeout: 8000,
                data: {
                    funcName: 'getInfo',
                    serverName: '10.101.62.62',
                    uid: 'sa',
                    pwd: '2huj15h1',
                    Database: 'USERINFO',
                    tableName: 'userinfo1',
                    column: ' uname,phone1 ',
                    where: ' where payid = \'' + payId + '\'',
                    order: ' '
                },
                dataType: 'json',
                success: function (data) {
                    if(data['success'] === 1){
                        delete data['success'];
                        var phone = data['row']['phone1'];
                        var text = data['row']['uname']+'师傅，您好。您的新驾驶证已发放到车间，请于近期到车间教育口领取，谢谢。';
                        $.ajax({
                            url: "../../../ways.php",
                            type: "POST",
                            timeout: 8000,
                            data: {
                                funcName: 'insert',
                                serverName: '10.101.62.199',
                                uid: 'wa',
                                pwd: 'sasasa',
                                Database: 'jiaoban',
                                tableName: ' daifaxinxi',
                                column: ' (jieshoujihao,xinxi,jibie)',
                                values: '(\''+phone+'\',\'' + text + '\',\'' + 1 +'\')'
                            },
                            dataType: 'json',
                            success: function (){

                            }
                        })
                    }
                }
            })
        }else if(type === csData['czlb-bz']['nr3']){
            $.ajax({
                url: "../../../ways.php",
                type: "POST",
                timeout: 8000,
                data: {
                    funcName: 'getInfo',
                    serverName: '10.101.62.62',
                    uid: 'sa',
                    pwd: '2huj15h1',
                    Database: 'USERINFO',
                    tableName: 'userinfo1',
                    column: ' uname,phone1 ',
                    where: ' where payid = \'' + payId + '\'',
                    order: ' '
                },
                dataType: 'json',
                success: function (data) {
                    if(data['success'] === 1){
                        delete data['success'];
                        var phone = data['row']['phone1'];
                        var text = data['row']['uname']+'师傅，您好。您的驾驶证补发申请已受理，请联系车间教育负责人开具《驾驶证丢失证明》并留意后续的发证通知信息，谢谢。';
                        $.ajax({
                            url: "../../../ways.php",
                            type: "POST",
                            timeout: 8000,
                            data: {
                                funcName: 'insert',
                                serverName: '10.101.62.199',
                                uid: 'wa',
                                pwd: 'sasasa',
                                Database: 'jiaoban',
                                tableName: ' daifaxinxi',
                                column: ' (jieshoujihao,xinxi,jibie)',
                                values: '(\''+phone+'\',\'' + text + '\',\'' + 1 +'\')'
                            },
                            dataType: 'json',
                            success: function (){

                            }
                        })
                    }
                }
            })
        }else if(type === csData['czlb-yxqmhz']['nr3'] || type === csData['czlb-fyxqmhz']['nr3']){
            $.ajax({
                url: "../../../ways.php",
                type: "POST",
                timeout: 8000,
                data: {
                    funcName: 'getInfo',
                    serverName: '10.101.62.62',
                    uid: 'sa',
                    pwd: '2huj15h1',
                    Database: 'USERINFO',
                    tableName: 'userinfo1',
                    column: ' uname,phone1 ',
                    where: ' where payid = \'' + payId + '\'',
                    order: ' '
                },
                dataType: 'json',
                success: function (data) {
                    if(data['success'] === 1){
                        delete data['success'];
                        var phone = data['row']['phone1'];
                        var text = data['row']['uname']+'师傅，您好。您的驾驶证有效期满换证程序已开始，请留意后续的发证通知信息，谢谢。';
                        $.ajax({
                            url: "../../../ways.php",
                            type: "POST",
                            timeout: 8000,
                            data: {
                                funcName: 'insert',
                                serverName: '10.101.62.199',
                                uid: 'wa',
                                pwd: 'sasasa',
                                Database: 'jiaoban',
                                tableName: ' daifaxinxi',
                                column: ' (jieshoujihao,xinxi,jibie)',
                                values: '(\''+phone+'\',\'' + text + '\',\'' + 1 +'\')'
                            },
                            dataType: 'json',
                            success: function (){

                            }
                        })
                    }
                }
            })
        }else if(type === csData['czlb-dr']['nr3']){
            $.ajax({
                url: "../../../ways.php",
                type: "POST",
                timeout: 8000,
                data: {
                    funcName: 'getInfo',
                    serverName: '10.101.62.62',
                    uid: 'sa',
                    pwd: '2huj15h1',
                    Database: 'USERINFO',
                    tableName: 'userinfo1',
                    column: ' uname,phone1 ',
                    where: ' where payid = \'' + payId + '\'',
                    order: ' '
                },
                dataType: 'json',
                success: function (data) {
                    if(data['success'] === 1){
                        delete data['success'];
                        //var phone = data['row']['phone1'];
                        var phone = 18538832516;
                        var text = data['row']['uname']+'师傅，您好。欢迎入职洛阳机务段，请于近期内携带您的机车驾驶证原件到段教育科登记驾驶证信息，谢谢。';
                        $.ajax({
                            url: "../../../ways.php",
                            type: "POST",
                            timeout: 8000,
                            data: {
                                funcName: 'insert',
                                serverName: '10.101.62.199',
                                uid: 'wa',
                                pwd: 'sasasa',
                                Database: 'jiaoban',
                                tableName: ' daifaxinxi',
                                column: ' (jieshoujihao,xinxi,jibie)',
                                values: '(\''+phone+'\',\'' + text + '\',\'' + 1 +'\')'
                            },
                            dataType: 'json',
                            success: function (){

                            }
                        })
                    }
                }
            })
        }
    }
    function getSqInfo(_this,payId,changeType){
        $.ajax({
            url: "../../../ways.php",
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
                where: ' where payid = \'' + payId + '\'',
                order: ' '
            },
            dataType: 'json',
            success: function (data) {
                $.ajax({
                    url: "../../../ways.php",
                    type: "POST",
                    timeout: 8000,
                    data: {
                        funcName: 'getInfo', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                        tableName: 'sqxx', column: ' * ', where: ' where payId = \'' + payId + '\'', order: ' '
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

    //添加统计信息
    function appendTJxx(csData){
        var power = sessionGet('power');
        var department  = sessionGet('department').split(',')[0]
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
                    url: "../../../ways.php",
                    type:"POST",
                    timeout:8000,
                    //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                    data:{funcName:'select',where:' where checkStatus !=\''+csData['checkStatus-cjshz']['nr2']+'\' and department like \''+department+'%\'',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
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
                                $("#dataPage").css('display','none')
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
                                            html+="<td>&nbsp</td>";
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
                                                    html+="<td>&nbsp</td>";
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
                    url: "../../../ways.php",
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
                                $("#dataPage").css('display','none')
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
                                            html+="<td>&nbsp</td>";
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
                                    console.log(data)
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
                                                    html+="<td>&nbsp</td>";
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
                            alert('暂无发放记录');
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
                var ajaxTimeOut2 = $.ajax({
                    url: "../../../ways.php",
                    type:"POST",
                    timeout:8000,
                    //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                    data:{funcName:'select',where:' where department like \''+department+'%\' AND changeType =\''+csData['czlb-zx']['nr2']+'\'',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                        tableName:' bgxx ',column:' department,lotNumber,archivesId,UName,changeType,changeReason,jykOperator',order:' order by lotnumber,payid'},
                    dataType:'json',
                    success:function(data){
                        if(data['success'] === 1){
                            delete data['success'];
                            var count = data['count'];
                            delete data['count'];
                            var today = new Date();
                            var my;
                            for(var i in data){
                                if(data[i]['department'].split(',').length>1){
                                    data[i]['department'] = data[i]['department'].split(',')[0];
                                }
                            }
                            var html = '<tr><th>部门</th><th>日期</th><th>档案号</th><th>姓名</th><th>操作类别</th><th>注销原因</th><th>教育科经办人</th><th>操作</th></tr>';
                            if(count<11){
                                $("#dataPage").css('display','none')
                                for(var i in data){
                                    html += '<tr>';
                                    for(var j in data[i]){
                                        html += '<td>'+data[i][j]+'</td>';
                                    }
                                    my = new Date();
                                    my.setFullYear(parseInt(data[i]['lotNumber'].split('-')[0]),parseInt(data[i]['lotNumber'].split('-')[1])-1,parseInt(data[i]['lotNumber'].split('-')[2]))
                                    if((today-my)/(1000*60*60*24) < csData['chqx-dc']['nr2']){
                                        html += '<td><span class="back">撤回</span></td>'
                                    }else{
                                        html += '<td>超过撤回期限</td>'
                                    }
                                    html += '</tr>'
                                }
                                $("#dataTable").empty().append(html);
                                boundBackEvent(data)
                                //空白tr补齐表格
                                if($("#dataTable tbody tr").length<11){
                                    html = '';
                                    var count = 11-$("#dataTable tbody tr").length;
                                    var columns = $("#dataTable tbody tr:first-child th").length;
                                    for(var m=0;m<count;m++){
                                        html+='<tr>';
                                        for(var n=0;n<columns;n++){
                                            html+="<td>&nbsp</td>";
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
                                    my = new Date();
                                    my.setFullYear(parseInt(data[i]['lotNumber'].split('-')[0]),parseInt(data[i]['lotNumber'].split('-')[1])-1,parseInt(data[i]['lotNumber'].split('-')[2]))
                                    if((today-my)/(1000*60*60*24) < csData['chqx-dc']['nr2']){
                                        html += '<td><span class="back">撤回</span></td>'
                                    }else{
                                        html += '<td>超过撤回期限</td>'
                                    }
                                    html += '</tr>';
                                    q+=1;
                                    if(q>9){
                                        break
                                    }
                                }
                                $("#dataTable").empty().append(html);
                                boundBackEvent(data)
                                $("#dataPage .cur").text(cur);
                                $("#dataPage .total").text(total);
                                $("#dataPage .next").off('click').on('click',function(){
                                    if(cur<total){
                                        var j =0;
                                        var html = '<tr><th>部门</th><th>日期</th><th>档案号</th><th>姓名</th><th>操作类别</th><th>注销原因</th><th>教育科经办人</th><th>操作</th></tr>';
                                        for(var i in data){
                                            if(j>10*cur-1 && j<10*(cur+1) && i ){
                                                j++;
                                                html += '<tr>';
                                                for(var m in data[i]){
                                                    html += '<td>'+data[i][m]+'</td>';
                                                }
                                                my = new Date();
                                                my.setFullYear(parseInt(data[i]['lotNumber'].split('-')[0]),parseInt(data[i]['lotNumber'].split('-')[1])-1,parseInt(data[i]['lotNumber'].split('-')[2]))
                                                if((today-my)/(1000*60*60*24) < csData['chqx-dc']['nr2']){
                                                    html += '<td><span class="back">撤回</span></td>'
                                                }else{
                                                    html += '<td>超过撤回期限</td>'
                                                }
                                                html += '</tr>'
                                            }else{
                                                j++;
                                            }
                                        }
                                        $("#dataTable").empty().append(html);
                                        boundBackEvent(data)
                                        //空白tr补齐表格
                                        if($("#dataTable tbody tr").length<11){
                                            html = '';
                                            var count = 11-$("#dataTable tbody tr").length;
                                            var columns = $("#dataTable tbody tr:first-child th").length;
                                            for(var m=0;m<count;m++){
                                                html+='<tr>';
                                                for(var n=0;n<columns;n++){
                                                    html+="<td>&nbsp</td>";
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
                                        var html = '<tr><th>部门</th><th>日期</th><th>档案号</th><th>姓名</th><th>操作类别</th><th>注销原因</th><th>教育科经办人</th><th>操作</th></tr>';
                                        for(var i in data){
                                            if(j>10*(cur-2)-1 && j<10*(cur-1) && i ){
                                                j++;
                                                html += '<tr>';
                                                for(var m in data[i]){
                                                    html += '<td>'+data[i][m]+'</td>';
                                                }
                                                my = new Date();
                                                my.setFullYear(parseInt(data[i]['lotNumber'].split('-')[0]),parseInt(data[i]['lotNumber'].split('-')[1])-1,parseInt(data[i]['lotNumber'].split('-')[2]))
                                                if((today-my)/(1000*60*60*24) < csData['chqx-dc']['nr2']){
                                                    html += '<td><span class="back">撤回</span></td>'
                                                }else{
                                                    html += '<td>超过撤回期限</td>'
                                                }
                                                html += '</tr>'
                                            }else{
                                                j++;
                                            }
                                        }
                                        $("#dataTable").empty().append(html);
                                        boundBackEvent(data)
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
                            ajaxTimeOut2.abort();    // 超时后中断请求
                            alert('网络超时，请检查网络连接');
                        }
                    }
                })
            }else if(name === csData['cjtjxx-dcjl']['nr2']){
                //呈现调出记录表
                var ajaxTimeOut3 = $.ajax({
                    url: "../../../ways.php",
                    type:"POST",
                    timeout:8000,
                    //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                    data:{funcName:'select',where:' where department like \''+department+'%\' AND changeType =\''+csData['czlb-dc']['nr2']+'\'',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                        tableName:' bgxx ',column:' department,lotNumber,archivesId,UName,changeType,jykOperator',order:' order by lotnumber,payid'},
                    dataType:'json',
                    success:function(data){
                        if(data['success'] === 1){
                            delete data['success'];
                            var count = data['count'];
                            var my ;
                            var today = new Date();
                            delete data['count'];
                            for(var i in data){
                                if(data[i]['department'].split(',').length>1){
                                    data[i]['department'] = data[i]['department'].split(',')[0];
                                }
                            }
                            var html = '<tr><th>部门</th><th>日期</th><th>档案号</th><th>姓名</th><th>操作类别</th><th>教育科经办人</th><th>操作</th></tr>';
                            if(count<11){
                                $("#dataPage").css('display','none')
                                for(var i in data){
                                    html += '<tr>';
                                    for(var j in data[i]){
                                        html += '<td>'+data[i][j]+'</td>';
                                    }
                                    my = new Date();
                                    my.setFullYear(parseInt(data[i]['lotNumber'].split('-')[0]),parseInt(data[i]['lotNumber'].split('-')[1])-1,parseInt(data[i]['lotNumber'].split('-')[2]))
                                    if((today-my)/(1000*60*60*24) < csData['chqx-dc']['nr2']){
                                        html += '<td><span class="back">撤回</span></td>'
                                    }else{
                                        html += '<td>超过撤回期限</td>'
                                    }

                                    html += '</tr>'
                                }
                                $("#dataTable").empty().append(html);
                                boundBackEvent(data);
                                //空白tr补齐表格
                                if($("#dataTable tbody tr").length<11){
                                    html = '';
                                    var count = 11-$("#dataTable tbody tr").length;
                                    var columns = $("#dataTable tbody tr:first-child th").length;
                                    for(var m=0;m<count;m++){
                                        html+='<tr>';
                                        for(var n=0;n<columns;n++){
                                            html+="<td>&nbsp</td>";
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
                                    my = new Date();
                                    my.setFullYear(parseInt(data[i]['lotNumber'].split('-')[0]),parseInt(data[i]['lotNumber'].split('-')[1])-1,parseInt(data[i]['lotNumber'].split('-')[2]))
                                    if((today-my)/(1000*60*60*24) < csData['chqx-dc']['nr2']){
                                        html += '<td><span class="back">撤回</span></td>'
                                    }else{
                                        html += '<td>超过撤回期限</td>'
                                    }
                                    html += '</tr>';
                                    q+=1;
                                    if(q>9){
                                        break
                                    }
                                }
                                $("#dataTable").empty().append(html);
                                boundBackEvent(data);
                                $("#dataPage .cur").text(cur);
                                $("#dataPage .total").text(total);
                                $("#dataPage .next").off('click').on('click',function(){
                                    if(cur<total){
                                        var j =0;
                                        var html = '<tr><th>部门</th><th>日期</th><th>档案号</th><th>姓名</th><th>操作类别</th><th>教育科经办人</th><th>操作</th></tr>';
                                        for(var i in data){
                                            if(j>10*cur-1 && j<10*(cur+1) && i ){
                                                j++;
                                                html += '<tr>';
                                                for(var m in data[i]){
                                                    html += '<td>'+data[i][m]+'</td>';
                                                }
                                                my = new Date();
                                                my.setFullYear(parseInt(data[i]['lotNumber'].split('-')[0]),parseInt(data[i]['lotNumber'].split('-')[1])-1,parseInt(data[i]['lotNumber'].split('-')[2]))
                                                if((today-my)/(1000*60*60*24) < csData['chqx-dc']['nr2']){
                                                    html += '<td><span class="back">撤回</span></td>'
                                                }else{
                                                    html += '<td>超过撤回期限</td>'
                                                }
                                                html += '</tr>'
                                            }else{
                                                j++;
                                            }
                                        }
                                        $("#dataTable").empty().append(html);
                                        boundBackEvent(data);
                                        //空白tr补齐表格
                                        if($("#dataTable tbody tr").length<11){
                                            html = '';
                                            var count = 11-$("#dataTable tbody tr").length;
                                            var columns = $("#dataTable tbody tr:first-child th").length;
                                            for(var m=0;m<count;m++){
                                                html+='<tr>';
                                                for(var n=0;n<columns;n++){
                                                    html+="<td>&nbsp</td>";
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
                                        var html = '<tr><th>部门</th><th>日期</th><th>档案号</th><th>姓名</th><th>操作类别</th><th>教育科经办人</th><th>操作</th></tr>';
                                        for(var i in data){
                                            if(j>10*(cur-2)-1 && j<10*(cur-1) && i ){
                                                j++;
                                                html += '<tr>';
                                                for(var m in data[i]){
                                                    html += '<td>'+data[i][m]+'</td>';
                                                }
                                                my = new Date();
                                                my.setFullYear(parseInt(data[i]['lotNumber'].split('-')[0]),parseInt(data[i]['lotNumber'].split('-')[1])-1,parseInt(data[i]['lotNumber'].split('-')[2]))
                                                if((today-my)/(1000*60*60*24) < csData['chqx-dc']['nr2']){
                                                    html += '<td><span class="back">撤回</span></td>'
                                                }else{
                                                    html += '<td>超过撤回期限</td>'
                                                }
                                                html += '</tr>'
                                            }else{
                                                j++;
                                            }
                                        }
                                        $("#dataTable").empty().append(html);
                                        boundBackEvent(data);
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
                            ajaxTimeOut3.abort();    // 超时后中断请求
                            alert('网络超时，请检查网络连接');
                        }
                    }
                })
            }else if(name === csData['cjtjxx-xzjl']['nr2']){
                //呈现新增记录表
                var ajaxTimeOut4 = $.ajax({
                    url: "../../../ways.php",
                    type:"POST",
                    timeout:8000,
                    //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                    data:{funcName:'select',where:' where department like \''+department+'%\' AND (changeType =\''+csData['czlb-levelup2']['nr2']+'\' OR changeType = \''+csData['czlb-dr']['nr3']+'\')',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
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
                                $("#dataPage").css('display','none')
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
                                            html+="<td>&nbsp</td>";
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
                                                    html+="<td>&nbsp</td>";
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
                            ajaxTimeOut4.abort();    // 超时后中断请求
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
    function boundBackEvent(data){
        $("#dataTable .back").off('click').on('click',function(){
            var _this = $(this);
            var archivesId = $(this).parent().siblings('td:nth-child(3)').text();
            var type = $(this).parent().siblings('td:nth-child(5)').text();
            if(confirm('该操作将把该驾驶证恢复到正常状态，是否确定？')){
                //撤回操作共需三步：更新bgxx表；取jbxx表中数据，在dbsx中新增一条；更新jbxx和tjxx
                var where =' where archivesId =\''+ archivesId+'\'';
                var setStr = '';
                var text ='';               //text用于update:tjxx表
                switch (type){
                    case csData['czlb-dc']['nr3']:
                        text = csData['czlb-dc']['name']
                        setStr = 'changeType =\''+csData['czlb-chdc']['nr3']+'\'';
                        break;
                    case csData['czlb-zx']['nr3']:
                        text = _this.parent().siblings('td:nth-child(6)').text();
                        setStr = 'changeType =\''+csData['czlb-chzx']['nr3']+'\''
                        for(var i in csData){
                            if(csData[i]['nr2'] === text){
                                text = csData[i]['name'];
                            }
                        }
                }
                $.ajax({
                    url: "../../../ways.php",
                    type: "POST",
                    timeout: 8000,
                    data: {
                        funcName: 'update',
                        serverName: '10.101.62.73',
                        uid: 'sa',
                        pwd: '2huj15h1',
                        Database: 'jszgl',
                        tableName: ' bgxx',
                        where: ' where archivesId =\'' + archivesId + '\' and changeType=\''+type+'\'',
                        setStr:setStr
                    },
                    dataType: 'json',
                    success:function(){
                        $.ajax({
                            url: "../../../ways.php",
                            type: "POST",
                            data: {
                                funcName: 'select',
                                serverName: '10.101.62.73',
                                uid: 'sa',
                                pwd: '2huj15h1',
                                Database: 'JSZGL',
                                tableName: ' jbxx ',
                                column: ' payId,archivesId,uName,department,cardId,sjDate,sjDriveCode,sex,birthDate,txrq',
                                where: ' where archivesId = \'' + archivesId + '\'',
                                order: ' '
                            },
                            dataType: 'json',
                            success: function (data){
                                var payId = data['row1']['payId'];
                                var archivesId = data['row1']['archivesId'];
                                var birthDate = data['row1']['birthDate'];
                                var cardId = data['row1']['cardId'];
                                var department = data['row1']['department'];
                                var sex = data['row1']['sex'];
                                var sjDate = data['row1']['sjDate'];
                                var sjDriveCode = data['row1']['sjDriveCode'];
                                var txrq = data['row1']['txrq'];
                                var uName = data['row1']['uName'];
                                //插一条新的在dbsx
                                $.ajax({
                                    url: "../../../ways.php",
                                    type: "POST",
                                    timeout: 8000,
                                    data: {
                                        funcName: 'insert',
                                        serverName: '10.101.62.73',
                                        uid: 'sa',
                                        pwd: '2huj15h1',
                                        Database: 'jszgl',
                                        tableName: ' dbsx',
                                        column: ' (payId,archivesId,uName,birthDate,txrq,department,sjDate,' +
                                        'sjDriveCode,type,sex,cardId)',
                                        values: '(\''+payId+'\',\'' + archivesId + '\',\'' + uName + '\',\'' + birthDate + '\',\'' + txrq + '\',\'' + department + '\',\'' + sjDate + '\',\'' + sjDriveCode + '\',\''
                                        + csData['czlb-lz']['nr3'] + '\',\'' + sex + '\',\'' + cardId + '\')'
                                    },
                                    dataType: 'json',
                                    success: function (){

                                    }
                                })
                                var where =' where archivesId =\''+ archivesId+'\'';
                                var setStr = 'status =\''+csData['zjzt-zc']['nr2']+'\'';
                                //jbxx改回正常,tjxx数目回滚
                                $.ajax({
                                    url: "../../../ways.php",
                                    type: "POST",
                                    timeout: 8000,
                                    data: {
                                        funcName: 'update', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                                        tableName: ' jbxx',setStr:setStr, where: where
                                    },
                                    dataType: 'json',
                                    success: function () {
                                        var date = new Date();
                                        var year = date.getFullYear();

                                        var setStr1 = 'decreaseAmount = decreaseAmount - 1,'+text+'='+text+'-1,yearlyAmount = yearlyAmount+1';
                                        var where1 =  ' where driveCode = \''+sjDriveCode+'\' AND year = '+year;
                                        $.ajax({
                                            url: "../../../ways.php",
                                            type: "POST",
                                            timeout: 8000,
                                            data: {
                                                funcName: 'update',
                                                serverName: '10.101.62.73',
                                                uid: 'sa',
                                                pwd: '2huj15h1',
                                                Database: 'jszgl',
                                                tableName: ' tjxx',
                                                setStr: setStr1,
                                                where: where1
                                            },
                                            dataType: 'json',
                                            success: function () {
                                                alert('撤回成功，'+uName+'师傅的驾驶证目前是'+csData['zjzt-zc']['nr2']+'状态');
                                                 _this.remove()
                                            }
                                        })

                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    }
    //添加发放信息
    function appendGiveOut(csData){
        var power = sessionGet('power');
        var obj = {};
        obj.column = ' id,department,payId,UName,cjArriveDate,grArriveDate,checkStatus,finishStatus';
        obj.order = ' order by department,payId ';
        if(power === '1'){
            var department = sessionGet('department').split(',')[0];
            //添加目前已经发放到车间的信息
            obj.where = ' where checkStatus = \''+csData['checkStatus-shtg']['nr2']+'\' AND finishStatus = \''+csData['finishStatus-ffdcj']['nr2']+'\' AND department like \''+department+'%\'';
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
                url: "../../../ways.php",
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
                        var span = '<td><span class="giveOut"></span></td>';
                        for(var y in data){
                            if(data[y]['department'].split(',').length>1){
                                data[y]['department'] = data[y]['department'].split(',')[0];
                            }
                            if(checkIfInArray(data[y]['department'],straightJYK)){
                                text = '发放到个人';
                                span = '<td><span class="giveOut"></span>&nbsp;<span class="tz">短信通知</span></td>';
                            }
                        }
                        if(count<11){
                            for(var i in data){
                                html += '<tr>';
                                for(var j in data[i]){
                                    if(j==='id' || j === 'checkStatus'|| j === 'finishStatus'){
                                        continue
                                    }
                                    html += '<td class="'+data[i]['id']['date']+'">'+data[i][j]+'</td>';
                                }
                                html += span;
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
                            $('#giveOutTable .tz').off('click').on('click',function(){
                                if(confirm('将发送短信提醒乘务员领取证件')){
                                    tzEvent(csData,'提醒取证',$(this).parent().prev().prev().prev().prev().text())
                                    $(this).remove()
                                }
                            })
                            //空白tr补齐表格
                            if($("#fixCheckTable tbody tr").length<11){
                                html = '';
                                var count = 11-$("#giveOutTable tbody tr").length;
                                var columns = $("#giveOutTable tbody tr:first-child th").length;
                                for(var m=0;m<count;m++){
                                    html+='<tr>';
                                    for(var n=0;n<columns;n++){
                                        html+="<td>&nbsp</td>";
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
                                html += span;
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
                            $('#giveOutTable .tz').off('click').on('click',function(){
                                if(confirm('将发送短信提醒乘务员领取证件')){
                                    tzEvent(csData,'提醒取证',$(this).parent().prev().prev().prev().prev().text())
                                    $(this).remove()
                                }
                            })
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
                                            html += span;
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
                                    $('#giveOutTable .tz').off('click').on('click',function(){
                                        if(confirm('将发送短信提醒乘务员领取证件')){
                                            tzEvent(csData,'提醒取证',$(this).parent().prev().prev().prev().prev().text())
                                            $(this).remove()
                                        }
                                    })
                                    //空白tr补齐表格
                                    if($("#giveOutTable tbody tr").length<11){
                                        html = '';
                                        var count = 11-$("#giveOutTable tbody tr").length;
                                        var columns = $("#giveOutTable tbody tr:first-child th").length;
                                        for(var m=0;m<count;m++){
                                            html+='<tr>';
                                            for(var n=0;n<columns;n++){
                                                html+="<td>&nbsp</td>";
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
                                            html += span;
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
                                    $('#giveOutTable .tz').off('click').on('click',function(){
                                        if(confirm('将发送短信提醒乘务员领取证件')){
                                            tzEvent(csData,'提醒取证',$(this).parent().prev().prev().prev().prev().text())
                                            $(this).remove()
                                        }
                                    })
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
                    }else if(power === 'V' && $(this).text() === '发放到车间'){
                        setStr = ' cjArriveDate = \''+ arriveDate +'\',finishStatus = \''+csData['finishStatus-ffdcj']['nr2']+'\' ,jykArriveOperator = \''+user+'\'';
                        confirmP = '请确认'+thisName+'师傅的驾驶证已发放到其所属车间';
                    }else if(power === 'V' && $(this).text() === '发放到个人'){
                        setStr = ' grArriveDate = \''+ arriveDate +'\',finishStatus = \''+csData['finishStatus-ffdgr']['nr2']+'\' ,jykArriveOperator = \''+user+'\'';
                        confirmP = '请确认'+thisName+'师傅的驾驶证已发放到其本人';
                    }
                    id=$(this).parent().prev().prop('className').substring(0,$(this).parent().prev().prop('className').length-3);
                    if(confirm(confirmP)){
                        var ajaxTimeOut = $.ajax({
                            url: "../../../ways.php",
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
                                    tzEvent(csData,csData['finishStatus-ffdgr']['nr2'],payId)
                                    $.ajax({
                                        url: "../../../ways.php",
                                        type: "POST",
                                        timeout: 8000,
                                        data: {
                                            funcName: 'getInfo',
                                            serverName: '10.101.62.73',
                                            uid: 'sa',
                                            pwd: '2huj15h1',
                                            Database: 'jszgl',
                                            tableName: ' bgxx',
                                            column:' changeType',
                                            where:' where id =\''+id+'\''
                                        },
                                        dataType: 'json',
                                        success:function (changeType){
                                            changeType = changeType['row']['changeType']
                                            //发放到个人后，证件状态更新为“正常”
                                            //如果是有效期满换证，起始和截止要加6年
                                            //通知状态改为尚未通知
                                            if(changeType === csData['czlb-yxqmhz']['nr3']){
                                                var set = ' tzDone = \''+csData['tzDone-swtz']['nr2']+'\', status = \''+csData['zjzt-zc']['nr2']+'\',deadline = cast(substring(deadline,0,5) + 6 AS varchar(4)) + substring(deadline,5,11),startDate = cast(substring(startDate,0,5) + 6 AS varchar(4)) + substring(startDate,5,11)'
                                            }else{
                                                var set = ' tzDone = \''+csData['tzDone-swtz']['nr2']+'\',status = \''+csData['zjzt-zc']['nr2']+'\''
                                            }
                                            $.ajax({
                                                url: "../../../ways.php",
                                                type: "POST",
                                                timeout: 8000,
                                                data: {
                                                    funcName: 'update',
                                                    serverName: '10.101.62.73',
                                                    uid: 'sa',
                                                    pwd: '2huj15h1',
                                                    Database: 'jszgl',
                                                    tableName: ' jbxx',
                                                    setStr: set,
                                                    where: ' where payid =\'' + payId + '\''
                                                },
                                                dataType: 'json',
                                                success:function(data){

                                                }
                                            })
                                            $.ajax({
                                                url: "../../../ways.php",
                                                type: "POST",
                                                timeout: 8000,
                                                data: {
                                                    funcName: 'delete',
                                                    serverName: '10.101.62.73',
                                                    uid: 'sa',
                                                    pwd: '2huj15h1',
                                                    Database: 'jszgl',
                                                    tableName: ' sqxx',
                                                    where: ' where payid =\'' + payId + '\''
                                                },
                                                dataType: 'json',
                                                success:function(data){

                                                }
                                            })
                                        }
                                    })
                                    //判断准驾类型是否将发生变化，如果是，要存在tjxx表中
                                    $.ajax({
                                        url: "../../../ways.php",
                                        type: "POST",
                                        timeout: 8000,
                                        data: {
                                            funcName: 'getInfo', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                                            tableName: 'bgxx', column: ' changeReason,driveCode,applyDriveCode ', where: ' where id = \'' + id + '\'', order: ' '
                                        },
                                        dataType: 'json',
                                        success: function (testData) {

                                            if(csData['zjlx-'+testData['row']['driveCode']]['nr2'] > csData['zjlx-'+testData['row']['applyDriveCode']]['nr2']){
                                                //原代码的权重大于申请代码的权重，说明是降低准驾机型操作
                                                var date = new Date();
                                                var year = date.getFullYear()
                                                if(testData['row']['driveCode'] === csData['zjlx-A']['name']){
                                                    testData['row']['driveCode'] = csData['zjlx-J4']['name']
                                                }else if(testData['row']['driveCode'] === csData['zjlx-B']['name']){
                                                    testData['row']['driveCode'] = csData['zjlx-J5']['name']
                                                }else if(testData['row']['driveCode'] === csData['zjlx-C']['name']){
                                                    testData['row']['driveCode'] = csData['zjlx-J6']['name']
                                                }
                                                $.ajax({
                                                    url: "../../../ways.php",
                                                    type: "POST",
                                                    timeout: 8000,
                                                    data: {
                                                        funcName: 'update',
                                                        serverName: '10.101.62.73',
                                                        uid: 'sa',
                                                        pwd: '2huj15h1',
                                                        Database: 'jszgl',
                                                        tableName: ' tjxx',
                                                        setStr: ' jdzjjxDecrease = jdzjjxDecrease +1 , decreaseAmount = decreaseAmount +1 ,yearlyAmount = yearlyAmount - 1',
                                                        where: ' where driveCode =\''+testData['row']['driveCode']+'\' AND year =\''+year+'\''
                                                    },
                                                    dataType: 'json',
                                                    success:function(data){

                                                    }
                                                })
                                                $.ajax({
                                                    url: "../../../ways.php",
                                                    type: "POST",
                                                    timeout: 8000,
                                                    data: {
                                                        funcName: 'update',
                                                        serverName: '10.101.62.73',
                                                        uid: 'sa',
                                                        pwd: '2huj15h1',
                                                        Database: 'jszgl',
                                                        tableName: ' tjxx',
                                                        setStr: ' jdzjjxIncrease = jdzjjxIncrease +1 , IncreaseAmount = IncreaseAmount +1,yearlyAmount = yearlyAmount +1',
                                                        where: ' where driveCode =\''+testData['row']['applyDriveCode']+'\' AND year =\''+year+'\''
                                                    },
                                                    dataType: 'json',
                                                    success:function(data){

                                                    }
                                                })
                                            }else if(csData['zjlx-'+testData['row']['driveCode']]['nr2'] < csData['zjlx-'+testData['row']['applyDriveCode']]['nr2']){
                                                //原代码的权重小于申请代码的权重，说明是增驾操作
                                                var date = new Date();
                                                var year = date.getFullYear()
                                                if(testData['row']['driveCode'] === csData['zjlx-A']['name']){
                                                    testData['row']['driveCode'] = csData['zjlx-J4']['name']
                                                }else if(testData['row']['driveCode'] === csData['zjlx-B']['name']){
                                                    testData['row']['driveCode'] = csData['zjlx-J5']['name']
                                                }else if(testData['row']['driveCode'] === csData['zjlx-C']['name']){
                                                    testData['row']['driveCode'] = csData['zjlx-J6']['name']
                                                }
                                                $.ajax({
                                                    url: "../../../ways.php",
                                                    type: "POST",
                                                    timeout: 8000,
                                                    data: {
                                                        funcName: 'update',
                                                        serverName: '10.101.62.73',
                                                        uid: 'sa',
                                                        pwd: '2huj15h1',
                                                        Database: 'jszgl',
                                                        tableName: ' tjxx',
                                                        setStr: ' zj = zj +1 , decreaseAmount = decreaseAmount +1 ,yearlyAmount = yearlyAmount - 1',
                                                        where: ' where driveCode =\''+testData['row']['driveCode']+'\' AND year =\''+year+'\''
                                                    },
                                                    dataType: 'json',
                                                    success:function(data){

                                                    }
                                                })
                                                $.ajax({
                                                    url: "../../../ways.php",
                                                    type: "POST",
                                                    timeout: 8000,
                                                    data: {
                                                        funcName: 'update',
                                                        serverName: '10.101.62.73',
                                                        uid: 'sa',
                                                        pwd: '2huj15h1',
                                                        Database: 'jszgl',
                                                        tableName: ' tjxx',
                                                        setStr: ' kshg = kshg +1 , IncreaseAmount = IncreaseAmount +1,yearlyAmount = yearlyAmount +1',
                                                        where: ' where driveCode =\''+testData['row']['applyDriveCode']+'\' AND year =\''+year+'\''
                                                    },
                                                    dataType: 'json',
                                                    success:function(data){

                                                    }
                                                })
                                            }else{

                                            }
                                        }
                                    });
                                    $(_this).parent().prev().text(arriveDate)
                                    $(_this).remove();
                                }else if(power==='V' && $(_this).text() === '发放到车间'){
                                    $(_this).parent().prev().prev().text(arriveDate)
                                    $(_this).remove()
                                }else if(power==='V' && $(_this).text() === '发放到个人'){
                                    tzEvent(csData,csData['finishStatus-ffdgr']['nr2'],payId)
                                    $(_this).parent().prev().text(arriveDate)
                                    $(_this).remove()
                                    $.ajax({
                                        url: "../../../ways.php",
                                        type: "POST",
                                        timeout: 8000,
                                        data: {
                                            funcName: 'getInfo',
                                            serverName: '10.101.62.73',
                                            uid: 'sa',
                                            pwd: '2huj15h1',
                                            Database: 'jszgl',
                                            tableName: ' bgxx',
                                            column:' changeType',
                                            where:' where id =\''+id+'\''
                                        },
                                        dataType: 'json',
                                        success:function (changeType){
                                            changeType = changeType['row']['changeType']
                                            //发放到个人后，证件状态更新为“正常”
                                            //如果是有效期满换证，起始和截止要加6年
                                            //通知状态改为尚未通知
                                            if(changeType === csData['czlb-yxqmhz']['nr3']){
                                                var set = ' tzDone = \''+csData['tzDone-swtz']['nr2']+'\', status = \''+csData['zjzt-zc']['nr2']+'\',deadline = cast(substring(deadline,0,5) + 6 AS varchar(4)) + substring(deadline,5,11),startDate = cast(substring(startDate,0,5) + 6 AS varchar(4)) + substring(startDate,5,11)'
                                            }else{
                                                var set = ' tzDone = \''+csData['tzDone-swtz']['nr2']+'\',status = \''+csData['zjzt-zc']['nr2']+'\''
                                            }
                                            $.ajax({
                                                url: "../../../ways.php",
                                                type: "POST",
                                                timeout: 8000,
                                                data: {
                                                    funcName: 'update',
                                                    serverName: '10.101.62.73',
                                                    uid: 'sa',
                                                    pwd: '2huj15h1',
                                                    Database: 'jszgl',
                                                    tableName: ' jbxx',
                                                    setStr: set,
                                                    where: ' where payid =\'' + payId + '\''
                                                },
                                                dataType: 'json',
                                                success:function(data){

                                                }
                                            })
                                            $.ajax({
                                                url: "../../../ways.php",
                                                type: "POST",
                                                timeout: 8000,
                                                data: {
                                                    funcName: 'delete',
                                                    serverName: '10.101.62.73',
                                                    uid: 'sa',
                                                    pwd: '2huj15h1',
                                                    Database: 'jszgl',
                                                    tableName: ' sqxx',
                                                    where: ' where payid =\'' + payId + '\''
                                                },
                                                dataType: 'json',
                                                success:function(data){

                                                }
                                            })
                                        }
                                    })
                                    //判断准驾类型是否将发生变化，如果是，要存在tjxx表中
                                    $.ajax({
                                        url: "../../../ways.php",
                                        type: "POST",
                                        timeout: 8000,
                                        data: {
                                            funcName: 'getInfo', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                                            tableName: 'bgxx', column: ' changeReason,driveCode,applyDriveCode ', where: ' where id = \'' + id + '\'', order: ' '
                                        },
                                        dataType: 'json',
                                        success: function (testData) {

                                            if(csData['zjlx-'+testData['row']['driveCode']]['nr2'] > csData['zjlx-'+testData['row']['applyDriveCode']]['nr2']){
                                                //原代码的权重大于申请代码的权重，说明是降低准驾机型操作
                                                var date = new Date();
                                                var year = date.getFullYear()
                                                if(testData['row']['driveCode'] === csData['zjlx-A']['name']){
                                                    testData['row']['driveCode'] = csData['zjlx-J4']['name']
                                                }else if(testData['row']['driveCode'] === csData['zjlx-B']['name']){
                                                    testData['row']['driveCode'] = csData['zjlx-J5']['name']
                                                }else if(testData['row']['driveCode'] === csData['zjlx-C']['name']){
                                                    testData['row']['driveCode'] = csData['zjlx-J6']['name']
                                                }
                                                $.ajax({
                                                    url: "../../../ways.php",
                                                    type: "POST",
                                                    timeout: 8000,
                                                    data: {
                                                        funcName: 'update',
                                                        serverName: '10.101.62.73',
                                                        uid: 'sa',
                                                        pwd: '2huj15h1',
                                                        Database: 'jszgl',
                                                        tableName: ' tjxx',
                                                        setStr: ' jdzjjxDecrease = jdzjjxDecrease +1 , decreaseAmount = decreaseAmount +1 ,yearlyAmount = yearlyAmount - 1',
                                                        where: ' where driveCode =\''+testData['row']['driveCode']+'\' AND year =\''+year+'\''
                                                    },
                                                    dataType: 'json',
                                                    success:function(data){

                                                    }
                                                })
                                                $.ajax({
                                                    url: "../../../ways.php",
                                                    type: "POST",
                                                    timeout: 8000,
                                                    data: {
                                                        funcName: 'update',
                                                        serverName: '10.101.62.73',
                                                        uid: 'sa',
                                                        pwd: '2huj15h1',
                                                        Database: 'jszgl',
                                                        tableName: ' tjxx',
                                                        setStr: ' jdzjjxIncrease = jdzjjxIncrease +1 , IncreaseAmount = IncreaseAmount +1,yearlyAmount = yearlyAmount +1',
                                                        where: ' where driveCode =\''+testData['row']['applyDriveCode']+'\' AND year =\''+year+'\''
                                                    },
                                                    dataType: 'json',
                                                    success:function(data){

                                                    }
                                                })
                                            }else if(csData['zjlx-'+testData['row']['driveCode']]['nr2'] < csData['zjlx-'+testData['row']['applyDriveCode']]['nr2']){
                                                //原代码的权重小于申请代码的权重，说明是增驾操作
                                                var date = new Date();
                                                var year = date.getFullYear()
                                                if(testData['row']['driveCode'] === csData['zjlx-A']['name']){
                                                    testData['row']['driveCode'] = csData['zjlx-J4']['name']
                                                }else if(testData['row']['driveCode'] === csData['zjlx-B']['name']){
                                                    testData['row']['driveCode'] = csData['zjlx-J5']['name']
                                                }else if(testData['row']['driveCode'] === csData['zjlx-C']['name']){
                                                    testData['row']['driveCode'] = csData['zjlx-J6']['name']
                                                }
                                                $.ajax({
                                                    url: "../../../ways.php",
                                                    type: "POST",
                                                    timeout: 8000,
                                                    data: {
                                                        funcName: 'update',
                                                        serverName: '10.101.62.73',
                                                        uid: 'sa',
                                                        pwd: '2huj15h1',
                                                        Database: 'jszgl',
                                                        tableName: ' tjxx',
                                                        setStr: ' zj = zj +1 , decreaseAmount = decreaseAmount +1 ,yearlyAmount = yearlyAmount - 1',
                                                        where: ' where driveCode =\''+testData['row']['driveCode']+'\' AND year =\''+year+'\''
                                                    },
                                                    dataType: 'json',
                                                    success:function(data){

                                                    }
                                                })
                                                $.ajax({
                                                    url: "../../../ways.php",
                                                    type: "POST",
                                                    timeout: 8000,
                                                    data: {
                                                        funcName: 'update',
                                                        serverName: '10.101.62.73',
                                                        uid: 'sa',
                                                        pwd: '2huj15h1',
                                                        Database: 'jszgl',
                                                        tableName: ' tjxx',
                                                        setStr: ' kshg = kshg +1 , IncreaseAmount = IncreaseAmount +1,yearlyAmount = yearlyAmount +1',
                                                        where: ' where driveCode =\''+testData['row']['applyDriveCode']+'\' AND year =\''+year+'\''
                                                    },
                                                    dataType: 'json',
                                                    success:function(data){

                                                    }
                                                })
                                            }else{

                                            }
                                        }
                                    });
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

    //添加新增证件功能(人员提升标签)
    function appendAppend(csData){
        var power = sessionGet('power');
        if(power === 'V') {
            $.ajax({
                url: "../../../ways.php",
                type: "POST",
                timeout: 8000,
                data: {
                    funcName: 'checkIfExist',
                    serverName: '10.101.62.73',
                    uid: 'sa',
                    pwd: '2huj15h1',
                    Database: 'JSZGL',
                    tableName: 'dbsx',
                    column: ' *',
                    where: ' where type = \'' + csData['czlb-lz']['nr3'] + '\'',
                    order: ' '
                },
                dataType: 'json',
                success:function(ret){
                    if(ret['success'] === 0){
                        $("#quit .redPoint").remove()
                    }else{
                        $('#quit .redPoint').css('display','block');
                        $('.appendButton .redPoint').css('display','block');
                    }
                }
            })
            $.ajax({
                url: "../../../ways.php",
                type: "POST",
                timeout: 8000,
                data: {
                    funcName: 'checkIfExist',
                    serverName: '10.101.62.73',
                    uid: 'sa',
                    pwd: '2huj15h1',
                    Database: 'JSZGL',
                    tableName: 'dbsx',
                    column: ' *',
                    where: ' where type = \'' + csData['czlb-dr']['nr3'] + '\'',
                    order: ' '
                },
                dataType: 'json',
                success:function(ret){
                    if(ret['success'] === 0){
                        $("#dr .redPoint").remove()
                    }else{
                        $('#dr .redPoint').css('display','block');
                        $('.appendButton .redPoint').css('display','block');
                    }
                }
            })
        }
        function boundAppendEvent(data){
            //data是原始数据
            $('.buttonBanner .float:eq(0)').off('click').on('click',function(){
                $('.uploadExcelContent').css('display','block').siblings('.content').css('display','none')
                $('.buttonBanner .float:eq(0)').css({'background':'green','color':'white','fontWeight':'bold'})
                $('.buttonBanner .float:eq(1)').css({'background':'inherit','color':'inherit','fontWeight':'inherit'})
                $('.buttonBanner .float:eq(2)').css({'background':'inherit','color':'inherit','fontWeight':'inherit'})
                $("#appendPage").css('visibility','hidden')
            })
            $('.buttonBanner .float:eq(1)').off('click').on('click',function(){
                $('.levelUpTableContent').css('display','block').siblings('.content').css('display','none')
                $('.buttonBanner .float:eq(1)').css({'background':'green','color':'white','fontWeight':'bold'})
                $('.buttonBanner .float:eq(0)').css({'background':'inherit','color':'inherit','fontWeight':'inherit'})
                $('.buttonBanner .float:eq(2)').css({'background':'inherit','color':'inherit','fontWeight':'inherit'})
                $("#appendPage").css('visibility','visible')
            })
            //查看批次历史记录
            $('.buttonBanner .float:eq(2)').off('click').on('click',function(){
                $('.checkWithPCContent').css('display','block').siblings('.content').css('display','none')
                $('.buttonBanner .float:eq(2)').css({'background':'green','color':'white','fontWeight':'bold'})
                $('.buttonBanner .float:eq(0)').css({'background':'inherit','color':'inherit','fontWeight':'inherit'})
                $('.buttonBanner .float:eq(1)').css({'background':'inherit','color':'inherit','fontWeight':'inherit'})
                $("#appendPage").css('visibility','hidden')
                $.ajax({
                    url: "../../../ways.php",
                    type: "POST",
                    data: {
                        funcName: 'select',
                        serverName: '10.101.62.73',
                        uid: 'sa',
                        pwd: '2huj15h1',
                        Database: 'JSZGL',
                        tableName: ' bgxx ',
                        column: ' distinct pc from dbsx union select distinct pc ',
                        where: ' ',
                        order: ' '
                    },
                    dataType: 'json',
                    success: function (d){
                        var html='';
                        delete d['count']
                        delete d['success']
                        for(var i in d){
                            if(d[i]['pc']){
                                html+='<option>'+d[i]['pc']+'</option>';
                            }
                        }
                        $('#checkWithPCSelect').empty().append(html);
                        $('.checkWithPCContent .control-group .btn').off('click').on('click',function(){
                            if($("#checkWithPCSelect option:selected").val()){
                                var where = ' where PC =\''+$("#checkWithPCSelect option:selected").val()+'\''
                                var columnBGXX = ' PC,archivesId,uName,department,lotnumber';
                                var columnDBSX = ' PC,archivesId,uName,department'
                                $.ajax({
                                    url: "../../../ways.php",
                                    type: "POST",
                                    async:false,
                                    data: {
                                        funcName: 'select',
                                        serverName: '10.101.62.73',
                                        uid: 'sa',
                                        pwd: '2huj15h1',
                                        Database: 'JSZGL',
                                        tableName: ' dbsx ',
                                        column: columnDBSX,
                                        where: where,
                                        order: ' '
                                    },
                                    dataType: 'json',
                                    success: function (data){
                                        $.ajax({
                                            url: "../../../ways.php",
                                            type: "POST",
                                            data: {
                                                funcName: 'select',
                                                serverName: '10.101.62.73',
                                                uid: 'sa',
                                                pwd: '2huj15h1',
                                                Database: 'JSZGL',
                                                tableName: ' bgxx ',
                                                column: columnBGXX,
                                                where: where,
                                                order: ' '
                                            },
                                            dataType: 'json',
                                            success: function (ret){
                                                //下午做考试通过
                                                var passNum =ret['count']?ret['count']:0;
                                                var notPassNum = data['count']?data['count']:0;
                                                var totalNum = passNum+notPassNum;
                                                delete data['count']
                                                delete data['sql']
                                                delete data['success']
                                                delete ret['count']
                                                delete ret['sql']
                                                delete ret['success']
                                                var p = $("#checkWithPCSelect option:selected").val()+'，共：'+totalNum+'人,已通过：'+passNum+'人，尚未通过：'+notPassNum+'人';
                                                $('.checkWithPCContent .pcStatus').empty().text(p)
                                                var big=[];
                                                for(var i in data){
                                                    data[i].lotNumber = '';
                                                    data[i].status = '尚未通过';
                                                    big.push(data[i])
                                                }
                                                for(var m in ret){
                                                    ret[m].status = '已通过'
                                                    big.push(ret[m])
                                                }
                                                var html = '<tr><th>批次</th><th>档案号</th><th>姓名</th><th>部门</th><th>通过时间</th><th>状态</th></tr>';
                                                var count = big.length;
                                                if (count < 11) {
                                                    for (var i in big) {
                                                        html += '<tr>';
                                                        for (var j in big[i]) {
                                                            html += '<td>' + big[i][j] + '</td>';
                                                        }
                                                        html += '</tr>'
                                                    }
                                                    $("#checkWithPCTable").empty().append(html);
                                                    //空白tr补齐表格
                                                    if ($("#checkWithPCTable tbody tr").length < 11) {
                                                        html = '';
                                                        var count = 11 - $("#checkWithPCTable tbody tr").length;
                                                        var columns = $("#checkWithPCTable tbody tr:first-child th").length;
                                                        for (var m = 0; m < count; m++) {
                                                            html += '<tr>';
                                                            for (var n = 0; n < columns; n++) {
                                                                html += "<td>&nbsp</td>";
                                                            }
                                                            html += "</tr>";
                                                        }
                                                        $("#checkWithPCTable tbody").append(html);
                                                    }
                                                } else {
                                                    var q = 0;
                                                    var cur = 1;
                                                    var total = Math.ceil(count / 10);
                                                    $("#checkWithPCPage").css("display", 'block');
                                                    for (var i in big) {
                                                        html += '<tr>';
                                                        for (var j in big[i]) {
                                                            html += '<td>' + big[i][j] + '</td>';
                                                        }
                                                        html += '</tr>'
                                                        q += 1;
                                                        if (q > 9) {
                                                            break
                                                        }
                                                    }
                                                    $("#checkWithPCTable").empty().append(html);
                                                    $("#checkWithPCPage .cur").text(cur);
                                                    $("#checkWithPCPage .total").text(total);
                                                    $("#checkWithPCPage .next").off('click').on('click', function () {
                                                        if (cur < total) {
                                                            var j = 0;
                                                            var html = '<tr><th>批次</th><th>档案号</th><th>姓名</th><th>部门</th><th>通过时间</th><th>状态</th></tr>';
                                                            for (var i in big) {
                                                                if (j > 10 * cur - 1 && j < 10 * (cur + 1) && i) {
                                                                    j++;
                                                                    html += '<tr>';
                                                                    for (var m in big[i]) {
                                                                        html += '<td>' + big[i][m] + '</td>';
                                                                    }
                                                                    html += '</tr>'
                                                                } else {
                                                                    j++;
                                                                }
                                                            }
                                                            $("#checkWithPCTable").empty().append(html);
                                                            //空白tr补齐表格
                                                            if ($("#checkWithPCTable tbody tr").length < 11) {
                                                                html = '';
                                                                var count = 11 - $("#checkWithPCTable tbody tr").length;
                                                                var columns = $("#checkWithPCTable tbody tr:first-child th").length;
                                                                for (var m = 0; m < count; m++) {
                                                                    html += '<tr>';
                                                                    for (var n = 0; n < columns; n++) {
                                                                        html += "<td>&nbsp</td>";
                                                                    }
                                                                    html += "</tr>";
                                                                }
                                                                $("#checkWithPCTable tbody").append(html);
                                                            }
                                                            cur += 1;
                                                            $("#checkWithPCPage .cur").text(cur);
                                                        }

                                                    })
                                                    $("#checkWithPCPage .prev").off('click').on('click', function () {
                                                        if (cur > 1) {
                                                            var j = 0;
                                                            var html = '<tr><th>批次</th><th>档案号</th><th>姓名</th><th>部门</th><th>通过时间</th><th>状态</th></tr>';
                                                            for (var i in big) {
                                                                if (j > 10 * (cur - 2) - 1 && j < 10 * (cur - 1) && i) {
                                                                    j++;
                                                                    html += '<tr>';
                                                                    for (var m in big[i]) {
                                                                        html += '<td>' + big[i][m] + '</td>';
                                                                    }
                                                                    html += '</tr>'
                                                                } else {
                                                                    j++;
                                                                }
                                                            }
                                                            $("#checkWithPCTable").empty().append(html);
                                                            cur -= 1;
                                                            $("#checkWithPCPage .cur").text(cur);
                                                        }
                                                    })
                                                }
                                            }
                                        })
                                    }
                                })
                            }else{
                                alert('请选择批次')
                            }
                        })
                    }
                })
            })
            //同步数据库按钮
            $(".appendContent .float").off('click').on('click',function(){
                if(confirm('请注意，该功能请不要频繁使用')){
                    location.reload();
                }
            })
            //调入：填写驾驶证信息，添加入系统
            $('#appendDRTable .dr').off('click').on('click',function(){
                var _this = $(this);
                var index = ''
                $('#drInfo .sjDateInput').val('')
                $('#drInfo .sjDriveCodeInput').val('')
                $('#drInfo .startDateInput').val('')
                $('#drInfo .deadlineInput').val('')
                for(var i in data){
                    if(data[i]['archivesId'] === $(this).parent().prev().prev().prev().prev().prev().text()){
                        index = i;
                        $('#drInfo .payId').val(data[i]['payId'])
                        $('#drInfo .archivesId').val(data[i]['archivesId'])
                        $('#drInfo .name').val(data[i]['UName'])
                        $('#drInfo .sex').val(data[i]['sex'])
                        $('#drInfo .department').val(data[i]['Department'])
                        $('#drInfo .cardId').val(data[i]['cardId'])
                        $('#drInfo .birthDate').val(data[i]['birthDate'])
                        $('#drInfo .txrq').val(data[i]['txrq'])
                    }
                }
                $('#drInfo .modal-footer .btn-primary').off('click').on('click',function(){
                    var arr = [];
                    var j =0;
                    for(var i in csData){
                        if(csData[i]['lb'] === 'zjlx'){
                            arr[j] = csData[i]['name'];
                            j++;
                        }
                    }
                    $.ajax({
                        url: "../../../ways.php",
                        type: "POST",
                        timeout: 8000,
                        data: {
                            funcName: 'checkIfExist',
                            serverName: '10.101.62.73',
                            uid: 'sa',
                            pwd: '2huj15h1',
                            Database: 'JSZGL',
                            tableName: 'JBxx',
                            column: ' *',
                            where: ' where archivesId = \'' + $('#drInfo .archivesId').val() + '\'',
                            order: ' '
                        },
                        dataType: 'json',
                        success:function(ret){
                            if(ret['success'] === 1){
                                alert('档案号重复，请不要重复操作')
                            }else{
                                if($('#drInfo .sjDateInput').val().match(/^\d{4}-\d{2}-\d{2}$/)){
                                    if(checkIfInArray($('#drInfo .sjDriveCodeInput').val(),arr)){
                                        if($('#drInfo .startDateInput').val().match(/^\d{4}-\d{2}-\d{2}$/)){
                                            if($('#drInfo .deadlineInput').val().match(/^\d{4}-\d{2}-\d{2}$/)){
                                                if(confirm('请确认信息无误，确定后将把该驾驶证插入数据库')){
                                                    $('#drInfo input').css('backgroundColor','white');
                                                    var sjDriveType = csData['zjlx-'+$('#drInfo .sjDriveCodeInput').val()]['nr1']
                                                    var i = index;
                                                    var ajaxTimeOut = $.ajax({
                                                        url: "../../../ways.php",
                                                        type: "POST",
                                                        timeout: 8000,
                                                        data: {
                                                            funcName: 'insert',
                                                            serverName: '10.101.62.73',
                                                            uid: 'sa',
                                                            pwd: '2huj15h1',
                                                            Database: 'jszgl',
                                                            tableName: ' jbxx',
                                                            column: ' (PayId,ArchivesId,UName,BirthDate,Txrq,Department,sjDate,' +
                                                            'sjDriveCode,sjDriveType,status,deadline,startDate,sex,cardId,tzDone)',
                                                            values: '(\''+data[i]['payId']+'\',\'' + data[i]['archivesId'] + '\',\'' + data[i]['UName'] + '\',\'' + data[i]['birthDate'] + '\',\'' + data[i]['txrq'] + '\',\'' + data[i]['Department'] + '\',\'' + $('#drInfo .sjDateInput').val() + '\',\'' + $('#drInfo .sjDriveCodeInput').val() + '\',\''
                                                            + sjDriveType + '\',\'' + csData['zjzt-zc']['nr2'] + '\',\'' + $('#drInfo .deadlineInput').val() + '\',\'' + $('#drInfo .startDateInput').val() + '\',\'' + data[i]['sex'] + '\',\'' + data[i]['cardId'] + '\',\''+csData['tzDone-swtz']['nr2']+'\')'
                                                        },
                                                        dataType: 'json',
                                                        success: function () {
                                                            alert('添加信息成功');
                                                            _this.siblings('.tz').remove()
                                                            _this.remove();
                                                            var date = new Date();
                                                            var year = date.getFullYear()
                                                            var lotNumber = new Date();
                                                            lotNumber.month = lotNumber.getMonth() < 9 ? '0' + (lotNumber.getMonth() + 1) : lotNumber.getMonth() + 1;
                                                            lotNumber.date = lotNumber.getDate() < 10 ? '0' + lotNumber.getDate() : lotNumber.getDate();
                                                            lotNumber = lotNumber.getFullYear() + '-' + lotNumber.month + '-' + lotNumber.date;
                                                            $.ajax({
                                                                url: "../../../ways.php",
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
                                                                    values: '(getDate(),\'' + lotNumber + '\',\'' + data[i]['Department'] + '\',\'' + data[i]['payId'] + '\',\'' + data[i]['archivesId'] + '\',\'' + data[i]['UName'] + '\',\'' + csData['czlb-dr']['nr3']  +
                                                                    '\',\'' + $('#drInfo .sjDriveCodeInput').val() + '\',\'' + sjDriveType + '\',\'' + sessionGet('user') + '\')'
                                                                },
                                                                dataType: 'json',
                                                                success: function (ret) {
                                                                    //调入成功了，从dbsx表中移除这条信息
                                                                    $.ajax({
                                                                        url: "../../../ways.php",
                                                                        type: "POST",
                                                                        timeout: 8000,
                                                                        data: {
                                                                            funcName: 'delete',
                                                                            serverName: '10.101.62.73',
                                                                            uid: 'sa',
                                                                            pwd: '2huj15h1',
                                                                            Database: 'jszgl',
                                                                            tableName: ' dbsx',
                                                                            where:' where archivesId = \''+data[i]['archivesId']+'\' and type=\''+csData['czlb-dr']['nr3']+'\''
                                                                        },
                                                                        dataType: 'json',
                                                                        success: function (ret) {

                                                                        }
                                                                    })
                                                                }
                                                            })
                                                            $.ajax({
                                                                url: "../../../ways.php",
                                                                type: "POST",
                                                                timeout: 8000,
                                                                data: {
                                                                    funcName: 'update',
                                                                    serverName: '10.101.62.73',
                                                                    uid: 'sa',
                                                                    pwd: '2huj15h1',
                                                                    Database: 'jszgl',
                                                                    tableName: ' tjxx',
                                                                    setStr: ' dr = dr +1 , IncreaseAmount = IncreaseAmount +1,yearlyAmount = yearlyAmount +1',
                                                                    where: ' where driveCode =\''+$('#drInfo .sjDriveCodeInput').val()+'\' AND year =\''+year+'\''
                                                                },
                                                                dataType: 'json',
                                                                success:function(data){

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
                                                                ajaxTimeOut.abort();    // 超时后中断请求
                                                                alert('网络超时，请检查网络连接');
                                                            }
                                                        }
                                                    })
                                                    $('#drInfo').modal('hide')
                                                }
                                            }else{
                                                alert('有效截止日期格式不正确，应为"xxxx-xx-xx"');
                                                $('#drInfo input').css('backgroundColor','white')
                                                $('#drInfo .deadlineInput').css('backgroundColor','#ffcccc').focus()
                                            }
                                        }else{
                                            alert('有效起始日期格式不正确，应为"xxxx-xx-xx"');
                                            $('#drInfo input').css('backgroundColor','white')
                                            $('#drInfo .startDateInput').css('backgroundColor','#ffcccc').focus()
                                        }
                                    }else{
                                        alert('准驾类型代码输入不正确');
                                        $('#drInfo input').css('backgroundColor','white')
                                        $('#drInfo .sjDriveCodeInput').css('backgroundColor','#ffcccc').focus()
                                    }
                                }else{
                                    alert('初次领证日期格式不正确，应为"xxxx-xx-xx"')
                                    $('#drInfo input').css('backgroundColor','white')
                                    $('#drInfo .sjDateInput').css('backgroundColor','#ffcccc').focus()
                                }
                            }
                        }
                    })

                })
            })
            appendModal();
            //上传按钮事件，上传具提升司机资格名单
            $(".uploadExcelContent .confirmUpload").off('click').on('click',function(){
                //设置这一批的批次名
                var year = new Date();
                year = year.getFullYear();
                var html ='';
                html+='<option>'+(year-1)+'</option>';
                html+='<option selected>'+year+'</option>';
                html+='<option>'+(year+1)+'</option>';
                $("#year").empty().append(html);
                html='<option selected>1</option>';
                html+='<option>2</option>';
                $("#PCselect").empty().append(html);
                $('#selectPC').modal('show');
                $("#uploadContent tbody tr td").css('background','inherit')
                var uploadArr = [];
                var driveTypeArr = [];
                //取准驾机型
                for(var i in csData){
                    if(csData[i]['lb'] === 'zjlx'){
                        driveTypeArr.push(csData[i]['name'])
                    }
                }
                var reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;      //身份证正则
                var done = 0;
                //提交按钮
                $("#selectPC .btn-primary").off('click').on('click',function(){
                    //逻辑：大名单中的信息在bigArr中，拿小名单中的cardId去比对，比对成功就把信息
                    //合并，然后再一起循环发ajax请求新增dbsx
                    var flag =true;
                    var PC = $('#selectPC #year option:selected').val()+'年第'+$('#selectPC #PCselect option:selected').val()+'批';
                    $.each($('#uploadContent table tbody tr'),function(i,val){
                        var obj = {}
                        obj.uName = $(val).find('.uName').val()
                        obj.sex = $(val).find('.sex').val()
                        if(reg.test($(val).find('.cardId').val())){
                            obj.cardId = $(val).find('.cardId').val()
                        }else{
                            $(val).find('td').css('background','#ffcccc')
                            alert('第'+$(val).find('.number').val()+'条身份证号错误')
                            flag = false;
                            return false;
                        }
                        if($(val).find('.phone').val().match((/^[0-9]{11}$/))){
                            obj.phone = $(val).find('.phone').val()
                        }else{
                            $(val).find('td').css('background','#ffcccc')
                            alert('第'+$(val).find('.number').val()+'条电话号码错误')
                            flag = false;
                            return false;
                        }
                        //处理小名单中的准驾类型
                        for(var j=0;j<driveTypeArr.length;j++){
                            var reg1 = new RegExp(driveTypeArr[j]);
                            if(reg1.exec($(val).find('.applyType').val())){
                                obj.sjDriveCode = reg1.exec($(val).find('.applyType').val())[0];
                            }
                        }
                        //比对：身份证号相同并且（名字第一个字或最后一个字相同），然后补全档案号
                        for(var m=0;m<bigArr.length;m++){
                            if(obj.cardId === bigArr[m]['cardId'] && (obj.uName[0] === bigArr[m]['uName'][0] || obj.uName[obj.uName.length] === bigArr[m]['uName'][bigArr[m]['uName'].length-1])){
                                if(bigArr[m]['archivesId'].match(/^[0-9]{5}$/)){
                                    obj.archivesId = bigArr[m]['archivesId'];
                                }else if(bigArr[m]['archivesId'].match(/^[0-9]{4}$/)){
                                    obj.archivesId = '0'+bigArr[m]['archivesId'];
                                }else if(bigArr[m]['archivesId'].match(/^[0-9]{3}$/)){
                                    obj.archivesId = '00'+bigArr[m]['archivesId'];
                                }else if(bigArr[m]['archivesId'].match(/^[0-9]{2}$/)){
                                    obj.archivesId = '000'+bigArr[m]['archivesId'];
                                }else if(bigArr[m]['archivesId'].match(/^[0-9]{1}$/)){
                                    obj.archivesId = '0000'+bigArr[m]['archivesId'];
                                }
                                break;
                            }
                        }
                        uploadArr[i] = Object.assign(obj);
                    })
                    for(var m=0;m<uploadArr.length;m++){
                        if(!uploadArr[m].archivesId){
                            //如果没有档案号，说明该条用身份证在两个名单没比对成功（有可能是打错身份证）
                            //还有一种原因：教育科说报名以车间报的为准，劳人科的名单只作参考。所以小名单中
                            //的身份证在大名单中找不到。
                            //那么就用身份证号去62库中比对，但是62表中身份证有错，所以加一层出生日期校验
                            $.ajax({
                                url: "../../../ways.php",
                                type: "POST",
                                async:false,
                                data: {
                                    funcName: 'select',
                                    serverName: '10.101.62.62',
                                    uid: 'sa',
                                    pwd: '2huj15h1',
                                    Database: 'userinfo',
                                    tableName: ' userinfo1 ',
                                    column: ' archivesId',
                                    where: ' where cardId = \'' + uploadArr[m]['cardId'] + '\' AND charindex(substring(birthdate,1,4)+substring(birthdate,6,2)+substring(birthdate,9,2),cardid) =7',
                                    order: ' '
                                },
                                dataType: 'json',
                                success: function (data){
                                    if(data['success'] === 1 && data['count'] === 1){
                                        uploadArr[m]['archivesId'] = data['row1']['archivesId'];
                                    }
                                }
                            })
                        }
                    }
                    //回调函数再次检验uploadArr，这时候如果还有没有档案号的数据，那只能用户输入了
                    //为了防止错误，输入后还要去62库比对一下，如果身份证、姓名、电话能对上一种，就予通过
                    testUploadArr(uploadArr);
                    function testUploadArr(uploadArr){
                        var flag1 = true;
                        for(var n=0;n<uploadArr.length;n++){
                            if(!uploadArr[n].archivesId){
                                flag1 = false;
                                $("#selectPC").modal('toggle')
                                $("#inputArchivesId").modal('toggle')
                                $("#inputArchivesIdName").text(uploadArr[n]['uName'])
                                $("#inputArchivesId .btn-primary").off('click').on('click',function(){
                                    if($('#inputArchivesIdInput').val().match(/^[0-9]{5}$/)){
                                        $.ajax({
                                            url: "../../../ways.php",
                                            type: "POST",
                                            async:false,
                                            data: {
                                                funcName: 'select',
                                                serverName: '10.101.62.62',
                                                uid: 'sa',
                                                pwd: '2huj15h1',
                                                Database: 'userinfo',
                                                tableName: ' userinfo1 ',
                                                column: ' cardId,uName,phone1',
                                                where: ' where archivesId = \'' + $('#inputArchivesIdInput').val() + '\'',
                                                order: ' '
                                            },
                                            dataType: 'json',
                                            success: function (data){
                                                if(data['success'] === 1 && data['count'] === 1){
                                                    //身份证，姓名，电话号码匹配一项即可
                                                    if(data['row1']['cardId'] === uploadArr[n]['cardId'] || data['row1']['uName'] === uploadArr[n]['uName'] || data['row1']['phone1'] === uploadArr[n]['phone']){
                                                        uploadArr[n]['archivesId'] = $('#inputArchivesIdInput').val();
                                                        $("#inputArchivesId").modal('toggle')
                                                        $("#selectPC").modal('toggle')
                                                        testUploadArr(uploadArr)
                                                    }else{
                                                        alert('档案号输入错误')
                                                    }
                                                }else{
                                                    alert('档案号输入错误')
                                                }
                                            }
                                        })
                                    }else{
                                        alert('档案号格式错误')
                                    }
                                })
                                break;
                            }
                        }
                        if(flag1){
                            //没有无档案号的数据了，开始新增dbsx表数据
                            //先去62表中取部门和payId，比对逻辑是档案号加姓名首字或末字（防止之前大名单中有错）
                            $(".uploadExcelContent .progressBar").css('display','block')
                            $('#selectPC').modal('hide')
                            var payId ='';
                            var archivesId='';
                            var uName='';
                            var department='';
                            var cardId='';
                            var type = csData['czlb-levelup2']['nr2']
                            var phone='';
                            var sjDriveCode='';
                            var sex='';
                            var birthDate='';
                            var txrq='';
                            for(var i=0;i<uploadArr.length;i++){
                                $.ajax({
                                    url: "../../../ways.php",
                                    type: "POST",
                                    async:false,
                                    data: {
                                        funcName: 'select',
                                        serverName: '10.101.62.62',
                                        uid: 'sa',
                                        pwd: '2huj15h1',
                                        Database: 'userinfo',
                                        tableName: ' userinfo1 ',
                                        column: ' payId,department,birthDate,txrq',
                                        where: ' where archivesId = \'' + uploadArr[i]['archivesId'] + '\' AND (substring(uName,1,1) =\''+uploadArr[i]['uName'][0]+'\' OR substring(uName,LEN(uName),1)=\''+uploadArr[i]['uName'][uploadArr[i]['uName'].length-1]+'\')',
                                        order: ' '
                                    },
                                    dataType: 'json',
                                    success: function (data){
                                        if(data['success'] === 1 && data['count'] ===1){
                                            uName = uploadArr[i]['uName'];
                                            phone = uploadArr[i]['phone'];
                                            cardId = uploadArr[i]['cardId'];
                                            archivesId = uploadArr[i]['archivesId'];
                                            sjDriveCode = uploadArr[i]['sjDriveCode'];
                                            sex = uploadArr[i]['sex'];
                                            payId = data['row1']['payId']?data['row1']['payId']:'';
                                            birthDate = data['row1']['birthDate']?data['row1']['birthDate']:'';
                                            txrq = data['row1']['txrq']?data['row1']['txrq']:'';
                                            if(data['row1']['department'].split(',').length>1){
                                                department = data['row1']['department'].split(',')[0];
                                            }else{
                                                department = data['row1']['department']?data['row1']['department']:'';
                                            }
                                        }else{
                                            alert('没有全部上传成功。出错条目：'+uploadArr[i]['uName']+'\u000d请更正Excel后重新上传')
                                            done-=1;
                                        }
                                        $.ajax({
                                            url: "../../../ways.php",
                                            type: "POST",
                                            timeout: 8000,
                                            async:false,
                                            data: {
                                                funcName: 'checkIfExist',
                                                serverName: '10.101.62.73',
                                                uid: 'sa',
                                                pwd: '2huj15h1',
                                                Database: 'JSZGL',
                                                tableName: ' dbsx',
                                                column: ' *',
                                                where: ' where archivesId = \'' + archivesId + '\'',
                                                order: ' '
                                            },
                                            dataType: 'json',
                                            success:function(data){
                                                if(data['success'] === 0){
                                                    //未重复，插入
                                                    $.ajax({
                                                        url: "../../../ways.php",
                                                        type: "POST",
                                                        timeout: 8000,
                                                        async:false,
                                                        data: {
                                                            funcName: 'insert',
                                                            serverName: '10.101.62.73',
                                                            uid: 'sa',
                                                            pwd: '2huj15h1',
                                                            Database: 'jszgl',
                                                            tableName: ' dbsx',
                                                            column: ' (payId,archivesId,uname,department,cardId,type,birthDate,txrq,sjDriveCode,phone,PC)',
                                                            values: '(\''+payId+'\',\'' + archivesId + '\',\'' + uName + '\',\'' + department + '\',\'' + cardId + '\',\'' + type + '\',\'' +birthDate+'\',\'' + txrq + '\',\'' + sjDriveCode + '\',\''+ phone + '\',\''+ PC +'\')'
                                                        },
                                                        dataType: 'json',
                                                        success: function (ret) {
                                                            if(ret['success'] === 1){
                                                                $(".progressBar .total").html(uploadArr.length)
                                                                done+=1;
                                                                $(".progressBar .done").html(done)
                                                                if(done === uploadArr.length){
                                                                    alert('上传成功')
                                                                }
                                                            }
                                                        }
                                                    })
                                                }else if(data['success'] === 1){
                                                    //重复，更新
                                                    $.ajax({
                                                        url: "../../../ways.php",
                                                        type: "POST",
                                                        timeout: 8000,
                                                        async:false,
                                                        data: {
                                                            funcName: 'update',
                                                            serverName: '10.101.62.73',
                                                            uid: 'sa',
                                                            pwd: '2huj15h1',
                                                            Database: 'jszgl',
                                                            tableName: ' dbsx',
                                                            setStr: ' uname = \''+ uName+'\',payId = \''+ payId+'\',department = \''+department+'\',cardId = \''+ cardId +'\',birthDate = \''+birthDate+'\',txrq = \''+txrq+'\',phone = \''+phone+'\',sjDriveCode = \''+sjDriveCode+'\',sex = \''+ sex+'\',type = \''+csData['czlb-levelup2']['nr2']+'\'',
                                                            where: ' where archivesId = \'' + archivesId + '\''
                                                        },
                                                        dataType: 'json',
                                                        success:function(data){
                                                            $(".progressBar .total").html(uploadArr.length)
                                                            done+=1;
                                                            $(".progressBar .done").html(done)
                                                            if(done === uploadArr.length){
                                                                alert('上传成功')
                                                                //location.reload()
                                                            }
                                                        }
                                                    })
                                                }
                                            }
                                        })
                                    }
                                })
                            }
                        }
                    }
                })
            })
            //调出
            $('#appendLZTable .dc').off('click').on('click',function(){
                if(confirm('请在确认该职工已调出后进行本操作！')){
                    var _this = $(this);
                    var archivesId = $(this).parent().prev().prev().prev().prev().text();
                    var where =' where archivesId =\''+ archivesId+'\'';
                    var setStr = 'status =\''+csData['zjzt-dc']['nr2']+'\'';
                    for(var i in data){
                        if(data[i]['archivesId'] === archivesId){
                            var uName = data[i]['UName'];
                            var sjDriveCode = data[i]['sjDriveCode']
                            var department = data[i]['Department'];
                        }
                    }
                    $.ajax({
                        url: "../../../ways.php",
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
                            lotNumber =  lotNumber.getFullYear()+ '-' + lotNumber.month + '-' + lotNumber.date;
                            $.ajax({
                                url: "../../../ways.php",
                                type: "POST",
                                timeout: 8000,
                                data: {
                                    funcName: 'insert',
                                    serverName: '10.101.62.73',
                                    uid: 'sa',
                                    pwd: '2huj15h1',
                                    Database: 'jszgl',
                                    tableName: ' bgxx',
                                    column: ' (id,lotNumber,archivesId,UName,department,changeType,' +
                                    'driveCode,drive,jykOperator)',
                                    values: '(getDate(),\'' + lotNumber + '\',\'' + archivesId + '\',\'' + uName + '\',\''+ department + '\',\'' + csData['czlb-dc']['nr3'] +
                                    '\',\'' + sjDriveCode + '\',\'' + csData['zjlx-'+sjDriveCode]['nr1'] + '\',\''+sessionGet('user')+'\')'
                                },
                                dataType: 'json',
                                success: function (ret) {
                                    var date = new Date();
                                    var year = date.getFullYear()
                                    var setStr1 = 'decreaseAmount = decreaseAmount + 1,dc=dc+1,yearlyAmount = yearlyAmount-1';
                                    var where1 =  ' where driveCode = \''+sjDriveCode+'\' AND year = '+year;
                                    $.ajax({
                                        url: "../../../ways.php",
                                        type: "POST",
                                        timeout: 8000,
                                        data: {
                                            funcName: 'update',
                                            serverName: '10.101.62.73',
                                            uid: 'sa',
                                            pwd: '2huj15h1',
                                            Database: 'jszgl',
                                            tableName: ' tjxx',
                                            setStr: setStr1,
                                            where: where1
                                        },
                                        dataType: 'json',
                                        success: function () {

                                        }
                                    })
                                    $.ajax({
                                        url: "../../../ways.php",
                                        type: "POST",
                                        timeout: 8000,
                                        data: {
                                            funcName: 'delete',
                                            serverName: '10.101.62.73',
                                            uid: 'sa',
                                            pwd: '2huj15h1',
                                            Database: 'jszgl',
                                            tableName: ' dbsx',
                                            where: ' where archivesId = \''+ archivesId +'\' and type = \''+csData['czlb-lz']['nr3']+'\''
                                        },
                                        dataType: 'json',
                                        success: function () {

                                        }
                                    })
                                    _this.siblings('.tx').remove();
                                    _this.remove();
                                    alert('操作成功。该证件的状态目前为：'+csData['zjzt-dc']['nr2']);
                                }
                            })
                        }
                    })
                }
            })
            //退休
            $('#appendLZTable .tx').off('click').on('click',function(){
                if(confirm('请在确认该职工已退休后进行本操作！')){
                    var _this = $(this);
                    var archivesId = $(this).parent().prev().prev().prev().prev().text();
                    var where =' where archivesId =\''+ archivesId+'\'';
                    var setStr = 'status =\''+csData['zjzt-zx']['nr2']+'\'';
                    for(var i in data){
                        if(data[i]['archivesId'] === archivesId){
                            var uName = data[i]['UName'];
                            var sjDriveCode = data[i]['sjDriveCode']
                            var department = data[i]['Department'];
                        }
                    }
                    $.ajax({
                        url: "../../../ways.php",
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
                            lotNumber =  lotNumber.getFullYear()+ '-' + lotNumber.month + '-' + lotNumber.date;
                            $.ajax({
                                url: "../../../ways.php",
                                type: "POST",
                                timeout: 8000,
                                data: {
                                    funcName: 'insert',
                                    serverName: '10.101.62.73',
                                    uid: 'sa',
                                    pwd: '2huj15h1',
                                    Database: 'jszgl',
                                    tableName: ' bgxx',
                                    column: ' (id,lotNumber,archivesId,UName,department,changeType,changeReason,' +
                                    'driveCode,drive,jykOperator)',
                                    values: '(getDate(),\'' + lotNumber + '\',\'' + archivesId + '\',\'' + uName + '\',\''+ department + '\',\'' + csData['czlb-zx']['nr3'] + '\',\'' + csData['zxyy-tx']['nr2'] +
                                    '\',\'' + sjDriveCode + '\',\'' + csData['zjlx-'+sjDriveCode]['nr1'] + '\',\''+sessionGet('user')+'\')'
                                },
                                dataType: 'json',
                                success: function (ret) {
                                    var date = new Date();
                                    var year = date.getFullYear()
                                    var setStr1 = 'decreaseAmount = decreaseAmount + 1,tx=tx+1,yearlyAmount = yearlyAmount-1';
                                    var where1 =  ' where driveCode = \''+sjDriveCode+'\' AND year = '+year;
                                    $.ajax({
                                        url: "../../../ways.php",
                                        type: "POST",
                                        timeout: 8000,
                                        data: {
                                            funcName: 'update',
                                            serverName: '10.101.62.73',
                                            uid: 'sa',
                                            pwd: '2huj15h1',
                                            Database: 'jszgl',
                                            tableName: ' tjxx',
                                            setStr: setStr1,
                                            where: where1
                                        },
                                        dataType: 'json',
                                        success: function () {

                                        }
                                    })
                                    $.ajax({
                                        url: "../../../ways.php",
                                        type: "POST",
                                        timeout: 8000,
                                        data: {
                                            funcName: 'delete',
                                            serverName: '10.101.62.73',
                                            uid: 'sa',
                                            pwd: '2huj15h1',
                                            Database: 'jszgl',
                                            tableName: ' dbsx',
                                            where: ' where archivesId = \''+ archivesId +'\' and type = \''+csData['czlb-lz']['nr3']+'\''
                                        },
                                        dataType: 'json',
                                        success: function () {

                                        }
                                    })
                                    _this.siblings('.dc').remove();
                                    _this.remove();
                                    alert('操作成功。该证件的状态目前为：'+csData['czlb-zx']['nr3']);
                                }
                            })
                        }
                    })
                }
            })
            //调入短信通知
            $('#appendDRTable .tz').off('click').on('click',function(){
                var uName = $(this).parent().prev().prev().prev().prev().html();
                var _this = $(this);
                var payId = $(this).parent().prev().prev().prev().prev().prev().prev().html();
                if(confirm('将向'+uName+'师傅发送短信，提醒他来登记驾驶证')){
                    tzEvent(csData,csData['czlb-dr']['nr3'],payId)
                    _this.remove()
                }
            })
            //上传excel文件
            //教育科小名单上传
            function handleFile(e) {
                var files = e.target.files;
                var unit = '洛阳机务段';
                var i,f;
                for (i = 0, f = files[i]; i != files.length; ++i) {
                    var reader = new FileReader();
                    var name = f.name;
                    reader.onload = function(e) {
                        var data = e.target.result;
                        var workbook = XLSX.read(data, {type: 'binary'});
                        var sheet_name_list = workbook.SheetNames;
                        var result = [];
                        var headItem=[];
                        var dataItem=[];
                        var dataFormulae=[];
                        var dataCsv=[];
                        var headCode=[];
                        var rowNum=0;
                        sheet_name_list.forEach(function(y) {
                            var worksheet = workbook.Sheets[y];
                            var json = XLSX.utils.sheet_to_json(workbook.Sheets[y]);
                            var formulae = XLSX.utils.sheet_to_formulae(workbook.Sheets[y]);
                            var csv = XLSX.utils.sheet_to_formulae(workbook.Sheets[y]);
                            if(json.length > 0){
                                result=json;
                                dataCsv=csv;
                            }
                        });
                        $.each(dataFormulae,function (j,head) {
                            var headlist=head.split("='")
                            if(/^[A-Z]2$/.test(headlist[0])){
                                headItem.push(headlist[1])
                            }
                        })
                        $.each(result,function (i,val) {
                            var data=[]
                            $.each(headItem,function (k,head) {
                                val[head]!=undefined?data.push(val[head]):data.push("")
                            })
                            dataItem.push(data)
                        })
                        $.each(dataCsv,function (j,head) {
                            var headlist=head.split("='")
                            rowNum=/^[A-Z]+(\d+)$/.exec(headlist[0])[1];
                            headCode.indexOf(/^([A-Z]+)\d+$/.exec(headlist[0])[1])==-1?headCode.push(/^([A-Z]+)\d+$/.exec(headlist[0])[1]):'';
                        })
                        headCode=headCode.sort();
                        $.each(headCode,function (i,val) {
                            headItem[val]='';
                        })
                        for(var i=0;i<Number(rowNum)-1;i++){
                            var obj={};
                            $.each(headCode,function (i,val) {
                                obj[val]='';
                            })
                            dataItem[i]=obj;
                        }
                        $.each(dataCsv,function (j,head) {
                            var headlist=head.split("='")
                            var code= /^([A-Z]+)\d+$/.exec(headlist[0])[1];
                            var row= /^[A-Z]+(\d+)$/.exec(headlist[0])[1];
                            if(row==2){
                                headItem[j]=headlist[1]
                            }else if(row >2){
                                dataItem[row-2][code]=headlist[1];
                            }
                        })
                        var headstr='';
                        var datastr='';
                        $.each(headItem,function (i,head) {
                            if(i === 0){

                            }else{
                                headstr=headstr+'<th style="border: 1px solid #cccccc">'+head+'</th>'
                            }

                        })
                        $.each(dataItem,function (i,data) {
                            if(data['C'].indexOf(unit) > 0){
                                datastr=datastr+'<tr >';
                                var clasS = '';
                                if(i === 0){

                                }else{
                                    $.each(data,function (j,val) {
                                        switch (j){
                                            //
                                            //按照劳人科给的《具提升资格人员名单》，把每一列和类名意义对应
                                            //需要和劳人科约定规则，不能随意更改
                                            case 'A':clasS = 'number input-mini';
                                                break;
                                            case 'B':clasS = 'company input-large';
                                                break;
                                            case 'C':clasS = 'unit input-xlarge';
                                                break;
                                            case 'D':clasS = 'uName input-mini';
                                                break;
                                            case 'E':clasS = 'sex input-mini';
                                                break;
                                            case 'F':clasS = 'cardId input-medium';
                                                break;
                                            case 'G':clasS = 'minzu input-mini';
                                                break;
                                            case 'H':clasS = 'byyx input-medium';
                                                break;
                                            case 'I':clasS = 'whcd input-mini';
                                                break;
                                            case 'J':clasS = 'phone input-small';
                                                break;
                                            case 'K':clasS = 'mail input-mini';
                                                break;
                                            case 'L':clasS = 'applyType input-small';
                                                break;
                                            case 'M':clasS = 'zj input-mini';
                                                break;
                                            case 'N':clasS = 'cardCheck input-mini';
                                                break;
                                        }
                                        datastr=datastr+'<td style="border: 1px solid #cccccc">'+'<input class="'+clasS+'" style="font-size:13px" type="text" value="'+val+'"></td>'
                                    })
                                    datastr=datastr+'</tr>';
                                }
                            }

                        })
                        var table='<table class="table table-bordered table-striped table-condensed"><thead><tr style="font-weight: bold">'+headstr+'</tr></thead><tbody>'+datastr+ '</tbody></table>'
                        $('#uploadContent').empty().html( $('#uploadContent').html()+table);
                        alert('请检查信息是否有误，确认无误后请点击表格末尾的“上传”按钮')
                        $('.confirmUpload').css('display','inline-block')
                    };
                    reader.readAsBinaryString(f);
                }
            }
            $('#uploadExcel').bind('change', handleFile);
            //劳人科大名单上传
            var bigArr = [];
            function handleFile1(e){
                var files = e.target.files;
                var i,f;
                for (i = 0, f = files[i]; i != files.length; ++i) {
                    var reader = new FileReader();
                    var name = f.name;
                    reader.onload = function(e) {
                        var data = e.target.result;
                        var workbook = XLSX.read(data, {type: 'binary'});
                        var sheet_name_list = workbook.SheetNames;
                        var result = [];
                        var headItem=[];
                        var dataItem=[];
                        var dataFormulae=[];
                        var dataCsv=[];
                        var headCode=[];
                        var rowNum=0;
                        sheet_name_list.forEach(function(y) {
                            var worksheet = workbook.Sheets[y];
                            var json = XLSX.utils.sheet_to_json(workbook.Sheets[y]);
                            var formulae = XLSX.utils.sheet_to_formulae(workbook.Sheets[y]);
                            var csv = XLSX.utils.sheet_to_formulae(workbook.Sheets[y]);
                            if(json.length > 0){
                                result=json;
                                dataCsv=csv;
                            }
                        });
                        $.each(dataFormulae,function (j,head) {
                            var headlist=head.split("='")
                            if(/^[A-Z]2$/.test(headlist[0])){
                                headItem.push(headlist[1])
                            }
                        })
                        $.each(result,function (i,val) {
                            var data=[]
                            $.each(headItem,function (k,head) {
                                val[head]!=undefined?data.push(val[head]):data.push("")
                            })
                            dataItem.push(data)
                        })
                        $.each(dataCsv,function (j,head) {
                            var headlist=head.split("='")
                            rowNum=/^[A-Z]+(\d+)$/.exec(headlist[0])[1];
                            headCode.indexOf(/^([A-Z]+)\d+$/.exec(headlist[0])[1])==-1?headCode.push(/^([A-Z]+)\d+$/.exec(headlist[0])[1]):'';
                        })
                        headCode=headCode.sort();
                        $.each(headCode,function (i,val) {
                            headItem[val]='';
                        })
                        for(var i=0;i<Number(rowNum)-1;i++){
                            var obj={};
                            $.each(headCode,function (i,val) {
                                obj[val]='';
                            })
                            dataItem[i]=obj;
                        }
                        $.each(dataCsv,function (j,head) {
                            var headlist=head.split("='")
                            var code= /^([A-Z]+)\d+$/.exec(headlist[0])[1];
                            var row= /^[A-Z]+(\d+)$/.exec(headlist[0])[1];
                            if(row==1){
                                headItem[j]=headlist[1]
                            }else if(row){
                                dataItem[row-2][code]=headlist[1];
                            }
                        })
                        var headstr='';
                        var datastr='';
                        $.each(headItem,function (i,head) {
                            headstr=headstr+'<th style="border: 1px solid #cccccc">'+head+'</th>'
                        })
                        $.each(dataItem,function (i,data) {
                            var obj = {};
                            $.each(data,function (j,val) {
                                switch (j){
                                    case 'E':obj.archivesId = val;
                                        break;
                                    case 'D':obj.uName = val;
                                        break;
                                    case 'K':obj.cardId = val;
                                        break;
                                }
                                bigArr[i] = Object.assign(obj);
                            })
                        })
                        $("#hiddenUpload").css('visibility','visible');
                        return bigArr;
                    };
                    reader.readAsBinaryString(f);
                }
            }
            $('#uploadExcel1').bind('change', handleFile1);

            //明天做按批次查看人员，加一个标签页，

        }
        //激活标签页
        $('#appendBanner a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        })
        $('a[href="#quitContent"]').on('shown', function (e) {
            $("#appendPage").css('display','none')
            $(this).find(".redPoint").css("display",'none');
            $.ajax({
                url: "../../../ways.php",
                type: "POST",
                timeout: 8000,
                //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                data: {
                    funcName: 'select',
                    where: ' where type =\''+csData['czlb-lz']['nr3']+'\'',
                    serverName: '10.101.62.73',
                    uid: 'sa',
                    pwd: '2huj15h1',
                    Database: 'JSZGL',
                    tableName: ' dbsx ',
                    column: ' *',
                    order: ' order by payId'
                },
                dataType: 'json',
                success: function (data) {
                    if (data['success'] === 1) {
                        delete data['success'];
                        var count = data['count'];
                        delete data['count'];
                        var html = '<tr><th>工资号</th><th>档案号</th><th>姓名</th><th>部门</th><th>身份证号</th><th>操作</th></tr>';

                        var use = {};
                        use = $.extend(true,use,data);
                        for(var u in use){
                            delete use[u]['type']
                            delete use[u]['sjDate']
                            delete use[u]['sjDriveCode']
                            delete use[u]['sjRemark']
                            delete use[u]['sjDrive']
                            delete use[u]['sex']
                            delete use[u]['birthDate']
                            delete use[u]['txrq']
                            delete use[u]['phone']
                            delete use[u]['PC']
                        }
                        if (count < 11) {
                            for (var i in use) {
                                html += '<tr>';
                                for (var j in use[i]) {
                                    html += '<td>' + use[i][j] + '</td>';
                                }
                                html += '<td><span class="dc">调出</span><span class="tx">退休</span></td>';
                                html += '</tr>'
                            }
                            $("#appendLZTable").empty().append(html);

                            boundAppendEvent(data);
                            //空白tr补齐表格
                            if ($("#appendLZTable tbody tr").length < 11) {
                                html = '';
                                var count = 11 - $("#appendLZTable tbody tr").length;
                                var columns = $("#appendLZTable tbody tr:first-child th").length;
                                for (var m = 0; m < count; m++) {
                                    html += '<tr>';
                                    for (var n = 0; n < columns; n++) {
                                        html += "<td>&nbsp</td>";
                                    }
                                    html += "</tr>";
                                }
                                $("#appendLZTable tbody").append(html);
                            }
                        } else {
                            var q = 0;
                            var cur = 1;
                            var total = Math.ceil(count / 10);
                            $("#appendPage").css("display", 'block');
                            for (var i in use) {
                                html += '<tr>';
                                for (var j in use[i]) {
                                    html += '<td>' + use[i][j] + '</td>';
                                }
                                html += '<td><span class="dc">调出</span><span class="tx">退休</span></td>';
                                html += '</tr>'
                                q += 1;
                                if (q > 9) {
                                    break
                                }
                            }
                            $("#appendLZTable").empty().append(html);
                            boundAppendEvent(data);
                            $("#appendPage .cur").text(cur);
                            $("#appendPage .total").text(total);
                            $("#appendPage .next").off('click').on('click', function () {
                                if (cur < total) {
                                    var j = 0;
                                    var html = '<tr><th>工资号</th><th>档案号</th><th>姓名</th><th>部门</th><th>身份证号</th><th>操作</th></tr>';
                                    for (var i in use) {
                                        if (j > 10 * cur - 1 && j < 10 * (cur + 1) && i) {
                                            j++;
                                            html += '<tr>';
                                            for (var m in use[i]) {
                                                html += '<td>' + use[i][m] + '</td>';
                                            }
                                            html += '<td><span class="dc">调出</span><span class="tx">退休</span></td>';
                                            html += '</tr>'
                                        } else {
                                            j++;
                                        }
                                    }
                                    $("#appendLZTable").empty().append(html);
                                    boundAppendEvent(data);
                                    //空白tr补齐表格
                                    if ($("#appendLZTable tbody tr").length < 11) {
                                        html = '';
                                        var count = 11 - $("#appendLZTable tbody tr").length;
                                        var columns = $("#appendLZTable tbody tr:first-child th").length;
                                        for (var m = 0; m < count; m++) {
                                            html += '<tr>';
                                            for (var n = 0; n < columns; n++) {
                                                html += "<td>&nbsp</td>";
                                            }
                                            html += "</tr>";
                                        }
                                        $("#appendLZTable tbody").append(html);
                                    }
                                    cur += 1;
                                    $("#appendPage .cur").text(cur);
                                }

                            })
                            $("#appendPage .prev").off('click').on('click', function () {
                                if (cur > 1) {
                                    var j = 0;
                                    var html = '<tr><th>工资号</th><th>档案号</th><th>姓名</th><th>部门</th><th>身份证号</th><th>操作</th></tr>';
                                    for (var i in use) {
                                        if (j > 10 * (cur - 2) - 1 && j < 10 * (cur - 1) && i) {
                                            j++;
                                            html += '<tr>';
                                            for (var m in use[i]) {
                                                html += '<td>' + use[i][m] + '</td>';
                                            }
                                            html += '<td><span class="dc">调出</span><span class="tx">退休</span></td>';
                                            html += '</tr>'
                                        } else {
                                            j++;
                                        }
                                    }
                                    $("#appendLZTable").empty().append(html);
                                    boundAppendEvent(data);
                                    cur -= 1;
                                    $("#appendPage .cur").text(cur);
                                }
                            })
                        }
                    }
                    else {
                        $(".quitContent").empty().text('暂无待办信息');
                    }
                }
            })
        })
        $('a[href="#tsContent"]').on('shown', function (e) {
            $("#appendPage").css('display','none')
            $.ajax({
                url: "../../../ways.php",
                type: "POST",
                timeout: 8000,
                //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                data: {
                    funcName: 'select',
                    where: ' where type =\''+csData['czlb-levelup2']['nr2']+'\'',
                    serverName: '10.101.62.73',
                    uid: 'sa',
                    pwd: '2huj15h1',
                    Database: 'JSZGL',
                    tableName: ' dbsx ',
                    column: ' *',
                    order: ' order by payId'
                },
                dataType: 'json',
                success: function (data) {
                    if (data['success'] === 1) {
                        $('#appendContainer .levelUpTableContent').css('display','block')
                        $("#appendContainer .uploadExcelContent").css('display','none')
                        $('.buttonBanner .float:eq(0)').css({'background':'inherit','color':'inherit','fontWeight':'inherit'})
                        $('.buttonBanner .float:eq(1)').css({'background':'green','color':'white','fontWeight':'bold'})
                        $("#appendPage").css('visibility','visible')
                        delete data['success'];
                        var count = data['count'];
                        delete data['count'];
                        var html = '<tr><th>工资号</th><th>档案号</th><th>姓名</th><th>部门</th><th>身份证号</th><th>操作类别</th><th>批次</th></tr>';

                        var use = {};
                        use = $.extend(true,use,data);
                        for(var u in use){
                            delete use[u]['phone']
                            delete use[u]['sjDate']
                            delete use[u]['sjDriveCode']
                            delete use[u]['sjRemark']
                            delete use[u]['sjDrive']
                            delete use[u]['sex']
                            delete use[u]['birthDate']
                            delete use[u]['txrq']
                        }
                        if (count < 11) {
                            for (var i in use) {
                                html += '<tr>';
                                for (var j in use[i]) {
                                    html += '<td>' + use[i][j] + '</td>';
                                }
                                html += '</tr>'
                            }
                            $("#appendTSTable").empty().append(html);

                            boundAppendEvent(data);
                            //空白tr补齐表格
                            if ($("#appendTSTable tbody tr").length < 11) {
                                html = '';
                                var count = 11 - $("#appendTSTable tbody tr").length;
                                var columns = $("#appendTSTable tbody tr:first-child th").length;
                                for (var m = 0; m < count; m++) {
                                    html += '<tr>';
                                    for (var n = 0; n < columns; n++) {
                                        html += "<td>&nbsp</td>";
                                    }
                                    html += "</tr>";
                                }
                                $("#appendTSTable tbody").append(html);
                            }
                        } else {
                            var q = 0;
                            var cur = 1;
                            var total = Math.ceil(count / 10);
                            $("#appendPage").css("display", 'block');
                            for (var i in use) {
                                html += '<tr>';
                                for (var j in use[i]) {
                                    html += '<td>' + use[i][j] + '</td>';
                                }
                                html += '</tr>'
                                q += 1;
                                if (q > 9) {
                                    break
                                }
                            }
                            $("#appendTSTable").empty().append(html);
                            boundAppendEvent(data);
                            $("#appendPage .cur").text(cur);
                            $("#appendPage .total").text(total);
                            $("#appendPage .next").off('click').on('click', function () {
                                if (cur < total) {
                                    var j = 0;
                                    var html = '<tr><th>工资号</th><th>档案号</th><th>姓名</th><th>部门</th><th>身份证号</th><th>操作类别</th><th>批次</th></tr>';
                                    for (var i in use) {
                                        if (j > 10 * cur - 1 && j < 10 * (cur + 1) && i) {
                                            j++;
                                            html += '<tr>';
                                            for (var m in use[i]) {
                                                html += '<td>' + use[i][m] + '</td>';
                                            }
                                            html += '</tr>'
                                        } else {
                                            j++;
                                        }
                                    }
                                    $("#appendTSTable").empty().append(html);
                                    boundAppendEvent(data);
                                    //空白tr补齐表格
                                    if ($("#appendTSTable tbody tr").length < 11) {
                                        html = '';
                                        var count = 11 - $("#appendTSTable tbody tr").length;
                                        var columns = $("#appendTSTable tbody tr:first-child th").length;
                                        for (var m = 0; m < count; m++) {
                                            html += '<tr>';
                                            for (var n = 0; n < columns; n++) {
                                                html += "<td>&nbsp</td>";
                                            }
                                            html += "</tr>";
                                        }
                                        $("#appendTSTable tbody").append(html);
                                    }
                                    cur += 1;
                                    $("#appendPage .cur").text(cur);
                                }

                            })
                            $("#appendPage .prev").off('click').on('click', function () {
                                if (cur > 1) {
                                    var j = 0;
                                    var html = '<tr><th>工资号</th><th>档案号</th><th>姓名</th><th>部门</th><th>身份证号</th><th>操作类别</th><th>批次</th></tr>';
                                    for (var i in use) {
                                        if (j > 10 * (cur - 2) - 1 && j < 10 * (cur - 1) && i) {
                                            j++;
                                            html += '<tr>';
                                            for (var m in use[i]) {
                                                html += '<td>' + use[i][m] + '</td>';
                                            }
                                            html += '</tr>'
                                        } else {
                                            j++;
                                        }
                                    }
                                    $("#appendTSTable").empty().append(html);
                                    boundAppendEvent(data);
                                    cur -= 1;
                                    $("#appendPage .cur").text(cur);
                                }
                            })
                        }
                    }
                    else {
                        $("#appendContainer .uploadExcelContent").css('display','block')
                        $('#appendContainer .levelUpTableContent').css('display','none')
                        $('.buttonBanner .float:eq(0)').css({'background':'green','color':'white','fontWeight':'bold'})
                        $('.buttonBanner .float:eq(1)').css({'background':'inherit','color':'inherit','fontWeight':'inherit'})
                        $("#appendPage").css('visibility','hidden')
                        boundAppendEvent(data)
                    }
                }
            })
        })
        $('a[href="#drContent"]').on('shown', function (e) {
            $("#appendPage").css('display','none')
            $(this).find(".redPoint").css("display",'none');
            $.ajax({
                url: "../../../ways.php",
                type: "POST",
                timeout: 8000,
                //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                data: {
                    funcName: 'select',
                    where: ' where type =\''+csData['czlb-dr']['nr3']+'\'',
                    serverName: '10.101.62.73',
                    uid: 'sa',
                    pwd: '2huj15h1',
                    Database: 'JSZGL',
                    tableName: ' dbsx ',
                    column: ' *',
                    order: ' order by payId'
                },
                dataType: 'json',
                success: function (data) {
                    if (data['success'] === 1) {
                        delete data['success'];
                        var count = data['count'];
                        delete data['count'];
                        var html = '<tr><th>工资号</th><th>档案号</th><th>姓名</th><th>部门</th><th>身份证号</th><th>电话号码</th><th>操作</th></tr>';

                        var use = {};
                        use = $.extend(true,use,data);
                        for(var u in use){
                            delete use[u]['type']
                            delete use[u]['sjDate']
                            delete use[u]['sjDriveCode']
                            delete use[u]['sjRemark']
                            delete use[u]['sjDrive']
                            delete use[u]['sex']
                            delete use[u]['birthDate']
                            delete use[u]['txrq']
                        }
                        if (count < 11) {
                            for (var i in use) {
                                html += '<tr>';
                                for (var j in use[i]) {
                                    html += '<td>' + use[i][j] + '</td>';
                                }
                                html += '<td><a href="#drInfo" class="dr" data-toggle="modal" role="button">调入</a><span class="tz">短信通知</span></td>';
                                html += '</tr>'
                            }
                            $("#appendDRTable").empty().append(html);
                            boundAppendEvent(data);
                            //空白tr补齐表格
                            if ($("#appendDRTable tbody tr").length < 11) {
                                html = '';
                                var count = 11 - $("#appendDRTable tbody tr").length;
                                var columns = $("#appendDRTable tbody tr:first-child th").length;
                                for (var m = 0; m < count; m++) {
                                    html += '<tr>';
                                    for (var n = 0; n < columns; n++) {
                                        html += "<td>&nbsp</td>";
                                    }
                                    html += "</tr>";
                                }
                                $("#appendDRTable tbody").append(html);
                            }
                        } else {
                            var q = 0;
                            var cur = 1;
                            var total = Math.ceil(count / 10);
                            $("#appendPage").css("display", 'block');
                            for (var i in use) {
                                html += '<tr>';
                                for (var j in use[i]) {
                                    html += '<td>' + use[i][j] + '</td>';
                                }
                                html += '<td><a href="#drInfo" class="dr" data-toggle="modal" role="button">调入</a><span class="tz">短信通知</span></td>';
                                html += '</tr>'
                                q += 1;
                                if (q > 9) {
                                    break
                                }
                            }
                            $("#appendDRTable").empty().append(html);
                            boundAppendEvent(data);
                            $("#appendPage .cur").text(cur);
                            $("#appendPage .total").text(total);
                            $("#appendPage .next").off('click').on('click', function () {
                                if (cur < total) {
                                    var j = 0;
                                    var html = '<tr><th>工资号</th><th>档案号</th><th>姓名</th><th>部门</th><th>身份证号</th><th>电话号码</th><th>操作</th></tr>';
                                    for (var i in use) {
                                        if (j > 10 * cur - 1 && j < 10 * (cur + 1) && i) {
                                            j++;
                                            html += '<tr>';
                                            for (var m in use[i]) {
                                                html += '<td>' + use[i][m] + '</td>';
                                            }
                                            html += '<td><a href="#drInfo" class="dr" data-toggle="modal" role="button">调入</a><span class="tz">短信通知</span></td>';
                                            html += '</tr>'
                                        } else {
                                            j++;
                                        }
                                    }
                                    $("#appendDRTable").empty().append(html);
                                    boundAppendEvent(data);
                                    //空白tr补齐表格
                                    if ($("#appendDRTable tbody tr").length < 11) {
                                        html = '';
                                        var count = 11 - $("#appendDRTable tbody tr").length;
                                        var columns = $("#appendDRTable tbody tr:first-child th").length;
                                        for (var m = 0; m < count; m++) {
                                            html += '<tr>';
                                            for (var n = 0; n < columns; n++) {
                                                html += "<td>&nbsp</td>";
                                            }
                                            html += "</tr>";
                                        }
                                        $("#appendDRTable tbody").append(html);
                                    }
                                    cur += 1;
                                    $("#appendPage .cur").text(cur);
                                }

                            })
                            $("#appendPage .prev").off('click').on('click', function () {
                                if (cur > 1) {
                                    var j = 0;
                                    var html = '<tr><th>工资号</th><th>档案号</th><th>姓名</th><th>部门</th><th>身份证号</th><th>电话号码</th><th>操作</th></tr>';
                                    for (var i in use) {
                                        if (j > 10 * (cur - 2) - 1 && j < 10 * (cur - 1) && i) {
                                            j++;
                                            html += '<tr>';
                                            for (var m in use[i]) {
                                                html += '<td>' + use[i][m] + '</td>';
                                            }
                                            html += '<td><a href="#drInfo" class="dr" data-toggle="modal" role="button">调入</a><span class="tz">短信通知</span></td>';
                                            html += '</tr>'
                                        } else {
                                            j++;
                                        }
                                    }
                                    $("#appendDRTable").empty().append(html);
                                    boundAppendEvent(data);
                                    cur -= 1;
                                    $("#appendPage .cur").text(cur);
                                }
                            })
                        }
                    }
                    else {
                        $(".appendContent p").empty().append('暂无调入信息');
                    }
                }
            })
        })
    }
    appendToolTip()
    function appendToolTip(){
        //初始化tooltips
        $(".question").tooltip({
            'placement':'bottom'
        })
    }
    function appendModal(){
        $('#drInfo').modal({
            'show':false
        })
        $('#selectPC').modal({
            'show':false
        })
        $("#inputArchivesId").modal({
            'show':false,
            'backdrop':'static',
            'keyboard':false
        })
    }

    //添加汇总信息
    function appendSummary(csData) {
        var power = sessionGet('power');
        if (power === 'V') {
            var html = '';
            var table1 = '铁路机车车辆驾驶人员资格考试合格人员汇总表';
            var table2 = '铁路机车车辆驾驶证（有效期满）换证申请汇总表';
            var table3 = '铁路机车车辆驾驶证（非有效期满）换证申请汇总表';
            var table4 = '铁路机车车辆驾驶证补证申请汇总表';
            var table5 = '（      ）年度铁路机车车辆驾驶人员聘用情况统计表';
            var table6 = '（      ）年度铁路机车车辆驾驶人员聘用情况汇总表';
            var summaryArr = ['--请选择--', table1, table2, table3, table4, table5, table6];
            for (var i = 0; i < summaryArr.length; i++) {
                html += '<option>' + summaryArr[i] + '</option>'
            }
            $("#summaryContainer .summaryBanner #summarySelect").append(html)
            $("#summarySelect").off('change').on('change', function () {
                if ($(this).val() === '--请选择--') {
                    $("#summaryContainer .summaryBanner .htmlToXls").css('display', 'none')
                } else {
                    $("#summaryContainer .summaryBanner .htmlToXls").css('display', 'block')
                    if ($(this).val() === table2){//有效期满
                        if($('#yearSelect')){
                            $('#yearSelect').remove()
                        }
                        var ajaxTimeOut1 = $.ajax({
                            url: "../../../ways.php",
                            type:"POST",
                            timeout:8000,
                            //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                            data:{funcName:'select',where:' where checkstatus = \''+csData['checkStatus-shtg']['nr2']+'\' AND changeType =\''+csData['czlb-yxqmhz']['nr3']+'\' AND (finishStatus =\''+csData['finishStatus-ffdcj']['nr2']+'\' OR finishStatus =\''+csData['finishStatus-ffdgr']['nr2']+'\')',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                                tableName:' bgxx ',column:' UName,sex,cardId,birthDate,applyDriveCode,driveCode,startDate,deadline,sjRemark,phyTest',order:' order by UName'},
                            dataType:'json',
                            success:function(data){
                                if(data['success'] === 1){
                                    delete data['success'];
                                    var count = data['count'];
                                    delete data['count'];
                                    var company ='郑州局集团公司';
                                    var k =1;
                                    var obj ={}
                                    for(var x in data){
                                        obj.num = k;
                                        k++;
                                        obj.company =company;
                                        data[x] = Object.assign({},obj,data[x]);
                                    }
                                    var _html = '<thead><tr class="title"><td colspan="13">铁路机车车辆驾驶证（有效期满）换证申请汇总表</td></tr><tr class="info"><td colspan="13">(考试中心公章)    审核人：___________ 填报人：___________ 联系电话：___________ 填报日期：        年       月       日</td></tr></thead>'
                                    var html = '<tr><th>序号</th><th>单位</th><th>姓名</th><th>性别</th><th>公民身份号码</th><th>出生日期</th><th>申请准驾<br>类型代码</th><th>原证准驾<br>类型代码</th><th>原证初次<br>领证日期</th><th>原证有效<br>截止日期</th><th>原证批准文号<br>(公告号)</th><th>体检<br>结论</th><th>备注</th></tr>';
                                    if(count<11){
                                        for(var i in data){
                                            for(var j in data[i]){
                                                html += '<td>'+data[i][j]+'</td>';
                                            }
                                            html += '<td>&nbsp</td></tr>'
                                        }
                                        $("#summaryTable").empty().append(_html)
                                        $("#summaryTable").append(html);
                                        //空白tr补齐表格
                                        if($("#summaryTable tbody tr").length<11){
                                            html = '';
                                            var count = 11-$("#summaryTable tbody tr").length;
                                            var columns = $("#summaryTable tbody tr:first-child th").length;
                                            for(var m=0;m<count;m++){
                                                html+='<tr>';
                                                for(var n=0;n<columns;n++){
                                                    html+="<td></td>";
                                                }
                                                html+="</tr>";
                                            }
                                            $("#summaryTable tbody").append(html);
                                        }
                                    }else{
                                        var q =0;
                                        var cur =1;
                                        var total = Math.ceil(count/10);
                                        $("#summaryTable").append(_html)
                                        $("#summaryPage").css("display",'block');
                                        for(var i in data){
                                            for(var j in data[i]){
                                                html += '<td>'+data[i][j]+'</td>';
                                            }
                                            html += '<td>&nbsp</td></tr>';
                                            q+=1;
                                            if(q>9){
                                                break
                                            }
                                        }
                                        $("#summaryTable").empty().append(html);
                                        $("#summaryPage .cur").text(cur);
                                        $("#summaryPage .total").text(total);
                                        $("#summaryPage .next").off('click').on('click',function(){
                                            if(cur<total){
                                                var j =0;
                                                var html = '<tr><th  >序号</th><th  >单位</th><th  >姓名</th><th  >性别</th><th  >公民身份号码</th><th  >出生日期</th><th  >申请准驾<br>类型代码</th><th  >原证准驾<br>类型代码</th><th  >原证初次<br>领证日期</th><th  >原证有效<br>截止日期</th><th  >原证批准文号<br>(公告号)</th><th  >体检<br>结论</th><th  >备注</th></tr>';
                                                for(var i in data){
                                                    if(j>10*cur-1 && j<10*(cur+1) && i ){
                                                        j++;
                                                        for(var m in data[i]){
                                                            html += '<td>'+data[i][m]+'</td>';
                                                        }
                                                        html += '<td>&nbsp</td></tr>'
                                                    }else{
                                                        j++;
                                                    }
                                                }
                                                $("#summaryTable").empty().append(html);
                                                //空白tr补齐表格
                                                if($("#summaryTable tbody tr").length<11){
                                                    html = '';
                                                    var count = 11-$("#summaryTable tbody tr").length;
                                                    var columns = $("#summaryTable tbody tr:first-child th").length;
                                                    for(var m=0;m<count;m++){
                                                        html+='<tr>';
                                                        for(var n=0;n<columns;n++){
                                                            html+="<td></td>";
                                                        }
                                                        html+="</tr>";
                                                    }
                                                    $("#summaryTable tbody").append(html);
                                                }
                                                cur+=1;
                                                $("#summaryPage .cur").text(cur);
                                            }

                                        })
                                        $("#summaryPage .prev").off('click').on('click',function(){
                                            if(cur>1){
                                                var j =0;
                                                var html = '<tr><th  >序号</th><th  >单位</th><th  >姓名</th><th  >性别</th><th  >公民身份号码</th><th  >出生日期</th><th  >申请准驾<br>类型代码</th><th  >原证准驾<br>类型代码</th><th  >原证初次<br>领证日期</th><th  >原证有效<br>截止日期</th><th  >原证批准文号<br>(公告号)</th><th  >体检<br>结论</th><th  >备注</th></tr>';
                                                for(var i in data){
                                                    if(j>10*(cur-2)-1 && j<10*(cur-1) && i ){
                                                        j++;
                                                        for(var m in data[i]){
                                                            html += '<td>'+data[i][m]+'</td>';
                                                        }
                                                        html += '<td>&nbsp</td></tr>'
                                                    }else{
                                                        j++;
                                                    }
                                                }
                                                if(cur===2){
                                                    $("#summaryTable").empty().append(_html);
                                                    $("#summaryTable").append(html);
                                                }else{
                                                    $("#summaryTable").empty().append(html);
                                                }
                                                cur-=1;
                                                $("#summaryPage .cur").text(cur);
                                            }

                                        })
                                    }
                                    $(".summaryBanner .htmlToXls").off('click').on('click',function(){
                                        console.log(data)
                                        if(confirm('是否要生成EXCEL表格')){
                                            var filterArray=['num','company','UName','sex','cardId','birthDate','applyDriveCode','driveCode','startDate','deadline','sjRemark','phyTest'];
                                            var headerArray=['序号','单位','姓名','性别','公民身份号码','出生日期','申请准驾\u000d类型代码','原证准驾\u000d类型代码','原证初次\u000d领证日期','原证有效\u000d截止日期','原证批准文号\u000d(公文号)','体检\u000d结论','备注']
                                            htmlToXls(data,table2,filterArray,headerArray)
                                        }
                                    })
                                }else{
                                    alert('暂无有效期满汇总信息')
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
                    }else if($(this).val() === table3){//非有效期满
                        if($('#yearSelect')){
                            $('#yearSelect').remove()
                        }
                        var ajaxTimeOut2 = $.ajax({
                            url: "../../../ways.php",
                            type:"POST",
                            timeout:8000,
                            //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                            data:{funcName:'select',where:' where checkstatus = \''+csData['checkStatus-shtg']['nr2']+'\' AND changeType =\''+csData['czlb-fyxqmhz']['nr3']+'\' AND (finishStatus =\''+csData['finishStatus-ffdcj']['nr2']+'\' OR finishStatus =\''+csData['finishStatus-ffdgr']['nr2']+'\')',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                                tableName:' bgxx ',column:' UName,sex,cardId,birthDate,applyDriveCode,driveCode,startDate,sjRemark,phyTest,changeReason',order:' order by UName'},
                            dataType:'json',
                            success:function(data){
                                if(data['success'] === 1){
                                    delete data['success'];
                                    var count = data['count'];
                                    delete data['count'];
                                    var company ='郑州局集团公司';
                                    var k =1;
                                    var obj ={}
                                    for(var x in data){
                                        obj.num = k;
                                        k++;
                                        obj.company =company;
                                        data[x] = Object.assign({},obj,data[x]);
                                    }
                                    var _html = '<thead><tr class="title"><td colspan="13">铁路机车车辆驾驶证（非有效期满）换证申请汇总表</td></tr><tr class="info"><td colspan="13">(考试中心公章)    审核人：___________ 填报人：___________ 联系电话：___________ 填报日期：        年       月       日</td></tr></thead>'
                                    var html = '<tr><th>序号</th><th>单位</th><th>姓名</th><th>性别</th><th>公民身份号码</th><th>出生日期</th><th>申请准驾<br>类型代码</th><th>原证准驾<br>类型代码</th><th>原证初次<br>领证日期</th><th>原证批准文号<br>(公告号)</th><th>体检<br>结论</th><th>换证<br>原因</th><th>备注</th></tr>';
                                    if(count<11){
                                        for(var i in data){
                                            for(var j in data[i]){
                                                html += '<td>'+data[i][j]+'</td>';
                                            }
                                            html += '<td>&nbsp</td></tr>'
                                        }
                                        $("#summaryTable").empty().append(_html)
                                        $("#summaryTable").append(html);
                                        //空白tr补齐表格
                                        if($("#summaryTable tbody tr").length<11){
                                            html = '';
                                            var count = 11-$("#summaryTable tbody tr").length;
                                            var columns = $("#summaryTable tbody tr:first-child th").length;
                                            for(var m=0;m<count;m++){
                                                html+='<tr>';
                                                for(var n=0;n<columns;n++){
                                                    html+="<td></td>";
                                                }
                                                html+="</tr>";
                                            }
                                            $("#summaryTable tbody").append(html);
                                        }
                                    }else{
                                        var q =0;
                                        var cur =1;
                                        var total = Math.ceil(count/10);
                                        $("#summaryPage").css("display",'block');
                                        for(var i in data){
                                            for(var j in data[i]){
                                                html += '<td>'+data[i][j]+'</td>';
                                            }
                                            html += '<td>&nbsp</td></tr>';
                                            q+=1;
                                            if(q>9){
                                                break
                                            }
                                        }
                                        $("#summaryTable").empty().append(_html)
                                        $("#summaryTable").append(html);
                                        $("#summaryPage .cur").text(cur);
                                        $("#summaryPage .total").text(total);
                                        $("#summaryPage .next").off('click').on('click',function(){
                                            if(cur<total){
                                                var j =0;
                                                var html = '<tr><th>序号</th><th>单位</th><th>姓名</th><th>性别</th><th>公民身份号码</th><th>出生日期</th><th>申请准驾<br>类型代码</th><th>原证准驾<br>类型代码</th><th>原证初次<br>领证日期</th><th>原证批准文号<br>(公告号)</th><th>体检<br>结论</th><th>换证<br>原因</th><th>备注</th></tr>';
                                                for(var i in data){
                                                    if(j>10*cur-1 && j<10*(cur+1) && i ){
                                                        j++;
                                                        for(var m in data[i]){
                                                            html += '<td>'+data[i][m]+'</td>';
                                                        }
                                                        html += '<td>&nbsp</td></tr>'
                                                    }else{
                                                        j++;
                                                    }
                                                }
                                                $("#summaryTable").empty().append(html);
                                                //空白tr补齐表格
                                                if($("#summaryTable tbody tr").length<11){
                                                    html = '';
                                                    var count = 11-$("#summaryTable tbody tr").length;
                                                    var columns = $("#summaryTable tbody tr:first-child th").length;
                                                    for(var m=0;m<count;m++){
                                                        html+='<tr>';
                                                        for(var n=0;n<columns;n++){
                                                            html+="<td></td>";
                                                        }
                                                        html+="</tr>";
                                                    }
                                                    $("#summaryTable tbody").append(html);
                                                }
                                                cur+=1;
                                                $("#summaryPage .cur").text(cur);
                                            }

                                        })
                                        $("#summaryPage .prev").off('click').on('click',function(){
                                            if(cur>1){
                                                var j =0;
                                                var html = '<tr><th>序号</th><th>单位</th><th>姓名</th><th>性别</th><th>公民身份号码</th><th>出生日期</th><th>申请准驾<br>类型代码</th><th>原证准驾<br>类型代码</th><th>原证初次<br>领证日期</th><th>原证批准文号<br>(公告号)</th><th>体检<br>结论</th><th>换证<br>原因</th><th>备注</th></tr>';
                                                for(var i in data){
                                                    if(j>10*(cur-2)-1 && j<10*(cur-1) && i ){
                                                        j++;
                                                        for(var m in data[i]){
                                                            html += '<td>'+data[i][m]+'</td>';
                                                        }
                                                        html += '<td>&nbsp</td></tr>'
                                                    }else{
                                                        j++;
                                                    }
                                                }
                                                if(cur===2){
                                                    $("#summaryTable").empty().append(_html);
                                                    $("#summaryTable").append(html);
                                                }else{
                                                    $("#summaryTable").empty().append(html);
                                                }
                                                cur-=1;
                                                $("#summaryPage .cur").text(cur);
                                            }

                                        })
                                    }
                                    $(".summaryBanner .htmlToXls").off('click').on('click',function(){
                                        if(confirm('是否要生成EXCEL表格')){
                                            var filterArray=['num','company','UName','sex','cardId','birthDate','applyDriveCode','driveCode','startDate','sjRemark','phyTest','changeReason'];
                                            var headerArray=['序号','单位','姓名','性别','公民身份号码','出生日期','申请准驾\u000d类型代码','原证准驾\u000d类型代码','原证初次\u000d领证日期','原证批准文号\u000d(公文号)','体检\u000d结论','换证\u000d原因','备注']
                                            htmlToXls(data,table3,filterArray,headerArray)
                                        }
                                    })
                                }else{
                                    alert('暂无非有效期满汇总信息')
                                }
                            },
                            beforeSend:function(){
                                loadingPicOpen();
                                testSession(userSessionInfo);
                            },
                            complete: function (XMLHttpRequest,status) {
                                loadingPicClose();
                                if(status === 'timeout') {
                                    ajaxTimeOut2.abort();    // 超时后中断请求
                                    alert('网络超时，请检查网络连接');
                                }
                            }
                        })
                    }else if($(this).val() === table4){//补证
                        if($('#yearSelect')){
                            $('#yearSelect').remove()
                        }
                        var ajaxTimeOut3 = $.ajax({
                            url: "../../../ways.php",
                            type:"POST",
                            timeout:8000,
                            //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                            data:{funcName:'select',where:' where checkstatus = \''+csData['checkStatus-shtg']['nr2']+'\' AND changeType =\''+csData['czlb-bz']['nr3']+'\' AND (finishStatus =\''+csData['finishStatus-ffdcj']['nr2']+'\' OR finishStatus =\''+csData['finishStatus-ffdgr']['nr2']+'\')',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                                tableName:' bgxx ',column:' UName,sex,cardId,birthDate,applyDriveCode,driveCode,startDate,deadline,sjRemark',order:' order by UName'},
                            dataType:'json',
                            success:function(data){
                                if(data['success'] === 1){
                                    delete data['success'];
                                    var count = data['count'];
                                    delete data['count'];
                                    var company ='郑州局集团公司';
                                    var k =1;
                                    var obj ={}
                                    for(var x in data){
                                        obj.num = k;
                                        k++;
                                        obj.company =company;
                                        data[x] = Object.assign({},obj,data[x]);
                                    }
                                    var _html = '<thead><tr class="title"><td colspan="12">铁路机车车辆驾驶证补证申请汇总表</td></tr><tr class="info"><td colspan="12">(考试中心公章)    审核人：___________ 填报人：___________ 联系电话：___________ 填报日期：        年       月       日</td></tr></thead>'
                                    var html = '<tr><th>序号</th><th>单位</th><th>姓名</th><th>性别</th><th>公民身份号码</th><th>出生日期</th><th>申请准驾<br>类型代码</th><th>原证准驾<br>类型代码</th><th>原证初次<br>领证日期</th><th>原证有效<br>截止日期</th><th>原证批准文号<br>(公告号)</th><th>备注</th></tr>';
                                    if(count<11){
                                        for(var i in data){
                                            for(var j in data[i]){
                                                html += '<td>'+data[i][j]+'</td>';
                                            }
                                            html += '<td>&nbsp</td></tr>'
                                        }
                                        $("#summaryTable").empty().append(_html)
                                        $("#summaryTable").append(html);
                                        //空白tr补齐表格
                                        if($("#summaryTable tbody tr").length<11){
                                            html = '';
                                            var count = 11-$("#summaryTable tbody tr").length;
                                            var columns = $("#summaryTable tbody tr:first-child th").length;
                                            for(var m=0;m<count;m++){
                                                html+='<tr>';
                                                for(var n=0;n<columns;n++){
                                                    html+="<td></td>";
                                                }
                                                html+="</tr>";
                                            }
                                            $("#summaryTable tbody").append(html);
                                        }
                                    }else{
                                        var q =0;
                                        var cur =1;
                                        var total = Math.ceil(count/10);
                                        $("#summaryPage").css("display",'block');
                                        for(var i in data){
                                            for(var j in data[i]){
                                                html += '<td>'+data[i][j]+'</td>';
                                            }
                                            html += '<td>&nbsp</td></tr>';
                                            q+=1;
                                            if(q>9){
                                                break
                                            }
                                        }
                                        $("#summaryTable").empty().append(_html)
                                        $("#summaryTable").append(html);
                                        $("#summaryPage .cur").text(cur);
                                        $("#summaryPage .total").text(total);
                                        $("#summaryPage .next").off('click').on('click',function(){
                                            if(cur<total){
                                                var j =0;
                                                var html = '<tr><th>序号</th><th>单位</th><th>姓名</th><th>性别</th><th>公民身份号码</th><th>出生日期</th><th>申请准驾<br>类型代码</th><th>原证准驾<br>类型代码</th><th>原证初次<br>领证日期</th><th>原证有效<br>截止日期</th><th>原证批准文号<br>(公告号)</th><th>备注</th></tr>';
                                                for(var i in data){
                                                    if(j>10*cur-1 && j<10*(cur+1) && i ){
                                                        j++;
                                                        for(var m in data[i]){
                                                            html += '<td>'+data[i][m]+'</td>';
                                                        }
                                                        html += '<td>&nbsp</td></tr>'
                                                    }else{
                                                        j++;
                                                    }
                                                }
                                                $("#summaryTable").empty().append(html);
                                                //空白tr补齐表格
                                                if($("#summaryTable tbody tr").length<11){
                                                    html = '';
                                                    var count = 11-$("#summaryTable tbody tr").length;
                                                    var columns = $("#summaryTable tbody tr:first-child th").length;
                                                    for(var m=0;m<count;m++){
                                                        html+='<tr>';
                                                        for(var n=0;n<columns;n++){
                                                            html+="<td></td>";
                                                        }
                                                        html+="</tr>";
                                                    }
                                                    $("#summaryTable tbody").append(html);
                                                }
                                                cur+=1;
                                                $("#summaryPage .cur").text(cur);
                                            }

                                        })
                                        $("#summaryPage .prev").off('click').on('click',function(){
                                            if(cur>1){
                                                var j =0;
                                                var html = '<tr><th>序号</th><th>单位</th><th>姓名</th><th>性别</th><th>公民身份号码</th><th>出生日期</th><th>申请准驾<br>类型代码</th><th>原证准驾<br>类型代码</th><th>原证初次<br>领证日期</th><th>原证有效<br>截止日期</th><th>原证批准文号<br>(公告号)</th><th>备注</th></tr>';
                                                for(var i in data){
                                                    if(j>10*(cur-2)-1 && j<10*(cur-1) && i ){
                                                        j++;
                                                        for(var m in data[i]){
                                                            html += '<td>'+data[i][m]+'</td>';
                                                        }
                                                        html += '<td>&nbsp</td></tr>'
                                                    }else{
                                                        j++;
                                                    }
                                                }
                                                if(cur===2){
                                                    $("#summaryTable").empty().append(_html);
                                                    $("#summaryTable").append(html);
                                                }else{
                                                    $("#summaryTable").empty().append(html);
                                                }
                                                cur-=1;
                                                $("#summaryPage .cur").text(cur);
                                            }

                                        })
                                    }
                                    $(".summaryBanner .htmlToXls").off('click').on('click',function(){
                                        if(confirm('是否要生成EXCEL表格')){
                                            var filterArray=['num','company','UName','sex','cardId','birthDate','applyDriveCode','driveCode','startDate','deadline','sjRemark'];
                                            var headerArray=['序号','单位','姓名','性别','公民身份号码','出生日期','申请准驾\u000d类型代码','原证准驾\u000d类型代码','原证初次\u000d领证日期','原证有效\u000d截止日期','原证批准文号\u000d(公文号)','备注']
                                            htmlToXls(data,table4,filterArray,headerArray)
                                        }
                                    })
                                }else{
                                    alert('暂无补证汇总信息')
                                }
                            },
                            beforeSend:function(){
                                loadingPicOpen();
                                testSession(userSessionInfo);
                            },
                            complete: function (XMLHttpRequest,status) {
                                loadingPicClose();
                                if(status === 'timeout') {
                                    ajaxTimeOut3.abort();    // 超时后中断请求
                                    alert('网络超时，请检查网络连接');
                                }
                            }
                        })
                    }
                    else if($(this).val() === table5){//聘用统计表
                        var date = new Date();
                        var yearArr = ['--请选择年份--', date.getFullYear()-1,date.getFullYear()];
                        var _html ='<select id=\'yearSelect\'>';
                        for (var i = 0; i < yearArr.length; i++) {
                            _html += '<option>' + yearArr[i] + '</option>'
                        }
                        _html +='</select>'
                        if($('#yearSelect')){
                            $('#yearSelect').remove()
                        }
                        $("#summaryContainer .summaryBanner").append(_html)
                        $('#summaryContainer .summaryBanner #yearSelect').off('change').on('change',function(){
                            var year = $(this).val()
                            var ajaxTimeOut4 = $.ajax({
                                url: "../../../ways.php",
                                type:"POST",
                                timeout:8000,
                                //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                                data:{funcName:'select',where:' where year =\''+($(this).val()-1)+'\'',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                                    tableName:' tjxx ',column:' driveCode,yearlyAmount',order:' '},
                                dataType:'json',
                                success:function(lastYearData){
                                    if(lastYearData['success'] === 1){
                                        $.ajax({
                                            url: "../../../ways.php",
                                            type: "POST",
                                            timeout: 8000,
                                            //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                                            data: {
                                                funcName: 'select',
                                                where: ' where year =\'' + year + '\'',
                                                serverName: '10.101.62.73',
                                                uid: 'sa',
                                                pwd: '2huj15h1',
                                                Database: 'JSZGL',
                                                tableName: ' tjxx ',
                                                column: ' *',
                                                order: ' '
                                            },
                                            dataType: 'json',
                                            success: function (data) {
                                                delete lastYearData.success
                                                delete lastYearData.count
                                                delete data.success
                                                delete data.count
                                                var _html = '<thead><tr class="title"><td colspan="18">('+year+')年度铁路机车车辆驾驶人员聘用情况统计表</td></tr><tr class="info"><td colspan="18">企业：___________ 审核人：___________ 填报人：___________ 联系电话：___________ 填报日期：        年       月       日</td></tr></thead>'
                                                var th = '<tr><th rowspan="3">准驾类型代码</th><th rowspan="3">上年度总数</th><th rowspan="3">统计年度总数</th><th rowspan="3">年度比较</th><th colspan="5">统计年度增加情况</th><th colspan="9">统计年度减少情况</th></tr>'
                                                th+='<tr><th rowspan="2">小计</th><th rowspan="2">考试合格</th><th rowspan="2">调入</th><th rowspan="2">降低准驾机型</th><th rowspan="2">其他</th><th rowspan="2">小计</th><th rowspan="2">撤销</th><th rowspan="2">注销</th><th rowspan="2">退休</th><th rowspan="2">死亡</th><th rowspan="2">调出</th><th rowspan="2">增驾</th><th rowspan="2">降低准驾机型</th><th rowspan="2">其他</th></tr>'
                                                $("#summaryTable").empty().append(_html).append(th);
                                                var html=''
                                                var obj={}
                                                for(var i in lastYearData){
                                                    for(var j in data){
                                                        if(lastYearData[i]['driveCode'] === data[j]['driveCode']){
                                                            obj.driveCode = lastYearData[i]['driveCode'];
                                                            obj.lastYearAmount = lastYearData[i]['yearlyAmount'];
                                                            obj.yearAmount = data[j]['yearlyAmount'];
                                                            obj.sub = data[j]['yearlyAmount']-lastYearData[i]['yearlyAmount'];
                                                            data[j] = Object.assign({},obj,data[j])
                                                            delete data[j]['year']
                                                            delete data[j]['yearlyAmount']
                                                        }
                                                    }
                                                }
                                                var newData = {};
                                                newData.J1 = data['row1'];
                                                newData.J2 = data['row2'];
                                                newData.J3 = data['row3'];
                                                var crh = {};
                                                crh['driveCode'] = 'CRH系列';
                                                crh.lastYearAmount = parseInt(newData.J1['lastYearAmount'])+ parseInt(newData.J2['lastYearAmount'])+ parseInt(newData.J3['lastYearAmount']);
                                                crh.yearAmount = parseInt(newData.J1['yearAmount'])+ parseInt(newData.J2['yearAmount'])+ parseInt(newData.J3['yearAmount']);
                                                crh.sub = parseInt(newData.J1['sub'])+ parseInt(newData.J2['sub'])+ parseInt(newData.J3['sub']);
                                                crh.increaseAmount = parseInt(newData.J1['increaseAmount'])+ parseInt(newData.J2['increaseAmount'])+ parseInt(newData.J3['increaseAmount']);
                                                crh.kshg = parseInt(newData.J1['kshg'])+ parseInt(newData.J2['kshg'])+ parseInt(newData.J3['kshg']);
                                                crh.dr = parseInt(newData.J1['dr'])+ parseInt(newData.J2['dr'])+ parseInt(newData.J3['dr']);
                                                crh.jdzjjxIncrease = parseInt(newData.J1['jdzjjxIncrease'])+ parseInt(newData.J2['jdzjjxIncrease'])+ parseInt(newData.J3['jdzjjxIncrease']);
                                                crh.otherIncrease = parseInt(newData.J1['otherIncrease'])+ parseInt(newData.J2['otherIncrease'])+ parseInt(newData.J3['otherIncrease']);
                                                crh.decreaseAmount = parseInt(newData.J1['decreaseAmount'])+ parseInt(newData.J2['decreaseAmount'])+ parseInt(newData.J3['decreaseAmount']);
                                                crh.cx = parseInt(newData.J1['cx'])+ parseInt(newData.J2['cx'])+ parseInt(newData.J3['cx']);
                                                crh.zx = parseInt(newData.J1['zx'])+ parseInt(newData.J2['zx'])+ parseInt(newData.J3['zx']);
                                                crh.tx = parseInt(newData.J1['tx'])+ parseInt(newData.J2['tx'])+ parseInt(newData.J3['tx']);
                                                crh.sw = parseInt(newData.J1['sw'])+ parseInt(newData.J2['sw'])+ parseInt(newData.J3['sw']);
                                                crh.dc = parseInt(newData.J1['dc'])+ parseInt(newData.J2['dc'])+ parseInt(newData.J3['dc']);
                                                crh.zj = parseInt(newData.J1['zj'])+ parseInt(newData.J2['zj'])+ parseInt(newData.J3['zj']);
                                                crh.jdzjjxDecrease = parseInt(newData.J1['jdzjjxDecrease'])+ parseInt(newData.J2['jdzjjxDecrease'])+ parseInt(newData.J3['jdzjjxDecrease']);
                                                crh.otherDecrease = parseInt(newData.J1['otherDecrease'])+ parseInt(newData.J2['otherDecrease'])+ parseInt(newData.J3['otherDecrease']);

                                                newData.crh = crh;
                                                newData.J4 = data['row4'];
                                                newData.A = $.extend(true,{},data['row4']);
                                                newData.A.driveCode = 'A';
                                                newData.J5 = data['row5'];
                                                newData.B = $.extend(true,{},data['row5']);
                                                newData.B.driveCode = 'B';
                                                newData.J6 = data['row6'];
                                                newData.C = $.extend(true,{},data['row6']);
                                                newData.C.driveCode = 'C';
                                                var Jall = {};
                                                Jall['driveCode'] = 'J类总计';
                                                Jall.lastYearAmount = parseInt(newData.crh['lastYearAmount'])+ parseInt(newData.J4['lastYearAmount'])+ parseInt(newData.J5['lastYearAmount'])+ parseInt(newData.J6['lastYearAmount']);
                                                Jall.yearAmount = parseInt(newData.crh['yearAmount'])+ parseInt(newData.J4['yearAmount'])+ parseInt(newData.J5['yearAmount'])+ parseInt(newData.J6['yearAmount']);
                                                Jall.sub = parseInt(newData.crh['sub'])+ parseInt(newData.J4['sub'])+ parseInt(newData.J5['sub'])+ parseInt(newData.J6['sub']);
                                                Jall.increaseAmount = parseInt(newData.crh['increaseAmount'])+ parseInt(newData.J4['increaseAmount'])+ parseInt(newData.J5['increaseAmount'])+ parseInt(newData.J6['increaseAmount']);
                                                Jall.kshg = parseInt(newData.crh['kshg'])+ parseInt(newData.J4['kshg'])+ parseInt(newData.J5['kshg'])+ parseInt(newData.J6['kshg']);
                                                Jall.dr = parseInt(newData.crh['dr'])+ parseInt(newData.J4['dr'])+ parseInt(newData.J5['dr'])+ parseInt(newData.J6['dr']);
                                                Jall.jdzjjxIncrease = parseInt(newData.crh['jdzjjxIncrease'])+ parseInt(newData.J4['jdzjjxIncrease'])+ parseInt(newData.J5['jdzjjxIncrease'])+ parseInt(newData.J6['jdzjjxIncrease']);
                                                Jall.otherIncrease = parseInt(newData.crh['otherIncrease'])+ parseInt(newData.J4['otherIncrease'])+ parseInt(newData.J5['otherIncrease'])+ parseInt(newData.J6['otherIncrease']);
                                                Jall.decreaseAmount = parseInt(newData.crh['decreaseAmount'])+ parseInt(newData.J4['decreaseAmount'])+ parseInt(newData.J5['decreaseAmount'])+ parseInt(newData.J6['decreaseAmount']);
                                                Jall.cx = parseInt(newData.crh['cx'])+ parseInt(newData.J4['cx'])+ parseInt(newData.J5['cx'])+ parseInt(newData.J6['cx']);
                                                Jall.zx = parseInt(newData.crh['zx'])+ parseInt(newData.J4['zx'])+ parseInt(newData.J5['zx'])+ parseInt(newData.J6['zx']);
                                                Jall.tx = parseInt(newData.crh['tx'])+ parseInt(newData.J4['tx'])+ parseInt(newData.J5['tx'])+ parseInt(newData.J6['tx']);
                                                Jall.sw = parseInt(newData.crh['sw'])+ parseInt(newData.J4['sw'])+ parseInt(newData.J5['sw'])+ parseInt(newData.J6['sw']);
                                                Jall.dc = parseInt(newData.crh['dc'])+ parseInt(newData.J4['dc'])+ parseInt(newData.J5['dc'])+ parseInt(newData.J6['dc']);
                                                Jall.zj = parseInt(newData.crh['zj'])+ parseInt(newData.J4['zj'])+ parseInt(newData.J5['zj'])+ parseInt(newData.J6['zj']);
                                                Jall.jdzjjxDecrease = parseInt(newData.crh['jdzjjxDecrease'])+ parseInt(newData.J4['jdzjjxDecrease'])+ parseInt(newData.J5['jdzjjxDecrease'])+ parseInt(newData.J6['jdzjjxDecrease']);
                                                Jall.otherDecrease = parseInt(newData.crh['otherDecrease'])+ parseInt(newData.J4['otherDecrease'])+ parseInt(newData.J5['otherDecrease'])+ parseInt(newData.J6['otherDecrease']);
                                                newData.Jall = Jall;
                                                newData.L1 = data['row7'];
                                                newData.L2 = data['row8'];
                                                newData.D = $.extend(true,{},data['row8']);
                                                newData.D['driveCode'] = 'D';
                                                newData.L3 = data['row9'];
                                                newData.E = $.extend(true,{},data['row9']);
                                                newData.E.driveCode = 'E';
                                                newData.E1 = $.extend(true,{},data['row9']);
                                                newData.E1.driveCode = 'E1';
                                                newData.E2 = $.extend(true,{},data['row9']);
                                                newData.E2.driveCode = 'E2';

                                                var Lall = {};
                                                Lall['driveCode'] = 'L类总计';
                                                Lall.lastYearAmount = parseInt(newData.L1['lastYearAmount'])+ parseInt(newData.L2['lastYearAmount'])+ parseInt(newData.L3['lastYearAmount']);
                                                Lall.yearAmount = parseInt(newData.L1['yearAmount'])+ parseInt(newData.L2['yearAmount'])+ parseInt(newData.L3['yearAmount']);
                                                Lall.sub = parseInt(newData.L1['sub'])+ parseInt(newData.L2['sub'])+ parseInt(newData.L3['sub']);
                                                Lall.increaseAmount = parseInt(newData.L1['increaseAmount'])+ parseInt(newData.L2['increaseAmount'])+ parseInt(newData.L3['increaseAmount']);
                                                Lall.kshg = parseInt(newData.L1['kshg'])+ parseInt(newData.L2['kshg'])+ parseInt(newData.L3['kshg']);
                                                Lall.dr = parseInt(newData.L1['dr'])+ parseInt(newData.L2['dr'])+ parseInt(newData.L3['dr']);
                                                Lall.jdzjjxIncrease = parseInt(newData.L1['jdzjjxIncrease'])+ parseInt(newData.L2['jdzjjxIncrease'])+ parseInt(newData.L3['jdzjjxIncrease']);
                                                Lall.otherIncrease = parseInt(newData.L1['otherIncrease'])+ parseInt(newData.L2['otherIncrease'])+ parseInt(newData.L3['otherIncrease']);
                                                Lall.decreaseAmount = parseInt(newData.L1['decreaseAmount'])+ parseInt(newData.L2['decreaseAmount'])+ parseInt(newData.L3['decreaseAmount']);
                                                Lall.cx = parseInt(newData.L1['cx'])+ parseInt(newData.L2['cx'])+ parseInt(newData.L3['cx']);
                                                Lall.zx = parseInt(newData.L1['zx'])+ parseInt(newData.L2['zx'])+ parseInt(newData.L3['zx']);
                                                Lall.tx = parseInt(newData.L1['tx'])+ parseInt(newData.L2['tx'])+ parseInt(newData.L3['tx']);
                                                Lall.sw = parseInt(newData.L1['sw'])+ parseInt(newData.L2['sw'])+ parseInt(newData.L3['sw']);
                                                Lall.dc = parseInt(newData.L1['dc'])+ parseInt(newData.L2['dc'])+ parseInt(newData.L3['dc']);
                                                Lall.zj = parseInt(newData.L1['zj'])+ parseInt(newData.L2['zj'])+ parseInt(newData.L3['zj']);
                                                Lall.jdzjjxDecrease = parseInt(newData.L1['jdzjjxDecrease'])+ parseInt(newData.L2['jdzjjxDecrease'])+ parseInt(newData.L3['jdzjjxDecrease']);
                                                Lall.otherDecrease = parseInt(newData.L1['otherDecrease'])+ parseInt(newData.L2['otherDecrease'])+ parseInt(newData.L3['otherDecrease']);
                                                newData.Lall = Lall;

                                                var all ={};
                                                all['driveCode'] = '总计';
                                                all.lastYearAmount = parseInt(newData.Jall['lastYearAmount'])+ parseInt(newData.Lall['lastYearAmount']);
                                                all.yearAmount = parseInt(newData.Jall['yearAmount'])+ parseInt(newData.Lall['yearAmount']);
                                                all.sub = parseInt(newData.Jall['sub'])+ parseInt(newData.Lall['sub']);
                                                all.increaseAmount = parseInt(newData.Jall['increaseAmount'])+ parseInt(newData.Lall['increaseAmount']);
                                                all.kshg = parseInt(newData.Jall['kshg'])+ parseInt(newData.Lall['kshg']);
                                                all.dr = parseInt(newData.Jall['dr'])+ parseInt(newData.Lall['dr']);
                                                all.jdzjjxIncrease = parseInt(newData.Jall['jdzjjxIncrease'])+ parseInt(newData.Lall['jdzjjxIncrease']);
                                                all.otherIncrease = parseInt(newData.Jall['otherIncrease'])+ parseInt(newData.Lall['otherIncrease']);
                                                all.decreaseAmount = parseInt(newData.Jall['decreaseAmount'])+ parseInt(newData.Lall['decreaseAmount']);
                                                all.cx = parseInt(newData.Jall['cx'])+ parseInt(newData.Lall['cx']);
                                                all.zx = parseInt(newData.Jall['zx'])+ parseInt(newData.Lall['zx']);
                                                all.tx = parseInt(newData.Jall['tx'])+ parseInt(newData.Lall['tx']);
                                                all.sw = parseInt(newData.Jall['sw'])+ parseInt(newData.Lall['sw']);
                                                all.dc = parseInt(newData.Jall['dc'])+ parseInt(newData.Lall['dc']);
                                                all.zj = parseInt(newData.Jall['zj'])+ parseInt(newData.Lall['zj']);
                                                all.jdzjjxDecrease = parseInt(newData.Jall['jdzjjxDecrease'])+ parseInt(newData.Lall['jdzjjxDecrease']);
                                                all.otherDecrease = parseInt(newData.Jall['otherDecrease'])+ parseInt(newData.Lall['otherDecrease']);
                                                newData.all = all;
                                                data = newData
                                                for(var m in data){
                                                    html+='<tr></tr>';
                                                    for(var n in data[m]){
                                                        html+='<td>'+data[m][n]+'</td>'
                                                    }
                                                }
                                                $('#summaryTable tbody').append(html)
                                                $(".summaryBanner .htmlToXls").off('click').on('click',function(){
                                                    if(confirm('是否要生成EXCEL表格')){
                                                        var filterArray=['driveCode','lastYearAmount','yearAmount','sub','increaseAmount','kshg','dr','jdzjjxIncrease','otherIncrease','decreaseAmount','cx','zx','tx','sw','dc','zj','jdzjjxdecrease','otherDecrease'];
                                                        var headerArray=[];
                                                        var title = '（'+year+'）'
                                                        var index = table5.indexOf('）');
                                                        htmlToXls(data,title+table5.substring(index+1,table5.length),filterArray,headerArray)
                                                    }
                                                })
                                            }
                                        })
                                    }
                                    else{
                                        alert('查无上年度数据，只生成今年度数据')
                                        $.ajax({
                                            url: "../../../ways.php",
                                            type: "POST",
                                            timeout: 8000,
                                            //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                                            data: {
                                                funcName: 'select',
                                                where: ' where year =\'' + year + '\'',
                                                serverName: '10.101.62.73',
                                                uid: 'sa',
                                                pwd: '2huj15h1',
                                                Database: 'JSZGL',
                                                tableName: ' tjxx ',
                                                column: ' *',
                                                order: ' '
                                            },
                                            dataType: 'json',
                                            success: function (data) {
                                                delete lastYearData.success
                                                delete lastYearData.count
                                                delete data.success
                                                delete data.count
                                                var _html = '<thead><tr class="title"><td colspan="18">('+year+')年度铁路机车车辆驾驶人员聘用情况统计表</td></tr><tr class="info"><td colspan="18">企业：___________ 审核人：___________ 填报人：___________ 联系电话：___________ 填报日期：        年       月       日</td></tr></thead>'
                                                var th = '<tr><th rowspan="3">准驾类型代码</th><th rowspan="3">上年度总数</th><th rowspan="3">统计年度总数</th><th rowspan="3">年度比较</th><th colspan="5">统计年度增加情况</th><th colspan="9">统计年度减少情况</th></tr>'
                                                th+='<tr><th rowspan="2">小计</th><th rowspan="2">考试合格</th><th rowspan="2">调入</th><th rowspan="2">降低准驾机型</th><th rowspan="2">其他</th><th rowspan="2">小计</th><th rowspan="2">撤销</th><th rowspan="2">注销</th><th rowspan="2">退休</th><th rowspan="2">死亡</th><th rowspan="2">调出</th><th rowspan="2">增驾</th><th rowspan="2">降低准驾机型</th><th rowspan="2">其他</th></tr>'
                                                $("#summaryTable").empty().append(_html).append(th);
                                                var html=''
                                                var obj={}
                                                for(var j in data){
                                                        obj.driveCode = data[j]['driveCode'];
                                                        obj.lastYearAmount = '-';
                                                        obj.yearAmount = data[j]['yearlyAmount'];
                                                        obj.sub = '-';
                                                        data[j] = Object.assign({},obj,data[j])
                                                        delete data[j]['year']
                                                        delete data[j]['yearlyAmount']
                                                }
                                                for(var m in data){
                                                    html+='<tr></tr>';
                                                    for(var n in data[m]){
                                                        html+='<td>'+data[m][n]+'</td>'
                                                    }
                                                }
                                                $('#summaryTable tbody').append(html)
                                                $(".summaryBanner .htmlToXls").off('click').on('click',function(){
                                                    if(confirm('是否要生成EXCEL表格')){
                                                        var filterArray=['driveCode','lastYearAmount','yearAmount','sub','increaseAmount','kshg','dr','jdzjjxIncrease','otherIncrease','decreaseAmount','cx','zx','tx','sw','dc','zj','jdzjjxdecrease','otherDecrease'];
                                                        var headerArray=[];
                                                        var title = '（'+year+'）'
                                                        var index = table5.indexOf('）');
                                                        htmlToXls(data,title+table5.substring(index+1,table5.length),filterArray,headerArray)
                                                    }
                                                })
                                            }
                                        })
                                    }

                                },
                                beforeSend:function(){
                                    loadingPicOpen();
                                    testSession(userSessionInfo);
                                },
                                complete: function (XMLHttpRequest,status) {
                                    loadingPicClose();
                                    if(status === 'timeout') {
                                        ajaxTimeOut4.abort();    // 超时后中断请求
                                        alert('网络超时，请检查网络连接');
                                    }
                                }
                            })

                        })
                    }
                    else if($(this).val() === table6){//聘用汇总表
                        if($('#yearSelect')){
                            $('#yearSelect').remove()
                        }
                        var date1 = new Date();
                        var year = date1.getFullYear()
                        var ajaxTimeOut5 = $.ajax({
                                url: "../../../ways.php",
                                type:"POST",
                                timeout:8000,
                                //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                                data:{funcName:'select',where:' ',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                                    tableName:' jbxx ',column:' UName,sex,cardId,birthdate,sjDriveCode,sjDate',order:' order by sjDriveCode'},
                                dataType:'json',
                                success:function(data){
                                    delete data['success'];
                                    var count = data['count'];
                                    delete data['count'];
                                    var company ='郑州局集团公司';
                                    var k =1;
                                    var obj ={};
                                    var obj2 ={};
                                    for(var x in data){
                                        obj.num = k;
                                        k++;
                                        obj.company =company;
                                        obj2.hireDate = ' ';
                                        obj2.ifHire = '是';
                                        data[x] = Object.assign({},obj,data[x]);
                                        data[x] = Object.assign({},data[x],obj2);
                                    }
                                    var _html = '<thead><tr class="title"><td colspan="12">('+year+')年度铁路机车车辆驾驶人员聘用情况汇总表</td></tr><tr class="info"><td colspan="12">企业：___________ 审核人：___________ 填报人：___________ 联系电话：___________ 填报日期：        年       月       日</td></tr></thead>'
                                    var th = '<tr><th>序号</th><th>单位</th><th>姓名</th><th>性别</th><th>公民身份号码</th><th>出生日期</th><th>准驾类型代码</th><th>初次领驾\u000d驶证日期</th><th>聘用日期</th><th>是否续聘</th><th>备注</th></tr>'
                                    $("#summaryTable").empty().append(_html).append(th);
                                    var html = ''
                                    if(count<11){
                                        for(var i in data){
                                            html+='<tr>'
                                            for(var j in data[i]){
                                                html += '<td>'+data[i][j]+'</td>';
                                            }
                                            html += '<td>&nbsp</td></tr>'
                                        }
                                        $("#summaryTable tbody").append(html);
                                        //空白tr补齐表格
                                        if($("#summaryTable tbody tr").length<11){
                                            html = '';
                                            var count = 11-$("#summaryTable tbody tr").length;
                                            var columns = $("#summaryTable tbody tr:first-child th").length;
                                            for(var m=0;m<count;m++){
                                                html+='<tr>';
                                                for(var n=0;n<columns;n++){
                                                    html+="<td></td>";
                                                }
                                                html+="</tr>";
                                            }
                                            $("#summaryTable tbody").append(html);
                                        }
                                    }else{
                                        var q =0;
                                        var cur =1;
                                        var total = Math.ceil(count/10);
                                        $("#summaryPage").css("display",'block');
                                        for(var i in data){
                                            html+='<tr>'
                                            for(var j in data[i]){
                                                html += '<td>'+data[i][j]+'</td>';
                                            }
                                            html += '<td>&nbsp</td></tr>';
                                            q+=1;
                                            if(q>9){
                                                break
                                            }
                                        }
                                        $("#summaryTable tbody").append(html);
                                        $("#summaryPage .cur").text(cur);
                                        $("#summaryPage .total").text(total);
                                        $("#summaryPage .next").off('click').on('click',function(){
                                            if(cur<total){
                                                var j =0;
                                                var html = th;
                                                for(var i in data){
                                                    if(j>10*cur-1 && j<10*(cur+1) && i ){
                                                        j++;
                                                        html+='<tr>'
                                                        for(var m in data[i]){
                                                            html += '<td>'+data[i][m]+'</td>';
                                                        }
                                                        html += '<td>&nbsp</td></tr>'
                                                    }else{
                                                        j++;
                                                    }
                                                }
                                                $("#summaryTable").empty().append(html);
                                                //空白tr补齐表格
                                                if($("#summaryTable tbody tr").length<11){
                                                    html = '';
                                                    var count = 11-$("#summaryTable tbody tr").length;
                                                    var columns = $("#summaryTable tbody tr:first-child th").length;
                                                    for(var m=0;m<count;m++){
                                                        html+='<tr>';
                                                        for(var n=0;n<columns;n++){
                                                            html+="<td></td>";
                                                        }
                                                        html+="</tr>";
                                                    }
                                                    $("#summaryTable tbody").append(html);
                                                }
                                                cur+=1;
                                                $("#summaryPage .cur").text(cur);
                                            }

                                        })
                                        $("#summaryPage .prev").off('click').on('click',function(){
                                            if(cur>1){
                                                var j =0;
                                                var html = th;
                                                for(var i in data){
                                                    if(j>10*(cur-2)-1 && j<10*(cur-1) && i ){
                                                        j++;
                                                        html+='<tr>'
                                                        for(var m in data[i]){
                                                            html += '<td>'+data[i][m]+'</td>';
                                                        }
                                                        html += '<td>&nbsp</td></tr>'
                                                    }else{
                                                        j++;
                                                    }
                                                }
                                                if(cur===2){
                                                    $("#summaryTable").empty().append(_html);
                                                    $("#summaryTable").append(html);
                                                }else{
                                                    $("#summaryTable").empty().append(html);
                                                }
                                                cur-=1;
                                                $("#summaryPage .cur").text(cur);
                                            }

                                        })
                                    }
                                    $(".summaryBanner .htmlToXls").off('click').on('click',function(){
                                        if(confirm('是否要生成EXCEL表格')){
                                            var filterArray=['num','company','UName','sex','cardId','birthdate','sjDriveCode','startDate','hireDate','ifHire'];
                                            var headerArray=['序号','单位','姓名','性别','公民身份号码','出生日期','准驾类型代码','初次领驾\u000d驶证日期','聘用日期','是否续聘','备注']
                                            var title = '（'+year+'）'
                                            var index = table6.indexOf('）');
                                            htmlToXls(data,title+table6.substring(index+1,table6.length),filterArray,headerArray)
                                        }
                                    })
                                },
                                beforeSend:function(){
                                    loadingPicOpen();
                                    testSession(userSessionInfo);
                                },
                                complete: function (XMLHttpRequest,status) {
                                    loadingPicClose();
                                    if(status === 'timeout') {
                                        ajaxTimeOut5.abort();    // 超时后中断请求
                                        alert('网络超时，请检查网络连接');
                                    }
                                }
                            })
                    }
                }
            })
        }
    }

    //以下是普通用户所用函数
    //普通用户渲染页面的函数
    function normalUser() {
        var payId = sessionGet('payId');
        //在这里添加动态渲染页面的代码，根据payid取驾驶证信息
        $.ajax({
            url: "../../../ways.php",
            type: "POST",
            data: {
                funcName: 'getInfo', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                tableName: 'jbxx', column: ' * ', where: ' where payId = \'' + payId + '\''
            },
            dataType: 'json',
            success: function (data) {
                $("#cardPicContent img").attr('src',data['row']['cardPath']);
                $("#cardInfoContent .name").text(data['row']['UName']);
                $("#cardInfoContent .birth").text(data['row']['birthDate']);
                $("#cardInfoContent .startDate").text(data['row']['startdate']);
                $("#cardInfoContent .deadline").text(data['row']['deadline']);
                $("#cardInfoContent .sjDate").text(data['row']['sjDate']);
                $("#cardInfoContent .driveType").text(data['row']['sjDriveCode']);
                $("#cardInfoContent .yearlyCheckDate").text(data['row']['yearlyCheckDate']);
                $("#cardInfoContent .idCard").text(data['row']['cardId']);
            }
        })

    }

    //点击补证按钮，生成表格，发送请求
    $("#fixButton").off('click').on('click', function () {
        if (confirm('是否确定要申请补发驾驶证？\u000d请注意，发出申请不可修改，请谨慎操作！')) {
            var payId = sessionGet('payId');
            var ajaxTimeOut = $.ajax({
                url: "../../../ways.php",
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
            var payId = sessionGet('payId');
            $("#fixButton").css('display', 'none');
            $("#yxqmButton").css('display', 'none');
            $("#fyxqmButton").css('display', 'none');
            $("#fixTable").css('visibility', 'visible');
            $("#print").css('visibility', 'visible');
            //$("#applySubmit").css('visibility', 'visible');
            $("#rightContent").css('width', '84%');
            $(".operateContent").css('margin', 0);
            getUserinfo(payId,csData['czlb-yxqmhz']['name']);
    })

    //非有效期满换证
    $("#fyxqmButton").off('click').on('click', function () {
        if (confirm('是否确定要申请换发驾驶证？\u000d请注意，发出申请不可修改，请谨慎操作！')) {
            var payId = sessionGet('payId');
            var ajaxTimeOut = $.ajax({
                url: "../../../ways.php",
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


    //车间年鉴体检
    $('.yearlyBanner .queryInput').keyup(function(event){
        if(event.keyCode === 13){
            displayYearly()
        }
    })
    $(".yearlyBanner .queryButton").off('click').on('click',function(){
        displayYearly()
    })
    function displayYearly(){
        if(sessionGet('power') === '1'){
            if($(".yearlyBanner .queryInput").val().match(/^[0-9]{5}$/)){
                var payid = $(".yearlyBanner .queryInput").val();
                var column = ' payId,UName,department,startDate,deadline,phyTest,yearlyCheckDate';
                var ajaxTimeOut = $.ajax({
                    url: "../../../ways.php",
                    type:"POST",
                    timeout:8000,
                    //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                    data:{funcName:'select',where:' where payid =\''+payid+'\'',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                        tableName:' jbxx ',column:column,order:' '},
                    dataType:'json',
                    success:function(data) {
                        if(data['success'] ===1){
                            $('.yearlyCheck').text('年鉴').css({
                                'color':'#555',
                                'fontWeight':'normal'
                            })
                            $('.queryInfo>div>div').css('backgroundColor','inherit')
                            $('#yearlyContainer .queryInfoContent').css('display','block')
                            $('#yearlyContainer .queryInfoContent .queryPicInfo img').prop('src',data['row1']['cardPath']);
                            $('#yearlyContainer .queryInfoContent .queryInfo .payId').text(data['row1']['payId']);
                            $('#yearlyContainer .queryInfoContent .queryInfo .name').text(data['row1']['UName']);
                            $('#yearlyContainer .queryInfoContent .queryInfo .department').text(data['row1']['department']);
                            $('#yearlyContainer .queryInfoContent .queryInfo .yearlyCheckDateInput').val(data['row1']['yearlyCheckDate']);
                            $('#yearlyContainer .queryInfoContent .queryInfo .startDate').text(data['row1']['startDate']);
                            $('#yearlyContainer .queryInfoContent .queryInfo .deadline').text(data['row1']['deadline']);
                            $('#yearlyContainer .queryInfoContent .queryInfo .phyTest').text(data['row1']['phyTest']);
                            $('#yearlyContainer .queryInfoContent .queryInfo .yearlyCheckDateInput').val(data['row1']['yearlyCheckDate']);
                            $("#yearlyContainer .queryInfoContent .queryInfo input").prop('disabled',true).css('backgroundColor','inherit')
                            $(".yearlyButtonBanner").css('display','block')
                            boundYearEvent(data['row1'])
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
                $(".yearlyBanner .queryInput").focus().css('backgroundColor','#ffcccc');
            }
        }
    }

    function boundYearEvent(data){
        $('.yearlyButtonBanner .phyTestOk').off('click').on('click',function(){
            if(confirm(data['UName']+'师傅的体检结论合格，确定？')){
                $.ajax({
                    url: "../../../ways.php",
                    type: "POST",
                    timeout: 8000,
                    data: {
                        funcName: 'update', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                        tableName: ' jbxx', setStr: 'phyTest = \''+csData['tjjl-hg']['nr2']+'\'', where: ' where payId = \''+data['payId']+'\''
                    },
                    dataType: 'json',
                    success: function (data) {
                        if(data['success'] === 1){
                            $('#yearlyContainer .queryInfoContent .phyTest').text(csData['tjjl-hg']['nr2'])
                        }
                    }
                })
            }
        })
        $('.yearlyButtonBanner .phyTestNo').off('click').on('click',function(){
            if(confirm(data['UName']+'师傅的体检结论不合格，确定？')){
                $.ajax({
                    url: "../../../ways.php",
                    type: "POST",
                    timeout: 8000,
                    data: {
                        funcName: 'update', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                        tableName: ' jbxx', setStr: 'phyTest = \''+csData['tjjl-bhg']['nr2']+'\'', where: ' where payId = \''+data['payId']+'\''
                    },
                    dataType: 'json',
                    success: function (data) {
                        if(data['success'] === 1){
                            $('#yearlyContainer .queryInfoContent .phyTest').text(csData['tjjl-bhg']['nr2'])
                        }
                    }
                })
            }
        })
        $('.yearlyButtonBanner .yearlyCheck').off('click').on('click',function(){
            if($(this).text() === '年鉴'){
                $(this).text('确定').css({
                    'color':'green',
                    'fontWeight':'bold'
                })
                var lotNumber = new Date();
                lotNumber.month = lotNumber.getMonth() < 9 ? '0' + (lotNumber.getMonth() + 1) : lotNumber.getMonth() + 1;
                lotNumber.date = lotNumber.getDate() < 10 ? '0' + lotNumber.getDate() : lotNumber.getDate();
                lotNumber = lotNumber.getFullYear() + '-' + lotNumber.month + '-' + lotNumber.date;
                $('#yearlyContainer .queryInfoContent .yearlyCheckDateInput').prop('disabled',false).val(lotNumber).css('backgroundColor','white')
            }else if(confirm(data['UName']+'师傅的最近一次年鉴时间为'+$('#yearlyContainer .queryInfoContent .yearlyCheckDateInput').val()+'，确定？')){
                if($('#yearlyContainer .queryInfoContent .yearlyCheckDateInput').val().match(/^\d{4}-\d{2}-\d{2}$/)){
                    var setDate = $('#yearlyContainer .queryInfoContent .yearlyCheckDateInput').val();
                    $.ajax({
                        url: "../../../ways.php",
                        type: "POST",
                        timeout: 8000,
                        data: {
                            funcName: 'update', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                            tableName: ' jbxx', setStr: 'yearlyCheckDate = \''+setDate+'\'', where: ' where payId = \''+data['payId']+'\''
                        },
                        dataType: 'json',
                        success: function (data) {
                            if(data['success'] === 1){
                                $('#yearlyContainer .queryInfoContent .yearlyCheckDateInput').val(setDate).prop('disabled',true).css('backgroundColor','inherit')
                                $('.yearlyButtonBanner .yearlyCheck').text('年鉴').css({
                                    'color':'#555',
                                    'fontWeight':'normal'
                                })
                                alert('年鉴成功')
                            }
                        }
                    })
                }else{
                    alert('日期格式不正确');
                    $('#yearlyContainer .queryInfoContent .yearlyCheckDateInput').focus().css('backgroundColor','#ffcccc')
                }
            }else{
                $('#yearlyContainer .queryInfoContent .yearlyCheckDateInput').val(data['yearlyCheckDate']).prop('disabled',true).css('backgroundColor','inherit')
                $('.yearlyButtonBanner .yearlyCheck').text('年鉴').css({
                    'color':'#555',
                    'fontWeight':'normal'
                })
            }
        })
    }


    //从全员信息库中取申请表要用的信息
    function getUserinfo(payId,changeType) {
        var ajaxTimeOut = $.ajax({
            url: "../../../ways.php",
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
                    url: "../../../ways.php",
                    type: "POST",
                    timeout: 8000,
                    data: {
                        funcName: 'getInfo', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                        tableName: 'jbxx', column: ' * ', where: ' where payid = \'' + payId + '\'', order: ' '
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
        var payId = cardData['PayId']? cardData['PayId'] :cardData['payId'];
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
        $("#mailInTable").val();
        //填写驾驶证信息
        $("#origin" + cardData['sjDriveCode']).attr({
            'checked': 'checked',
            'disabled': true
        }).siblings('input').attr('disabled', true);
        $("#apply" + cardData['sjDriveCode']).attr({
            'checked': 'checked',
            'disabled': true
        }).siblings('input').attr('disabled', true);
        if(cardData['sjDriveCode'] === 'A' || cardData['sjDriveCode'] === 'B' || cardData['sjDriveCode'] === 'C'){
            $("#originOther").prop({'checked':true,'disabled':true}).siblings('input').attr('disabled', true)
            $("#originOtherInput").prop({
                'disabled':false
            }).val(cardData['sjDriveCode'])
            if(cardData['sjDriveCode'] === csData['zjlx-A']['name']){
                cardData['sjDriveCode'] = csData['zjlx-J4']['name']
            }else if(cardData['sjDriveCode'] === csData['zjlx-B']['name']){
                cardData['sjDriveCode'] = csData['zjlx-J5']['name']
            }else if(cardData['sjDriveCode'] === csData['zjlx-C']['name']){
                cardData['sjDriveCode'] = csData['zjlx-J6']['name']
            }
            if(changeType === csData['czlb-bz']['name'] || changeType === csData['czlb-yxqmhz']['name']){
                $("#apply" + cardData['sjDriveCode']).attr({
                    'checked': 'checked',
                    'disabled': true
                }).siblings('input').attr('disabled', true);
            }

        }
        if(cardData['applyDriveCode']){
            $("#apply" + cardData['applyDriveCode']).attr({
                'checked': 'checked',
                'disabled': true
            }).siblings('input').attr('disabled', true);
        }
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
        }
        else if(changeType === csData['czlb-fyxqmhz']['name']){
            //非有效期满换证
            $('.apply input').off('click').on('click',function(){
                if($('.origin input:checked').attr('id') === 'originOther'){
                    var origin = $('#originOtherInput').val()
                }else{
                    var origin = $('.origin input:checked').next('label').text()
                }
                if(csData['zjlx-'+$(this).next('label').text()]['nr2'] > csData['zjlx-'+origin]['nr2']){
                    alert('不能选择比原证等级高的类型')
                    $(this).prop('checked',false)
                }
            })
            $("#fixCheckBox").prop({"disabled": true,'checked':false});
            $("#changeCheckBox").prop({"disabled": true, "checked": "checked"});
            if(cardData['id']){
                        $("#apply" + cardData['applyDriveCode']).prop({
                            'disabled':true,
                            'checked':true
                        }).siblings('input').prop({
                            'disabled':true,
                            'checked':false
                        })
                        if(cardData['changeReason'] === csData['hzyy-jdzjjx']['nr2']){
                            $("#reasonLower").prop({
                                'disabled':true,
                                'checked':true
                            }).parent().siblings('div').children('input').prop({
                                'disabled':true,
                                'checked':false
                            })
                        }else if(cardData['changeReason'] === csData['hzyy-nrbh']['nr2']){
                            $("#reasonContChange").prop({
                                'disabled':true,
                                'checked':true
                            }).parent().siblings('div').children('input').prop({
                                'disabled':true,
                                'checked':false
                            })
                        }else{
                            $("#otherReason").prop({
                                'disabled':true,
                                'checked':true
                            }).parent().siblings('div').children('input').prop({
                                'disabled':true,
                                'checked':false
                            })
                            $('#otherReasonText').val(cardData['changeReason'])
                        }
                    }else{
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
                    }


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
        var department = sessionGet('department').split(',')[0];
        var UName = sessionGet('user');
        var cardId = data['cardid'];
        var archivesId = data['archivesId'];
        var sex = data['sex'];
        var birthDate = data['birthdate'];
        var startDate = cardData['startdate'];
        var deadline = cardData['deadline'];
        var sjRemark = cardData['sjRemark'];
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
        if(!driveCode){
            alert('请勾选原证准驾类型，老证请选“其他”并在后面输入准驾代码')
        }else{
            var drive = csData['zjlx-' + driveCode]['nr1'];
            var applyDriveCode = $(".apply input:checked").next('label').text();
            var phyTest = $(".phyCheck input:checked").next('label').text();
            var checkStatus ='';
            if(checkIfInArray(department,straightJYK)){
                checkStatus = csData['checkStatus-jykshz']['nr2'];
            }else{
                checkStatus = csData['checkStatus-cjshz']['nr2'];
            }
            var lotNumber = new Date();
            lotNumber.month = lotNumber.getMonth() < 9 ? '0' + (lotNumber.getMonth() + 1) : lotNumber.getMonth() + 1;
            lotNumber.date = lotNumber.getDate() < 10 ? '0' + lotNumber.getDate() : lotNumber.getDate();
            lotNumber = lotNumber.getFullYear() + '-' + lotNumber.month + '-' + lotNumber.date;
            var ajaxTimeOut = $.ajax({
                url: "../../../ways.php",
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
                    'driveCode,drive,phyTest,needed,checkStatus,applyDriveCode,sex,birthDate,startDate,deadline,sjRemark)',
                    values: '(getDate(),\'' + lotNumber + '\',\'' + department + '\',\'' + payId + '\',\'' + archivesId + '\',\'' + UName + '\',\'' + cardId + '\',\'' + changeType + '\',\''
                    + changeReason + '\',\'' + driveCode + '\',\'' + drive + '\',\'' + phyTest + '\',\'' + needed + '\',\'' + checkStatus + '\',\''+applyDriveCode+'\',\''+sex+'\',\''+birthDate+'\',\''+startDate+'\',\''+deadline+'\',\''+sjRemark+'\')'
                },
                dataType: 'json',
                success: function () {
                    $("#applySubmit").css('display', 'none');
                    if(changeType === csData['czlb-bz']['nr3']){
                        alert('您的补证申请提交成功，请联系车间开具《驾驶证丢失证明》')
                        tzEvent(csData,csData['czlb-bz']['nr3'],payId)
                    }else{
                        alert('您的换证申请提交成功，请留意审核状态');
                        tzEvent(csData,csData['czlb-yxqmhz']['nr3'],payId)
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
                url: "../../../ways.php",
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
                url: "../../../ways.php",
                type: "POST",
                timeout: 8000,
                data: {
                    funcName: 'insert',
                    serverName: '10.101.62.73',
                    uid: 'sa',
                    pwd: '2huj15h1',
                    Database: 'jszgl',
                    tableName: ' sqxx',
                    column: ' (id,date,Department,payId,UName,sex,cardId,changeType,changeReason,' +
                    'sjDriveCode,applyDriveCode,phyTest,fixedPhone,mobilePhone,company,address,mail,sjDate)',
                    values: '(getDate(),\''+date+'\',\''+department + '\',\'' + payId + '\',\'' + UName + '\',\''+sex+'\',\'' + cardId + '\',\'' + changeType + '\',\''
                    + changeReason + '\',\'' + driveCode + '\',\'' + applyDriveCode + '\',\'' + phyTest + '\',\'' + fixedPhone + '\',\'' + mobilePhone + '\',\''+company
                    +'\',\''+address+'\',\''+mail+'\',\''+sjDate+'\')'
                },
                dataType: 'json',
                success: function (data) {

                }
            })
        }



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
            url: "../../../ways.php",
            type: "POST",
            timeout: 8000,
            data: {
                funcName: 'getInfo',
                serverName: '10.101.62.73',
                uid: 'sa',
                pwd: '2huj15h1',
                Database: 'jszgl',
                tableName: 'jbxx',
                column: ' UName,status ',
                where: ' where payId = \'' + payId + '\'',
                order: ' '
            },
            dataType: 'json',
            success: function (data) {
                console.log(data)
                $("#firstName").text(data['row']['UName'][0]);
                $("#cardStatus").text(data['row']['status']).css({'color': 'red', 'fontWeight': 'bold'})
                //预警或过期
                if (data['row']['status'] === csData['zjzt-yj']['nr2'] || data['row']['status'] === csData['zjzt-gq']['nr2']) {
                    $("#alert").text('请及时换证或重新参加考试').css({'color': 'red', 'fontWeight': 'bold'})
                }//正常
                else if(data['row']['status'] === csData['zjzt-zc']['nr2']){

                }else{
                    $.ajax({
                        url: "../../../ways.php",
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
                                } else if (data['row']['changeType'] === csData['czlb-dr']['nr2'] || data['row']['changeType'] === csData['czlb-levelup2']['nr2']) {
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
            url: "../../../ways.php",
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
            url: "../../../ways.php",
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