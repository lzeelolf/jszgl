$(document).ready(function() {
    initialScreen();
    loginStatus();
    //记住登录时的session
    userSessionInfo = rememberSession('token', 'user', 'power', 'department','payId');
    //证件查询按钮的事件,调用displayQueryForm函数
    testSession(userSessionInfo)
    //以下这些部门人员较少，直接面向教育科，由教育科负责审核
    var straightJYK = ['安全生产指挥中心','技术科','综合分析室','安全科','职工教育科','统计信息科'];
    //---------------共用函数---------------
    initial()
    function initial(){
        var power = sessionGet('power')
        //根据用户的权限来显示左边的li内容
        appendLi(power,csData)
        //给左边的按钮添加事件，更新右边容器的内容
        $("#buttonList li").each(function () {
            $(this).on('click',displayContainer);
        });
        if(power === 'V'){
            appendEditAndLogOut(csData)
            appendAlert(csData)
            appendSummary(csData)
            appendDrdc(csData)
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
        else if(power === '1'){
            appendAlert(csData)
        }
        else{
            //查询证件状态
            $("li.statusButton").on('click', function () {
                checkCardStatus(csData);
            })
        }
        $('#foldButton').off('click').on('click',fold)

        appendModal();
        appendToolTip()
    }
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
        $('#tsSuccess').modal({
            'show':false
        })
        $('#appendSubmit').modal({
            'show':false
        })
        $('#rejectModal').modal({
            'show':false
        })
        $('#uploadImage').modal({
            'show':false
        })
        $("#improveAlert").modal({
            'show':false
        })
        $("#paramOption").modal({
            'backdrop':'static',
            'show':false
        })
        $("#alertModal").modal({
            'backdrop':'static',
            'show':false
        })
        $('#alertModal').on('hidden', function () {
            $('#alertModal p').empty()
        })
    }
    //主页面单击左边li显示右边内容的函数，注销功能也在这里实现
    function displayContainer(){
        testSession(userSessionInfo)
        $(this).addClass('cur');
        $(this).siblings().removeClass('cur')
        if($(this).hasClass('appendButton')){
            appendAppend(csData)
            $("#appendContainer").css('display', 'block').siblings().css('display', 'none');
        }
        if($(this).hasClass('drdcButton')){
            appendDrdc(csData)
            $('.drdcButton .redPoint').remove();
            $("#drdcContainer").css('display', 'block').siblings().css('display', 'none');
        }
        if($(this).hasClass('deleteButton')){
            $("#deleteContainer").css('display', 'block').siblings().css('display', 'none');
        }
        if($(this).hasClass('queryButton')){
            displayQueryForm(csData)
            $("#queryCardContainer").css('display', 'block').siblings().css('display', 'none');
        }
        if($(this).hasClass('dataButton')){
            appendTJxx(csData);
            $("#dataContainer").css('display', 'block').siblings().css('display', 'none');
        }
        if($(this).hasClass('exchangeButton')){
            $("#exchangeContainer").css('display', 'block').siblings().css('display', 'none');
        }
        if($(this).hasClass('alertButton')){
            appendAlert(csData);
            $('.alertButton .redPoint').remove();
            $("#alertContainer").css('display', 'block').siblings().css('display', 'none');
        }
        if($(this).hasClass('fixButton')){
            $("#fixContainer").css('display', 'block').siblings().css('display', 'none');
        }
        if($(this).hasClass('editButton')){
            $("#editContainer").css('display', 'block').siblings().css('display', 'none');
        }
        if($(this).hasClass('summaryButton')){
            $("#summaryContainer").css('display', 'block').siblings().css('display', 'none');
        }
        if($(this).hasClass('yearlyButton')){
            $("#yearlyContainer").css('display', 'block').siblings().css('display', 'none');
        }
        if($(this).hasClass('informationButton')){
            $("#informationContainer").css('display', 'block').siblings().css('display', 'none');
        }
        if($(this).hasClass('applyButton')){
            $("#applyContainer").css('display', 'block').siblings().css('display', 'none');
        }
        if($(this).hasClass('statusButton')){
            $("#statusContainer").css('display', 'block').siblings().css('display', 'none');
        }
        if($(this).hasClass('logOutButton')){
            if(confirm("确定要退出系统？")){
                sessionClear();
                window.location.href = '../html/login.html'
            }
        }
    }
    function appendLi(power,csData) {
        var html = '';
        if (power === 'V') {//这里填管理员的权限
            html = '<li class="alertButton">预警信息<span class="redPoint"></span></li><li class="queryButton">证件查询</li><li class="appendButton">提升司机</li><li class="drdcButton">调入调出<span class="redPoint"></span></li><li class="exchangeButton">换证</li>' +
                '<li class="fixButton">补证</li><li class="deleteButton">注销</li><li class="editButton">证件信息修改</li><li class="summaryButton">汇总表格</li><li class="logOutButton">退出系统</li>'
            $("#buttonList").append(html);
            appendQueryElement(power);
            appendApplyCheck(power,csData);
        } else if (power === '1') {//这里填车间管理人员的权限
            html = '<li class="alertButton">预警信息<span class="redPoint"></span></li><li class="queryButton">证件查询</li><li class="exchangeButton">换证</li>' +
                '<li class="fixButton">补证</li><li class="dataButton">历史记录</li><li class="yearlyButton">完善信息</li><li class="logOutButton">退出系统</li>';
            $("#buttonList").append(html);
            //车间管理人员没有添加和注销功能，移除相应区域
            $("#appendContainer").remove();
            $("#cancelContainer").remove();
            appendQueryElement(power);
            appendApplyCheck(power,csData);
        } else if (power === '0') {//这里填普通人员的权限
            html = '<li class=\"informationButton\">证件信息</li><li class=\"applyButton\">换补申请</li><li class=\"statusButton\">证件状态</li>' +
                '<li class="logOutButton">退出系统</li>';
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
                        $("#alertModal").modal('show')
                        $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
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
    function fold(){
        if($(this).hasClass('foldOpen')){
            $(this).removeClass('foldOpen')
            $('#leftContent').animate({
                'left':'0'
            },200)
            $('#rightContent').animate({
                'width':'86%',
                'left':'14%'
            },200)
            $('#foldButton i').removeClass('icon-zhedie').addClass('icon-zhedieleft')
        }else{
            $(this).addClass('foldOpen')
            $('#leftContent').animate({
                'left':'-12%'
            },200)
            $('#rightContent').animate({
                'width':'100%',
                'left':0
            },200)
            $('#foldButton i').removeClass('icon-zhedieleft').addClass('icon-zhedie')
        }
    }
    //--------------共用函数完--------------


    //证件信息修改以及注销
    function appendEditAndLogOut(csData){
        $('#editBanner .queryInput').keyup(function(event){
            if(event.keyCode === 13){
                displayEdit()
            }
        })
        $("#editBanner .queryButton").off('click').on('click',function(){
            displayEdit()
        })
        $('#deleteTab a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        })
        //分别定义事件
        $('a[href="#deleteOperate"]').on('shown', function (e){
            $('#deleteBanner .queryInput').keyup(function(event){
                if(event.keyCode === 13){
                    displayLogOut()
                }
            })
            $("#deleteBanner .queryButton").off('click').on('click',function(){
                displayLogOut()
            })
        })
        $('a[href="#deleteHistory"]').on('shown', function (e){
            appendHistory()
        })
        function displayEdit(){
            if(sessionGet('power') === 'V'){
                if($("#editBanner .queryInput").val().match(/^[a-zA-Z]+$/)){
                    var pym = $("#editBanner .queryInput").val();
                    var column = ' *';
                    var ajaxTimeOut = $.ajax({
                        url: "../../../ways.php",
                        type:"POST",
                        timeout:8000,
                        //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                        data:{funcName:'select',where:' where pym =\''+pym+'\'',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                            tableName:' jbxx ',column:column,order:' '},
                        dataType:'json',
                        success:function(data) {
                            if(data['success'] ===1){
                                $('#editContainer .queryInfoContent').css('display','none')
                                $('.editButtonBanner').css('display','none')
                                $('#editContainer ul').empty()
                                $(".editButtonBanner").css('display','none')
                                if(data['count'] === 1){
                                    displayEditInfo(data['row1'])
                                }else{
                                    delete data['count']
                                    delete data['success']
                                    var html = '';
                                    for(var i in data){
                                        html += '<li class="span3"><div class="thumbnail '+ i +'">';
                                        if(data[i]['photoPath']){
                                            html += '<img src="'+ data[i]['photoPath']+'"/>'
                                        }else{
                                            html += '<img src="../images/暂无图片.png"/>'
                                        }
                                        html += '<div><span>工资号：</span><span class="payId">'+ data[i]['payId']+'</span></div>'
                                        html += '<div><span>部门：</span><span class="department">'+ data[i]['department']+'</span></div>'
                                        html += '<div><span>姓名：</span><span class="uName">'+ data[i]['UName']+'</span></div>'

                                    }
                                    $("#editContainer ul").empty().append(html)
                                    $('#editContainer ul .thumbnail').off('click').on('click',function(){
                                        var cla = this.className.split('thumbnail ')[1]         //取到类名，去掉thumbnail和空格
                                        $('#editContainer ul').empty()
                                        displayEditInfo(data[cla])
                                    })
                                }


                                function displayEditInfo(data){
                                    $('.infoFix').text('信息更正').css({'color':'#333','fontWeight':'normal'})
                                    $('.queryInfo>div>div').css('backgroundColor','inherit')
                                    $('#editContainer .queryInfoContent').css('display','block')
                                    $('.queryInfoContent .queryPicInfo img').prop('src',data['cardPath']);
                                    $('.queryInfoContent .queryInfo .payIdInput').val(data['payId']);
                                    $('.queryInfoContent .queryInfo .name').text(data['UName']);
                                    $('.queryInfoContent .queryInfo .department').text(data['department']);
                                    $('.queryInfoContent .queryInfo .birth').text(data['birthDate']);
                                    $('.queryInfoContent .queryInfo .sjDateInput').val(data['sjDate']);
                                    $('.queryInfoContent .queryInfo .sjRemarkInput').val(data['sjRemark']);
                                    $('.queryInfoContent .queryInfo .yearlyCheckDateInput').val(data['yearlyCheckDate']);
                                    $('.queryInfoContent .queryInfo .driveCodeInput').val(data['sjDriveCode']);
                                    $('.queryInfoContent .queryInfo .driveTypeInput').val(data['sjDriveType']);
                                    $('.queryInfoContent .queryInfo .startDateInput').val(data['startdate']);
                                    $('.queryInfoContent .queryInfo .deadlineInput').val(data['deadline']);
                                    $('.queryInfoContent .queryInfo .phyTest').text(data['phyTest']);
                                    $(".queryInfoContent .queryInfo input").prop('disabled',true)
                                    $(".editButtonBanner").css('display','block')
                                    boundEditEvent(data)
                                }

                            }else{
                                $("#alertModal").modal('show')
                                $("#alertModal .text-warning").empty().text('您查询的信息不存在')
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
                                $("#alertModal").modal('show')
                                $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
                            }
                        }
                    })
                }else{
                    $("#alertModal").modal('show')
                    $("#alertModal .text-warning").empty().text('请输入拼音码（姓名拼音首字母，例如张三的拼音码是zs，不区分大小写）')
                }
            }
        }
        function displayLogOut(){
            if(sessionGet('power') === 'V'){
                if($("#deleteBanner .queryInput").val().match(/^[a-zA-Z]+$/)){
                    var pym = $("#deleteBanner .queryInput").val();
                    var column = ' *';
                    var ajaxTimeOut = $.ajax({
                        url: "../../../ways.php",
                        type:"POST",
                        timeout:8000,
                        //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                        data:{funcName:'select',where:' where pym =\''+pym+'\'',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                            tableName:' jbxx ',column:column,order:' '},
                        dataType:'json',
                        success:function(data) {
                            if(data['success'] ===1){
                                $('#deleteContainer .queryInfoContent').css('display','none')
                                $('.deleteButtonBanner').css('display','none')
                                $('#deleteContainer ul.thumbnails').empty()
                                $(".deleteButtonBanner").css('display','none')
                                if(data['count'] === 1){
                                    displayDeleteInfo(data['row1'])
                                }else{
                                    delete data['count']
                                    delete data['success']
                                    var html = '';
                                    for(var i in data){
                                        html += '<li class="span3"><div class="thumbnail '+ i +'">';
                                        if(data[i]['photoPath']){
                                            html += '<img src="'+ data[i]['photoPath']+'"/>'
                                        }else{
                                            html += '<img src="../images/暂无图片.png"/>'
                                        }
                                        html += '<div><span>工资号：</span><span class="payId">'+ data[i]['payId']+'</span></div>'
                                        html += '<div><span>部门：</span><span class="department">'+ data[i]['department']+'</span></div>'
                                        html += '<div><span>姓名：</span><span class="uName">'+ data[i]['UName']+'</span></div>'

                                    }
                                    $("#deleteContainer ul.thumbnails").empty().append(html)
                                    $('#deleteContainer ul.thumbnails .thumbnail').off('click').on('click',function(){
                                        var cla = this.className.split('thumbnail ')[1]         //取到类名，去掉thumbnail和空格
                                        $('#deleteContainer ul.thumbnails').empty()
                                        displayDeleteInfo(data[cla])
                                    })
                                }


                                function displayDeleteInfo(data){
                                    $('#deleteContainer .queryInfoContent').css('display','block')
                                    $('#deleteContainer .queryInfoContent .queryInfo .payId').text(data['payId']);
                                    $('#deleteContainer .queryInfoContent .queryInfo .name').text(data['UName']);
                                    $('#deleteContainer .queryInfoContent .queryInfo .department').text(data['department']);
                                    $('#deleteContainer .queryInfoContent .queryInfo .birthDate').text(data['birthDate']);
                                    $('#deleteContainer .queryInfoContent .queryInfo .txrq').text(data['txrq']);
                                    $('#deleteContainer .queryInfoContent .queryInfo .status').text(data['status']);
                                    $('#deleteContainer .queryInfoContent .queryInfo .pc').text(data['PC']);
                                    $('#deleteContainer .queryInfoContent .queryInfo .sjDate').text(data['sjDate']);
                                    $('#deleteContainer .queryInfoContent .queryInfo .sjRemark').text(data['sjRemark']);
                                    $('#deleteContainer .queryInfoContent .queryInfo .driveCode').text(data['sjDriveCode']);
                                    $('#deleteContainer .queryInfoContent .queryInfo .driveType').text(data['sjDriveType']);
                                    $('#deleteContainer .queryInfoContent .queryInfo .startDate').text(data['startdate']);
                                    $('#deleteContainer .queryInfoContent .queryInfo .deadline').text(data['deadline']);
                                    $(".deleteButtonBanner").css('display','block')
                                    boundDeleteEvent(data)
                                }

                            }
                            else{
                                $("#alertModal").modal('show')
                                $("#alertModal .text-warning").empty().text('您查询的信息不存在')
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
                                $("#alertModal").modal('show')
                                $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
                            }
                        }
                    })
                }
                else{
                    $("#alertModal").modal('show')
                    $("#alertModal .text-warning").empty().text('请输入拼音码（姓名拼音首字母，例如张三的拼音码是zs，不区分大小写）')
                }
            }
        }
        //证件编辑的按钮事件
        function boundEditEvent(data){
            var payId = data['payId']
            var flag = true;
            //信息更正按钮
            $('.infoFix').off('click').on('click',function(){
                $(".logOutContent").css('display','none')
                var arr =[];
                var j=0;
                for(var i in csData){
                    if(csData[i]['lb'] === 'zjlx'){
                        arr[j] = csData[i]['name'];
                        j++;
                    }
                }
                if(!$(this).hasClass('commit')){
                    $(this).addClass('commit')
                    alert('您现在可以对人员部分信息进行更正');
                    $(this).text('确认更改').css({'color':'GREEN','fontWeight':'bold'})
                    $("#editContainer .queryInfo input").prop('disabled',false).parent().css('backgroundColor','white');
                    $("#editContainer .queryInfo .driveTypeInput").prop('disabled',true).parent().css('backgroundColor','inherit')
                    $("#editContainer .queryInfo .payIdInput").focus(function(){
                        $(this).val('')
                    })

                    //准驾代码失焦，自动对应准驾类型
                    $("#editContainer .queryInfo .driveCodeInput").blur(function(){
                        for(var i in csData){
                            if($(this).val() === csData[i]['name']){
                                $('#editContainer .queryInfo .driveTypeInput').val(csData[i]['nr1'])
                            }
                        }
                        if(checkIfInArray($(this).val(),arr)){
                            $("#editContainer .driveCode").css('backgroundColor','white')
                            flag = true;
                        }else{
                            $("#editContainer .driveCode").css('backgroundColor','#ffcccc')
                            flag =false;
                            return false
                        }
                    })
                }else{
                    $(this).removeClass('commit')
                    checkIfInArray($("#editContainer .queryInfo .driveCodeInput").val(),arr)
                    //提交
                    if($("#editContainer .queryInfo .payIdInput").val().match(/^[0-9]{5}$/) && ($('#editContainer .queryInfo .sjDateInput').val().match(/^\d{4}-\d{2}-\d{2}$/) || $('#editContainer .queryInfo .sjDateInput').val() === '') && ($('#editContainer .queryInfo .yearlyCheckDateInput').val().match(/^\d{4}-\d{2}-\d{2}$/) || $('#editContainer .queryInfo .yearlyCheckDateInput').val() === '') && ($('#editContainer .queryInfo .startDateInput').val().match(/^\d{4}-\d{2}-\d{2}$/) || $('#editContainer .queryInfo .startDateInput').val() === '') && ($('#editContainer .queryInfo .deadlineInput').val().match(/^\d{4}-\d{2}-\d{2}$/) || $('#editContainer .queryInfo .deadlineInput').val() === '') && flag){
                        if(confirm('确认要进行更改吗？')){
                            var sjDate = $("#editContainer .queryInfo .sjDateInput").val()?$("#editContainer .queryInfo .sjDateInput").val():' ';
                            var startDate = $("#editContainer .queryInfo .startDateInput").val()?$("#editContainer .queryInfo .startDateInput").val():' '
                            var deadline = $("#editContainer .queryInfo .deadlineInput").val()?$("#editContainer .queryInfo .deadlineInput").val():' ';
                            var yearlyCheckDate = $("#editContainer .queryInfo .yearlyCheckDateInput").val()?$("#editContainer .queryInfo .yearlyCheckDateInput").val():' ';
                            var setStr ='payid =\''+$("#editContainer .queryInfo .payIdInput").val()+'\',sjDate =\''+sjDate+'\',yearlyCheckDate =\''+yearlyCheckDate+'\',sjDriveCode =\''+$("#editContainer .queryInfo .driveCodeInput").val()+'\',sjDriveType =\''+$("#editContainer .queryInfo .driveTypeInput").val()+'\',startDate =\''+startDate+'\',deadline = \''+deadline+'\',sjRemark =\''+$("#editContainer .queryInfo .sjRemarkInput").val()+'\'';
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
                                success: function (data) {
                                    $("#alertModal").modal('show')
                                    $("#alertModal .text-success").empty().text('信息修改成功')
                                    $('.infoFix').text('信息更正').css({'color':'#333','fontWeight':'normal'})
                                    $("#editContainer .queryInfo input").prop('disabled',true).parent().css('backgroundColor','inherit');
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
                                        $("#alertModal").modal('show')
                                        $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
                                    }
                                }
                            })
                        }
                        else{
                            displayEdit()
                        }
                    }
                    else{
                        $(this).addClass('commit')
                        $("#alertModal").modal('show')
                        $("#alertModal .text-error").empty().text('请检查输入格式！(工资号为5位数字，日期格式为"xxxx-xx-xx")')
                    }

                }


            })
            $('.phyTestOk').off('click').on('click',function(){
                $(".logOutContent").css('display','none')
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
        //证件注销的按钮事件
        function boundDeleteEvent(data){
            var payId = data['payId']
            //人员调出按钮
            $('.rydc').off('click').on('click',function(){
                $(".logOutContent").css('display','none')
                if(confirm('（注意！请在确认该人员已调出本段的情况下进行调出操作）\u000d'+'确认'+$(".queryInfo .name").html()+'师傅已调出？')){
                    if(data['status'] !== csData['zjzt-dc']['nr2'] && data['status'] !== csData['zjzt-zx']['nr2']){
                        var where = ' where payid =\''+payId+'\'';
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
                                        column: ' (lotNumber,Department,payId,archivesId,UName,changeType,' +
                                        'driveCode,drive,jykOperator)',
                                        values: '(\'' + lotNumber + '\',\'' + data['department'] + '\',\'' + data['payId'] + '\',\'' + data['archivesId'] + '\',\'' + data['UName'] + '\',\'' + csData['czlb-dc']['nr2'] +
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
                                        $(".deleteButtonBanner").css('display','none')
                                        $("#alertModal").modal('show')
                                        $("#alertModal .text-success").empty().text('操作成功。该证件的状态目前为：'+csData['zjzt-dc']['nr2'])
                                    }
                                })
                            }
                        })
                    }else{
                        $("#alertModal").modal('show')
                        $("#alertModal .text-error").empty().text('该人员已调出或注销，不能继续调出操作')
                    }

                }

            })
            //证件注销按钮
            $('.logout').off('click').on('click',function(){
                $("#deleteContainer .logOutContent").css('display','block');
                $("#logOutReason").off('change').on('change',function(){
                    var reason = $(this).val();
                    if(data['status'] !== csData['zjzt-dc']['nr2'] && data['status'] !== csData['zjzt-zx']['nr2']){
                        if($(this).val() !== '--请选择--'){
                            if(confirm('确定要注销该证件吗？'+'注销原因是：'+$(this).val())){
                                var setStr =' status=\''+csData['zjzt-zx']['nr2']+'\'';
                                var where = ' where payid =\''+payId+'\' AND uName=\''+uName+'\' AND pym=\''+pym+'\' ';
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
                                                column: ' (lotNumber,Department,payId,archivesId,UName,changeType,changeReason,' +
                                                'driveCode,drive,jykOperator)',
                                                values: '(\'' + lotNumber + '\',\'' + data['department'] + '\',\'' + data['payId'] + '\',\'' + data['archivesId'] + '\',\'' + data['UName'] + '\',\'' + csData['czlb-zx']['nr2']+'\',\''+reason +
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
                                                $(".deleteButtonBanner").css('display','none')
                                                $(".logOutContent").css('display','none')
                                                $("#alertModal").modal('show')
                                                $("#alertModal .text-success").empty().text('已注销该证件')
                                            }
                                        })
                                    }
                                })
                            }
                        }

                    }else{
                        $("#alertModal").modal('show')
                        $("#alertModal .text-error").empty().text('该证件已注销或者调出，不能重复操作')
                    }

                })
            })
        }
        function appendHistory(){
            var obj = {}
            obj.column = ' id,archivesId,department,lotNumber,uName,changeType,changeReason,jykOperator'
            obj.where = ' where changeType=\''+csData['czlb-zx']['nr3']+'\''
            obj.order = ' order by lotnumber desc'
            $.ajax({
                url: "../../../ways.php",
                type:"POST",
                timeout:8000,
                //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                data:{funcName:'select',where:obj.where,serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                    tableName:' bgxx ',column:obj.column,order:obj.order},
                dataType:'json',
                success:function(data){
                    if(data['success'] === 1){
                        var table = $("#deleteHistoryTable");
                        var page = $("#deleteHistoryPage");
                        var thText = '<tr><th>id</th><th>档案号</th><th>部门</th><th>日期</th><th>姓名</th><th>操作类别</th><th>注销原因</th><th>教育科经办人</th><th>操作</th></tr>';
                        var eventFunction = boundBackEvent;
                        var extra = '<td><span class="back">撤回</span></td>';
                        commonAppendToTable(table,page,data,thText,extra,eventFunction)
                    }
                    /*
                    var table = $("#dataTable");
                            var page = $("#dataPage");
                            var eventFunction = boundBackEvent;
                            commonAppendToTable(table,page,data,thText,extra,eventFunction)
                            $("#dataTable th:first-child,#dataTable td:first-child").css('visibility','hidden')

                    */
                }
            })
        }
    }
    //添加换证补证界面
    function appendApplyCheck(power,csData) {
        //激活换证补证的标签页
        $('#exchangeBanner a,#fixBanner a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        })
        //分别定义事件
        $('a[href="#exchangeApplyAppendContent"]').on('shown', function (e){

        })
        $('a[href="#exchangeApplyCheckContent"]').on('shown', function (e) {
            $("#exchangePage").css('display','none')
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
                            var table = $("#exchangeCheckTable");
                            var page = $("#exchangePage");
                            var thText = '<tr><th>id</th><th>部门</th><th>提交日期</th><th>工资号</th><th>姓名</th><th>申请类型</th><th>申请表详情</th><th>操作</th></tr>';
                            var extra = '<td><span class="seeInfo">查看详情</span></td><td><span class="pass"></span><span class="reject"></span></td>'
                            var eventFunction = boundCheckEvent;
                            commonAppendToTable(table,page,data,thText,extra,eventFunction)
                            $("#exchangeCheckTable th:first-child,#exchangeCheckTable td:first-child").css('visibility','hidden')
                        }else{
                            $("#alertModal").modal('show')
                            $("#alertModal .text-info").empty().text('暂无换证申请信息')
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
                            $("#alertModal").modal('show')
                            $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
                        }
                    }
                })
            }
        })

        $('a[href="#exchangeApplyGiveOutContent"]').on('shown', function (e){
            $("#exchangePage").css('display','none')
            var changeType = csData['czlb-yxqmhz']['nr3']+'\' OR changeType=\''+ csData['czlb-fyxqmhz']['nr3']
            var table = $('#exchangeGiveOutTable')
            var page = $('#exchangePage')
            appendGiveOut(csData,changeType,table,page)
        })
        $('a[href="#exchangeApplyHistoryContent"]').on('shown', function (e){
            $("#exchangePage").css('display','none')
            var changeType = csData['czlb-yxqmhz']['nr3']+'\' OR changeType=\''+ csData['czlb-fyxqmhz']['nr3']
            var table = $('#exchangeHistoryTable')
            var page = $('#exchangePage')
            appendHistory(csData,changeType,table,page)

        })


        $('a[href="#fixApplyAppendContent"]').on('shown', function (e){

        })
        $('a[href="#fixApplyCheckContent"]').on('shown', function (e) {
            $("#fixPage").css('display','none')
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
                            var table = $("#fixCheckTable");
                            var page = $("#fixPage");
                            var thText = '<tr><th>id</th><th>部门</th><th>提交日期</th><th>工资号</th><th>姓名</th><th>申请类型</th><th>申请表详情</th><th>操作</th></tr>';
                            var extra = '<td><span class="seeInfo">查看详情</span></td><td><span class="pass"></span><span class="reject"></span></td>'
                            var eventFunction = boundCheckEvent;
                            commonAppendToTable(table,page,data,thText,extra,eventFunction)
                            $("#fixCheckTable th:first-child,#fixCheckTable td:first-child").css('visibility','hidden')
                        }else{
                            $("#alertModal").modal('show')
                            $("#alertModal .text-info").empty().text('暂无补证申请信息')
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
                            $("#alertModal").modal('show')
                            $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
                        }
                    }
                })
            }
        })
        $('a[href="#fixApplyGiveOutContent"]').on('shown', function (e){
            $("#fixPage").css('display','none')
            var changeType = csData['czlb-bz']['nr3'];
            var table = $('#fixGiveOutTable')
            var page = $('#fixPage')
            appendGiveOut(csData,changeType,table,page)
        })
        $('a[href="#fixApplyHistoryContent"]').on('shown', function (e){
            $("#fixPage").css('display','none')
            var changeType = csData['czlb-bz']['nr3'];
            var table = $('#fixHistoryTable')
            var page = $('#fixPage')
            appendHistory(csData,changeType,table,page)
        })
        //添加历史记录
        function appendHistory(csData,changeType,table,page){
            var power = sessionGet('power');
            var obj = {};
            obj.column = ' payId,department,uName,lotNumber,grArriveDate';
            obj.order = ' order by lotNumber desc';
            if(power === '1'){
                var department = sessionGet('department').split(',')[1]?sessionGet('department').split(',')[0]:sessionGet('department');
                //添加目前已经发放到车间的信息
                obj.where = ' where (changeType=\''+ changeType +'\') AND checkStatus = \''+csData['checkStatus-shtg']['nr2']+'\' AND finishStatus = \''+csData['finishStatus-ffdgr']['nr2']+'\' AND department like \''+department+'%\'';
                appendHistoryTable(obj,table,page)
            }
            if(power === 'V'){
                obj.where = ' where (changeType=\''+ changeType +'\') AND checkStatus = \''+csData['checkStatus-shtg']['nr2']+'\' AND finishStatus =\''+csData['finishStatus-ffdgr']['nr2']+'\'';
                appendHistoryTable(obj,table,page)
                var html = '<label for="historySelect">选择部门：</label><select name="" id="historySelect"><option>全段</option>';
                for(var i in csData){
                    if(csData[i]['lb'] === 'ssbm'){
                        html += '<option>'+csData[i]['nr1']+'</option>'
                    }
                }
                html+='</select>';
                $(table).prev().empty().append(html);
                $('#historySelect').off('change').on('change',function(){
                    if($(this).val() === '全段'){
                        obj.where = ' where (changeType=\''+ changeType +'\') AND checkStatus = \''+csData['checkStatus-shtg']['nr2']+'\' AND finishStatus =\''+csData['finishStatus-ffdgr']['nr2']+'\'';
                        appendHistoryTable(obj,table,page)
                    }else{
                        var department = $(this).val()
                        obj.where = ' where department like \''+department+'%\' AND (changeType=\''+ changeType +'\') AND checkStatus = \''+csData['checkStatus-shtg']['nr2']+'\' AND finishStatus =\''+csData['finishStatus-ffdgr']['nr2']+'\'';
                        appendHistoryTable(obj,table,page)
                    }
                })
            }
            function appendHistoryTable(obj,table,page){
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
                            var thText = '<tr><th>工资号</th><th>部门</th><th>姓名</th><th>发起日期</th><th>发到日期</th></tr>';
                            var eventFunction = '';
                            var extra = ''
                            commonAppendToTable(table,page,data,thText,extra,eventFunction)
                        }
                        else {
                            $(table).empty().append('<tr><td>暂无发放完成的信息</td></tr>');
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
                            $("#alertModal").modal('show')
                            $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
                        }
                    }
                })
            }
        }
        //添加发放信息
        function appendGiveOut(csData,changeType,table,page){
            var power = sessionGet('power');
            var obj = {};
            obj.column = ' id,payId,department,uName,cjArriveDate,grArriveDate';
            obj.order = ' order by department,payId ';
            if(power === '1'){
                var department = sessionGet('department').split(',')[1]?sessionGet('department').split(',')[0]:sessionGet('department');
                //添加目前已经发放到车间的信息
                obj.where = ' where (changeType=\''+ changeType +'\') AND checkStatus = \''+csData['checkStatus-shtg']['nr2']+'\' AND finishStatus = \''+csData['finishStatus-ffdcj']['nr2']+'\' AND department like \''+department+'%\'';
                appendGiveOutTable(obj,table,page)
            }
            if(power === 'V'){
                obj.where = ' where (changeType=\''+ changeType +'\') AND checkStatus = \''+csData['checkStatus-shtg']['nr2']+'\' AND finishStatus !=\''+csData['finishStatus-ffdcj']['nr2']+'\' AND finishStatus !=\''+csData['finishStatus-ffdgr']['nr2']+'\'';
                appendGiveOutTable(obj,table,page)
                var html = '<label for="giveOutSelect">选择部门：</label><select name="" id="giveOutSelect"><option>全段</option>';
                for(var i in csData){
                    if(csData[i]['lb'] === 'ssbm'){
                        html += '<option>'+csData[i]['nr1']+'</option>'
                    }
                }
                html+='</select>';
                $(table).prev().empty().append(html);
                $('#giveOutSelect').off('change').on('change',function(){
                    if($(this).val() === '全段'){
                        obj.where = ' where (changeType=\''+ changeType +'\') AND checkStatus = \''+csData['checkStatus-shtg']['nr2']+'\' AND finishStatus !=\''+csData['finishStatus-ffdcj']['nr2']+'\' AND finishStatus !=\''+csData['finishStatus-ffdgr']['nr2']+'\'';
                        appendGiveOutTable(obj,table,page)
                    }else{
                        var department = $(this).val()
                        obj.where = ' where department like \''+department+'%\' AND (changeType=\''+ changeType +'\') AND checkStatus = \''+csData['checkStatus-shtg']['nr2']+'\' AND finishStatus !=\''+csData['finishStatus-ffdcj']['nr2']+'\' AND finishStatus !=\''+csData['finishStatus-ffdgr']['nr2']+'\'';
                        appendGiveOutTable(obj,table,page)
                    }
                })
            }

            function appendGiveOutTable(obj,table,page){
                var power = sessionGet('power');
                var text ='';
                if(power === '1'){
                    text = '发放到个人';
                    var extra = '<td><span class="giveOut">'+text+'</span></td>';
                }else if(power ==='V'){
                    text = '发放到车间';
                    var extra = '<td><span class="giveOut">'+text+'</span></td>';
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
                            var thText = '<tr><th>id</th><th>工资号</th><th>部门</th><th>姓名</th><th>发到车间日期</th><th>发到个人日期</th><th>操作</th></tr>';
                            var eventFunction = boundGiveOutEvent;
                            commonAppendToTable(table,page,data,thText,extra,eventFunction)
                            for(var i =0;i<$(".giveOut").length;i++){
                                var _this = $('.giveOut:eq('+i+')');
                                if(checkIfInArray($(_this).parent().prev().prev().prev().prev().text(),straightJYK)){
                                    $(_this).text('发放到个人')
                                }
                            }
                            $(table).find('th:first-child,td:first-child').css('display','none')
                        }
                        else {
                            $(table).empty().append('<tr><td>暂无发放信息</td></tr>');
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
                            $("#alertModal").modal('show')
                            $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
                        }
                    }
                })
                function boundGiveOutEvent(data){
                    var user = sessionGet('user')
                    var setStr ='';
                    var confirmP ='';
                    var arriveDate = new Date();
                    arriveDate.month = arriveDate.getMonth() < 9 ? '0' + (arriveDate.getMonth() + 1) : arriveDate.getMonth() + 1;
                    arriveDate.date = arriveDate.getDate() < 10 ? '0' + arriveDate.getDate() : arriveDate.getDate();
                    arriveDate = arriveDate.getFullYear() + '-' + arriveDate.month + '-' + arriveDate.date;
                    $("#fixGiveOutTable .giveOut,#exchangeGiveOutTable .giveOut").off('click').on('click',function(){
                        var power = sessionGet('power');
                        var _this = $(this);
                        var id = $(this).parent().prev().prev().prev().prev().prev().prev().text();
                        var payId = $(this).parent().prev().prev().prev().prev().prev().text();
                        var thisName = $(this).parent().prev().prev().prev().text().replace(/\s*/g,"");;
                        var where = ''
                        if(power === '1'){
                            where = ' where id=\''+ id+'\'';
                            setStr = ' grArriveDate = \''+ arriveDate +'\',finishStatus = \''+csData['finishStatus-ffdgr']['nr2']+'\' ,cjArriveOperator = \''+user+'\'';
                            confirmP = '请确认'+thisName+'师傅的驾驶证已发放到本人手中';
                        }else if(power === 'V' && $(this).text() === '发放到车间'){
                            where = ' where id=\''+ id+'\'';
                            setStr = ' cjArriveDate = \''+ arriveDate +'\',finishStatus = \''+csData['finishStatus-ffdcj']['nr2']+'\' ,jykArriveOperator = \''+user+'\'';
                            confirmP = '请确认'+thisName+'师傅的驾驶证已发放到其所属车间';
                        }else if(power === 'V' && $(this).text() === '发放到个人'){
                            where = ' where id=\''+ id+'\'';
                            setStr = ' grArriveDate = \''+ arriveDate +'\',finishStatus = \''+csData['finishStatus-ffdgr']['nr2']+'\' ,jykArriveOperator = \''+user+'\'';
                            confirmP = '请确认'+thisName+'师傅的驾驶证已发放到其本人';
                        }
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
                                    where:where
                                },
                                dataType: 'json',
                                success: function (data) {
                                    if(power==='1' || (power==='V' && $(_this).text() === '发放到个人')){
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
                                                //通知状态改为尚未通知 锚点1
                                                if(changeType === csData['czlb-yxqmhz']['nr3']){
                                                    var set = ' status = \''+csData['zjzt-zc']['nr2']+'\',deadline = cast(substring(deadline,0,5) + 6 AS varchar(4)) + substring(deadline,5,11),startDate = cast(substring(startDate,0,5) + 6 AS varchar(4)) + substring(startDate,5,11)'
                                                }else{
                                                    var set = ' status = \''+csData['zjzt-zc']['nr2']+'\''
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
                                                console.log(testData)
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
                                                }
                                                else if(csData['zjlx-'+testData['row']['driveCode']]['nr2'] < csData['zjlx-'+testData['row']['applyDriveCode']]['nr2']){
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
                                                }
                                                else{

                                                }
                                            }
                                        });
                                        $(_this).parent().prev().text(arriveDate)
                                        $(_this).remove();
                                    }
                                    else if(power==='V' && $(_this).text() === '发放到车间'){
                                        tzEvent(csData,csData['finishStatus-ffdgr']['nr2'],payId)
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
                                        $("#alertModal").modal('show')
                                        $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
                                    }
                                }
                            })
                        }
                    })
                }
            }
        }
        //审核申请的按钮事件
        function boundCheckEvent(){
            var power = sessionGet('power')
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
                    id = $(this).parent().prev().prev().prev().prev().prev().prev().prev().text();
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
                            $("#alertModal").modal('show')
                            $("#alertModal .text-success").empty().text('操作成功，您已通过了'+uname+'师傅的'+changeType+'申请')
                            $(_this).next('span').remove();
                            $(_this).remove();
                        }
                    });
                }
            }
            function rejectApply(){
                var failedReason ='';
                var shortage ;
                var _thisReject = $(this);
                var changeType = $(this).parent().prev().prev().text();
                $('#rejectModal').modal('show')
                $('#rejectModal input').prop('checked',false);
                $('#rejectModal .control-group').empty()
                var html ='';
                if(changeType === csData['czlb-bz']['nr3']){
                    for(var i in csData){
                        if(csData[i]['lb'] === 'bzsxcl'){
                            html += '<label class="checkbox"><input type="checkbox" value="'+ csData[i]['nr2']+'">缺少'+ csData[i]['nr2'] +'</label>';
                        }
                    }
                }
                else if(changeType === csData['czlb-yxqmhz']['nr3'] || changeType === csData['czlb-fyxqmhz']['nr3']){
                    for(var i in csData){
                        if(csData[i]['lb'] === 'hzsxcl'){
                            html += '<label class="checkbox"><input type="checkbox" value="'+ csData[i]['nr2']+'">缺少'+ csData[i]['nr2'] +'</label>';
                        }
                    }
                }
                $("#short").off('click').on('click',function(){
                    $('#rejectModal .control-group').empty().append(html);
                });
                $("#wrong").off('click').on('click',function(){
                    $('#rejectModal .control-group').empty()
                });
                $("#rejectModal .btn-primary").off('click').on('click',function(){
                    var short = document.getElementById('short').checked;
                    var wrong = document.getElementById('wrong').checked;
                    if(short && $("#rejectModal .control-group input:checked").length===0){
                        $("#alertModal").modal('show')
                        $("#alertModal .text-warning").empty().text('请选择缺少的材料')
                        return false;
                    }
                    else if(short && $("#rejectModal .control-group input:checked").length>0){
                        shortage ='';
                        for(var i =0;i<$("#rejectModal .control-group input:checked").length;i++){
                            shortage +=$("#rejectModal .control-group input:checked:eq("+i+")").val();
                            shortage+=','
                        }
                        shortage = shortage.substring(0,shortage.length-1);
                        failedReason = '材料不齐全';
                    }
                    else if(wrong){
                        failedReason = '信息有误';
                        shortage ='';
                    }
                    if(confirm('请认真核对该申请表信息。操作无法撤回。\u000d确定要驳回该申请请选“确定”。返回请选“取消”')){
                        id = $(_thisReject).parent().prev().prev().prev().prev().prev().prev().prev().text();
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
                                $("#alertModal").modal('show')
                                $("#alertModal .text-success").empty().text('操作成功，您已驳回了'+uname+'师傅的'+changeType+'申请')
                                $(_thisReject).prev('span').remove();
                                $(_thisReject).remove();
                                $("#rejectModal").modal('hide')
                                var status = '';
                                if(changeType === csData['czlb-yxqmhz']['nr3']){
                                    status = csData['zjzt-yj']['nr2'];
                                }else if(changeType === csData['czlb-fyxqmhz']['nr3']){
                                    status = csData['zjzt-zc']['nr2'];
                                }else if(changeType === csData['czlb-bz']['nr3']){

                                }
                                if(status !== ''){
                                    $.ajax({
                                        url: "../../../ways.php",
                                        type: "POST",
                                        timeout: 8000,
                                        data: {
                                            funcName: 'update', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                                            tableName: ' jbxx', setStr: ' status =\''+ status +'\' ', where: ' where payId =\''+payId+'\''
                                        },
                                        dataType: 'json',
                                        success: function () {

                                        }
                                    });
                                }

                            }
                        });
                    }
                });
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
                            $("#alertModal").modal('show')
                            $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
                        }
                    }
                })
            }
        }
    }
    //添加预警信息
    function appendAlert(csData){
        var power = sessionGet('power');
        if(power === '1'){
            var department = sessionGet('department').split(',')[0];
            $("#buttonList .alertButton .redPoint").css('display','block')
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
                    tableName: ' jbxx ', column: ' department,payId,uName,deadline,status', where: ' where payId !=\'\' AND department like \''+department+'%\' AND DATEDIFF(day,getdate(),deadline) < '+csData['yjsj-cjyjsj']['nr2']+' AND deadline !=\'\'', order: ' order by DATEDIFF(day,getdate(),deadline)'
                },
                dataType: 'json',
                success: function (data) {
                    if(data['success'] === 1){
                        $.ajax({
                            url: "../../../ways.php",
                            type: "POST",
                            data: {
                                funcName: 'select', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'JSZGL',
                                tableName: ' bgxx ', column: ' id,lotNumber,payId,uName,tzDone', where: ' where payId !=\'\' AND department like \''+department+'%\' AND changeType=\''+ csData['czlb-yxqmhz']['nr3'] + '\' AND (checkStatus =\''+csData['checkStatus-cjshz']['nr2']+'\' OR checkStatus =\''+csData['checkStatus-jykshz']['nr2']+'\')'
                            },
                            dataType: 'json',
                            success: function (bgData) {
                                if(data['success'] === 1){
                                    var alertCount = data['count'];
                                    $("#alertBanner .p2").empty().append('驾驶证预警人员共'+alertCount+'人：');
                                    //处理数据，加入两个属性“是否正在换证”、‘审核状态’
                                    var today = new Date();
                                    today.month = today.getMonth() < 9 ? '0' + (today.getMonth() + 1) : today.getMonth() + 1;
                                    today.date = today.getDate() < 10 ? '0' + today.getDate() : today.getDate();
                                    today = today.getFullYear() + '-' + today.month + '-' + today.date;
                                    today = new Date(today)
                                    var deadline='';
                                    for(var m in data){
                                        data[m]['status'] = '<span class="sq">现在申请</span>';
                                        data[m]['tzDone'] = '<span class="tz">短信通知</span>';
                                        data[m]['id'] = 0;
                                        for(var n in bgData){
                                            if(data[m]['payId'] === bgData[n]['payId']){
                                                data[m]['status'] = bgData[n]['lotNumber'];
                                                if(bgData[n]['tzDone'] !== csData['tzDone-swtz']['nr2']){
                                                    data[m]['tzDone'] = bgData[n]['tzDone'];
                                                }
                                                data[m]['id'] = bgData[n]['id'];
                                            }
                                        }
                                        deadline = new Date(data[m]['deadline']);
                                        data[m]['deadline'] = (deadline - today)/(1000*60*60*24);
                                    }
                                    var table = $("#alertTable");
                                    var page = $("#alertPage");
                                    var thText = '<tr><th>所属车间</th><th>工资号</th><th>姓名</th><th>距到期剩余天数</th><th>是否已申请换证</th><th>通知</th><th style="display:none">id</th></tr>';
                                    var eventFunction = boundAlertEvent;
                                    var extra = '';
                                    commonAppendToTable(table,page,data,thText,extra,eventFunction)


                                }
                                else{
                                    $("#alertTable").empty();
                                    $("#alertBanner .p2").text('驾驶证预警人员共0人');
                                    $("#alertPage").css('display','none')
                                }
                            }
                        })

                    }else{
                        $("#buttonList .alertButton .redPoint").css('display','none')
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
                    tableName: ' jbxx ', column: ' department,payId,uName,deadline,status', where: ' where payId !=\'\' AND DATEDIFF(day,getdate(),deadline) < '+csData['yjsj-cjyjsj']['nr2']+' AND deadline !=\'\'', order: ' order by DATEDIFF(day,getdate(),deadline)'
                },
                dataType: 'json',
                success: function (data) {
                    if(data['success'] === 1){
                        $("#buttonList .alertButton .redPoint").css('display','block')
                        $.ajax({
                            url: "../../../ways.php",
                            type: "POST",
                            data: {
                                funcName: 'select', serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'JSZGL',
                                tableName: ' bgxx ', column: ' id,lotNumber,payId,uName,tzDone', where: ' where changeType=\''+ csData['czlb-yxqmhz']['nr3'] + '\' AND (checkStatus =\''+csData['checkStatus-cjshz']['nr2']+'\' OR checkStatus =\''+csData['checkStatus-jykshz']['nr2']+'\')'
                            },
                            dataType: 'json',
                            success: function (bgData) {
                                if(data['success'] === 1){
                                    var alertCount = data['count'];
                                    $("#alertBanner .p2").empty().append('驾驶证预警人员共'+alertCount+'人：');
                                    //处理数据，加入两个属性“是否正在换证”、‘审核状态’
                                    var today = new Date();
                                    today.month = today.getMonth() < 9 ? '0' + (today.getMonth() + 1) : today.getMonth() + 1;
                                    today.date = today.getDate() < 10 ? '0' + today.getDate() : today.getDate();
                                    today = today.getFullYear() + '-' + today.month + '-' + today.date;
                                    today = new Date(today)
                                    var deadline='';
                                    for(var m in data){
                                        data[m]['status'] = '否';
                                        data[m]['tzDone'] = '<span class="tz">短信通知</span>';
                                        data[m]['id'] = 0;
                                        for(var n in bgData){
                                            if(data[m]['payId'] === bgData[n]['payId']){
                                                data[m]['status'] = bgData[n]['lotNumber'];
                                                if(bgData[n]['tzDone'] !== csData['tzDone-swtz']['nr2']){
                                                    data[m]['tzDone'] = bgData[n]['tzDone'];
                                                }
                                                data[m]['id'] = bgData[n]['id'];
                                            }
                                        }
                                        deadline = new Date(data[m]['deadline']);
                                        data[m]['deadline'] = (deadline - today)/(1000*60*60*24);
                                    }
                                    var table = $("#alertTable");
                                    var page = $("#alertPage");
                                    var thText = '<tr><th>所属车间</th><th>工资号</th><th>姓名</th><th>距到期剩余天数</th><th>是否已申请换证</th><th>通知</th><th style="display:none">id</th></tr>';
                                    var eventFunction = boundAlertEvent;
                                    var extra = '';
                                    commonAppendToTable(table,page,data,thText,extra,eventFunction)
                                }
                                else{
                                    $("#alertTable").empty();
                                    $("#alertBanner .p2").text('驾驶证预警人员共0人');
                                    $("#alertPage").css('display','none')
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
        function boundAlertEvent(){
            $('#alertTable .tz').off('click').on('click',function(){
                if(confirm('将通知'+ $(this).parent().siblings('td:nth-child(3)').text().replace(/\s*/g,"")+'师傅到车间申请换证，确定?')){
                    tzEvent(csData,csData['zjzt-yj']['nr2'],$(this).parent().siblings('td:nth-child(2)').text(),$(this),$(this).parent().siblings('td:last-child').text())
                }
            })
            $("#alertTable .sq").off('click').on('click',function(){
                //这里待添加一部分代码，用来让车间管理人员可以替乘务员申请换证
                //写个webservice，把需要改成事务的嵌套ajax全调用事务  待办1
            })
        }
    }
    //短信
    function tzEvent(csData,type,payId,button,id){
        //id是传过来的bgxx表标识,用来唯一确定数据
        var phone = 18538832516;
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
                        //var phone = data['row']['phone1'];
                        var uName = data['row']['uname'].replace(/\s*/g,"");
                        var text = uName+ csData['dxnr-yj']['nr1']+csData['dxnr-yj']['nr2']+csData['dxnr-yj']['nr3']+csData['dxnr-yj']['nr4']+csData['dxnr-yj']['nr5']+csData['dxnr-yj']['nr6'];
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
                                var setStr = ' tzDone = convert(varchar(20),GETDATE(),120)';
                                var where = ' where id=\''+id+'\'';
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

                                    }
                                });
                                $("#alertModal").modal('show')
                                $("#alertModal .text-success").empty().text('已发送短信提醒'+data['row']['uname']+'师傅补全换证所需材料')
                                button.removeClass('tz').text('已经通知').off('click')
                            }
                        })
                    }
                }
            })
        }else if(type === csData['finishStatus-ffdgr']['nr2']){
            //教育科发到车间后，告知乘务员
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
                        var uName = data['row']['uname'].replace(/\s*/g,"");
                        var text = uName+csData['dxnr-ffdgr']['nr1']+csData['dxnr-ffdgr']['nr2']+csData['dxnr-ffdgr']['nr3']+csData['dxnr-ffdgr']['nr4']+csData['dxnr-ffdgr']['nr5']+csData['dxnr-ffdgr']['nr6'];
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
                        //var phone = data['row']['phone1'];
                        var uName = data['row']['uname'].replace(/\s*/g,"");
                        var text = uName+ csData['dxnr-txqz']['nr1']+ csData['dxnr-txqz']['nr2']+ csData['dxnr-txqz']['nr3']+ csData['dxnr-txqz']['nr4']+ csData['dxnr-txqz']['nr5']+ csData['dxnr-txqz']['nr6'];
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
                        //var phone = data['row']['phone1'];
                        var uName = data['row']['uname'].replace(/\s*/g,"");
                        var text = uName+ csData['dxnr-bz']['nr1']+ csData['dxnr-bz']['nr2']+ csData['dxnr-bz']['nr3']+ csData['dxnr-bz']['nr4']+ csData['dxnr-bz']['nr5']+ csData['dxnr-bz']['nr6'];
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
                        //var phone = data['row']['phone1'];
                        var uName = data['row']['uname'].replace(/\s*/g,"");
                        var text = uName+ csData['dxnr-hz']['nr1']+ csData['dxnr-hz']['nr2']+ csData['dxnr-hz']['nr3']+ csData['dxnr-hz']['nr4']+ csData['dxnr-hz']['nr5']+ csData['dxnr-hz']['nr6'];
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
                        var uName = data['row']['uname'].replace(/\s*/g,"");
                        var text = uName+ csData['dxnr-dr']['nr1']+ csData['dxnr-dr']['nr2']+ csData['dxnr-dr']['nr3']+ csData['dxnr-dr']['nr4']+ csData['dxnr-dr']['nr5']+ csData['dxnr-dr']['nr6'];
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
                            var table = $("#dataTable");
                            var page = $("#dataPage");
                            var thText = '<tr><th>部门</th><th>日期</th><th>审核状态</th><th>工资号</th><th>姓名</th><th>申请类型</th><th>申请原因</th><th>驳回原因</th><th>缺少材料</th><th>车间经办人</th><th>车间审核日期</th><th>教育科经办人</th><th>教育科审核日期</th></tr>';
                            var eventFunction = '';
                            var extra = '';
                            commonAppendToTable(table,page,data,thText,extra,eventFunction)
                        }else{
                            $("#alertModal").modal('show')
                            $("#alertModal .text-warning").empty().text('暂无审核记录')
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
                            $("#alertModal").modal('show')
                            $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
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
                            var table = $("#dataTable");
                            var page = $("#dataPage");
                            var thText = '<tr><th>部门</th><th>日期</th><th>工资号</th><th>姓名</th><th>车间发放人</th><th>车间发放日期</th><th>教育科发放人</th><th>教育科发放日期</th></tr>';
                            var eventFunction = '';
                            var extra = '';
                            commonAppendToTable(table,page,data,thText,extra,eventFunction)
                        }else{
                            $("#alertModal").modal('show')
                            $("#alertModal .text-warning").empty().text('暂无发放记录')
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
                            $("#alertModal").modal('show')
                            $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
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
                        tableName:' bgxx ',column:' id,department,lotNumber,archivesId,UName,changeType,changeReason,jykOperator',order:' order by lotnumber,payid'},
                    dataType:'json',
                    success:function(data){
                        if(data['success'] === 1){
                            var table = $("#dataTable");
                            var page = $("#dataPage");
                            var thText = '<tr><th>id</th><th>部门</th><th>日期</th><th>档案号</th><th>姓名</th><th>操作类别</th><th>注销原因</th><th>教育科经办人</th><th>操作</th></tr>';
                            var eventFunction = boundBackEvent;
                            var extra = '<td><span class="back">撤回</span></td>';
                            commonAppendToTable(table,page,data,thText,extra,eventFunction)
                            $("#dataTable th:first-child,#dataTable td:first-child").css('visibility','hidden')
                        }else{
                            $("#alertModal").modal('show')
                            $("#alertModal .text-warning").empty().text('暂无注销记录')
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
                            $("#alertModal").modal('show')
                            $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
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
                        tableName:' bgxx ',column:' id,department,lotNumber,archivesId,UName,changeType,jykOperator',order:' order by lotnumber,payid'},
                    dataType:'json',
                    success:function(data){
                        if(data['success'] === 1){
                            var table = $("#dataTable");
                            var page = $("#dataPage");
                            var thText = '<tr><th>id</th><th>部门</th><th>日期</th><th>档案号</th><th>姓名</th><th>操作类别</th><th>教育科经办人</th><th>操作</th></tr>';
                            var eventFunction = boundBackEvent;
                            var extra = '<td><span class="back">撤回</span></td>';
                            commonAppendToTable(table,page,data,thText,extra,eventFunction)
                            $("#dataTable th:first-child,#dataTable td:first-child").css('visibility','hidden')
                        }else{
                            $("#alertModal").modal('show')
                            $("#alertModal .text-warning").empty().text('暂无调出记录')
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
                            $("#alertModal").modal('show')
                            $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
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
                            var table = $("#dataTable");
                            var page = $("#dataPage");
                            var thText = '<tr><th>部门</th><th>日期</th><th>工资号</th><th>姓名</th><th>操作类别</th><th>准驾代码</th><th>准驾类型</th><th>教育科经办人</th></tr>';
                            var eventFunction = '';
                            var extra = '';
                            commonAppendToTable(table,page,data,thText,extra,eventFunction)
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
    //撤回事件
    function boundBackEvent(){
        $(".back").off('click').on('click',function(){
            var _this = $(this);
            var id = $(this).parent().siblings('td:first-child').text();
            var archivesId = $(this).parent().siblings('td:nth-child(2)').text();
            var type = $(this).parent().siblings('td:nth-child(6)').text();
            if(confirm('该操作将把该驾驶证恢复到正常状态，是否确定？')){
                //撤回操作共需三步：更新bgxx表；取jbxx表中数据，在dbsx中新增一条；更新jbxx和tjxx
                var where =' where id =\''+ id+'\'';
                var setStr = '';
                var text ='';               //text用于update:tjxx表
                switch (type){
                    case csData['czlb-dc']['nr3']:
                        text = csData['czlb-dc']['name']
                        setStr = 'changeType =\''+csData['czlb-chdc']['nr3']+'\'';
                        break;
                    case csData['czlb-zx']['nr3']:
                        text = _this.parent().siblings('td:nth-child(7)').text();
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
                        where: where,
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
                                console.log(data)
                                var payId = data['row1']['payId'];
                                var archivesId = data['row1']['archivesId'];
                                var birthDate = data['row1']['birthDate'];
                                var cardId = data['row1']['cardId'];
                                var department = data['row1']['department'].split(',')[1]?data['row1']['department'].split(',')[0]:data['row1']['department'];
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
                                                $("#alertModal").modal('show')
                                                $("#alertModal .text-success").empty().text('撤回成功，'+uName+'师傅的驾驶证目前是'+csData['zjzt-zc']['nr2']+'状态')
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

    //添加新增证件功能(人员提升标签)
    function appendAppend(csData){
        function boundAppendEvent(data,csData){
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

                                                var table = $("#checkWithPCTable");
                                                var page = $("#checkWithPCPage");
                                                var extra = '';
                                                var thText = '<tr><th>批次</th><th>档案号</th><th>姓名</th><th>部门</th><th>通过时间</th><th>状态</th></tr>';
                                                var eventFunction = '';
                                                commonAppendToTable(table,page,big,thText,extra,eventFunction)
                                            }
                                        })
                                    }
                                })
                            }else{
                                $("#alertModal").modal('show')
                                $("#alertModal .text-error").empty().text('请选择批次')
                            }
                        })
                    }
                })
            })

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
                            $("#alertModal").modal('show')
                            $("#alertModal .text-error").empty().text('第'+$(val).find('.number').val()+'条身份证号错误')
                            flag = false;
                            return false;
                        }
                        if($(val).find('.phone').val().match((/^[0-9]{11}$/))){
                            obj.phone = $(val).find('.phone').val()
                        }else{
                            $(val).find('td').css('background','#ffcccc')
                            $("#alertModal").modal('show')
                            $("#alertModal .text-error").empty().text('第'+$(val).find('.number').val()+'条电话号码错误')
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

                    testUploadArr(uploadArr,csData);
                    function testUploadArr(uploadArr,csData){
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
                                                        $("#alertModal").modal('show')
                                                        $("#alertModal .text-error").empty().text('档案号输入错误')
                                                    }
                                                }else{
                                                    $("#alertModal").modal('show')
                                                    $("#alertModal .text-error").empty().text('档案号输入错误')
                                                }
                                            }
                                        })
                                    }else{
                                        $("#alertModal").modal('show')
                                        $("#alertModal .text-error").empty().text('档案号格式错误')
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
                                            $("#alertModal").modal('show')
                                            $("#alertModal .text-error").empty().text('没有全部上传成功。出错条目：'+uploadArr[i]['uName']+'\u000d请更正Excel后重新上传')
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
                                                            column: ' (payId,archivesId,uname,department,cardId,type,birthDate,txrq,sjDriveCode,phone,sex,PC)',
                                                            values: '(\''+payId+'\',\'' + archivesId + '\',\'' + uName + '\',\'' + department + '\',\'' + cardId + '\',\'' + type + '\',\'' +birthDate+'\',\'' + txrq + '\',\'' + sjDriveCode + '\',\''+ phone + '\',\''+ sex + '\',\''+ PC +'\')'
                                                        },
                                                        dataType: 'json',
                                                        success: function (ret) {
                                                            if(ret['success'] === 1){
                                                                $(".progressBar .total").html(uploadArr.length)
                                                                done+=1;
                                                                $(".progressBar .done").html(done)
                                                                if(done === uploadArr.length){
                                                                    $("#alertModal").modal('show')
                                                                    $("#alertModal .text-success").empty().text('上传成功')
                                                                    window.location.reload();
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
                                                                $("#alertModal").modal('show')
                                                                $("#alertModal .text-success").empty().text('上传成功')
                                                                window.location.reload();
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
                        $("#alertModal").modal('show')
                        $("#alertModal .text-info").empty().text('请检查信息是否有误，确认无误后请点击表格末尾的“上传”按钮')
                        $('.confirmUpload').css('display','inline-block')
                    };
                    reader.readAsBinaryString(f);
                }
            }
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
            //铁路局返回名单上传
            function handleFile2(e) {
                var files = e.target.files;
                var i,f;
                for (i = 0, f = files[i]; i != files.length; ++i) {
                    var reader = new FileReader();
                    var name = f.name;
                    reader.onload = function(e){
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
                            if(/^[A-Z]1$/.test(headlist[0])){
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
                        for(var i=4;i<Number(rowNum)-1;i++){
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
                            }else if(row-2>=0){
                                dataItem[row-2][code]=headlist[1];
                            }
                        })
                        var arr =[];
                        $.each(dataItem,function (i,data) {
                            var obj = {};
                            $.each(data,function (j,val) {
                                switch (j){
                                    //按照总公司返回的《XXX等N名取得铁路机车车辆驾驶资格人员名单》（文件名一般是PO+时间戳），把每一列和类名意义对应
                                    case 'A':obj.number = val;
                                        break;
                                    case 'B':obj.uName = val;
                                        break;
                                    case 'C':obj.sex = val;
                                        break;
                                    case 'D':obj.cardId = val;
                                        break;
                                    case 'E':obj.unit = val;
                                        break;
                                    case 'F':obj.sjDriveCode = val;
                                        break;
                                    case 'G':obj.startDate = val;
                                        break;
                                    case 'H':obj.deadline = val;
                                        break;
                                }
                            })
                            arr.push(Object.assign(obj));
                        })
                        var unit = '洛阳机务段';        //单位名
                        var realArr = [];       //取出的本段人名单
                        $.each(arr,function(m,val){
                            if(arr[m]['unit'] && arr[m]['unit'].indexOf(unit)>-1){
                                realArr.push(arr[m])
                            }else{
                                delete arr[m]
                            }
                        })
                        //提升操作
                        var tempArr = [];               //临时
                        var ajaxArr = [];               //即将发请求的数组
                        checkRealArr(realArr);
                        function checkRealArr(realArr){
                            $('#appendSubmit table tbody').empty()
                            var count = 0;      //计数，跟ajaxArr的长度比对，若少，说明用户没选择完毕
                            $.each(realArr,function(m,val){
                                //大致思路。用姓名和sjdrivecode去dbsx中匹配，如果有结果并只有一条（理想情况）
                                //就直接新增jbxx和bgxx，删除dbsx
                                //如果有结果并大于一条，说明重名且报的机型也一样，需要人工确认
                                //显示一个模态框，打印出来这几个人的信息，让用户选择。
                                //如果没有结果，应该是返回excel的名字打错或准驾机型错，做模糊匹配
                                //在这里直接把姓名中的字母和数字去掉
                                var person = {};
                                person.sjDriveCode =val['sjDriveCode'];
                                person.uName = val['uName'].replace(/[0-9a-zA-Z]/ig,"");
                                person.startDate = dotTo(val['startDate']);
                                person.deadline = dotTo(val['deadline']);
                                person.sex  = val['sex'];
                                var where = ' where uName =\''+person.uName+'\' AND sjDriveCode=\''+person.sjDriveCode+'\''
                                var column =' * ';
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
                                        column: column,
                                        where: where,
                                        order: ' '
                                    },
                                    dataType: 'json',
                                    success: function (data){
                                        person.sjDriveType = csData['zjlx-'+person.sjDriveCode]['nr1'];
                                        person.status = csData['zjzt-zc']['nr2'];
                                        person.phyTest = csData['tjjl-hg']['nr2'];
                                        person.tzDone = csData['tzDone-swtz']['nr2'];
                                        person.sjDate = person.startDate;
                                        var html = '';
                                        $("#appendSubmit").modal('show')
                                        if(data['success'] === 1 && data['count'] === 1){
                                            //理想情况，找到并只有一个
                                            person.payId = data['row1']['payId'];
                                            person.archivesId = data['row1']['archivesId'];
                                            person.birthDate = data['row1']['birthDate'];
                                            person.cardId = data['row1']['cardId'];
                                            person.department = data['row1']['Department'];
                                            person.txrq = data['row1']['txrq'];
                                            person.PC = data['row1']['PC'];
                                            count += 1;
                                            ajaxArr.push(Object.assign(person))
                                            html = '<tr><td>'+val['uName']+'</td><td>'+val['sjDriveCode']+'</td></tr>';
                                            $('#appendSubmitTableLeft1').css('visibility','visible')
                                            $('#appendSubmitTableLeft1 tbody').append(html);
                                            html = '<tr><td>'+person.archivesId+'</td><td>'+person.department+'</td><td>'+person.uName+'</td><td>'+person.sjDriveCode+'</td><td>'+person.PC+'</td></tr>';
                                            $('#appendSubmitTableRight1').css('visibility','visible');
                                            $('#appendSubmitTableRight1 tbody').append(html);
                                            html = '&nbsp;&nbsp;从文件中提取到以下人员：';
                                            $('#appendSubmitP1').empty().append(html)
                                        }
                                        else if(data['success'] === 1 && data['count']>1){
                                            //找到并很多，说明有重名,显示一个模态框让用户选择
                                            //提升成功依然加入成功数组
                                            delete data['success'];
                                            delete data['count'];
                                            var p = '&nbsp;&nbsp;有重名信息，请在右边选择要提升的人员：';
                                            var text = '';
                                            count += 1;
                                            html += '<tr><td>'+val['uName']+'</td><td>'+val['sjDriveCode']+'</td></tr>';
                                            for(var i in data){
                                                text += '<tr>';
                                                text += '<td><label class="radio"><input type="radio" name=\'group'+ m +'\' value=\''+ i +'\'></label></td>'
                                                text += '<td>'+ data[i]['archivesId']+'</td>';
                                                text += '<td>'+ data[i]['Department']+'</td>';
                                                text += '<td>'+ data[i]['UName']+'</td>';
                                                text += '<td>'+ data[i]['sjDriveCode']+'</td>';
                                                text += '<td>'+ data[i]['PC']+'</td>';
                                                text += '</tr>';
                                                person.payId = data[i]['payId'];
                                                person.archivesId = data[i]['archivesId'];
                                                person.birthDate = data[i]['birthDate'];
                                                person.cardId = data[i]['cardId'];
                                                person.department = data[i]['Department'];
                                                person.txrq = data[i]['txrq'];
                                                person.PC = data[i]['PC'];
                                                tempArr.push(Object.assign({},person))
                                            }
                                            $("#appendSubmitP2").empty().append(p)
                                            $('#appendSubmitTableLeft2').css('visibility','visible')
                                            $('#appendSubmitTableLeft2 tbody').append(html);
                                            $('#appendSubmitTableRight2').css('visibility','visible');
                                            $('#appendSubmitTableRight2 tbody').append(text);
                                        }
                                        else if(data['success'] === 0){
                                            //没找到，错名或错机型
                                            //模糊匹配,选取姓名开头或结尾相同的，暂不限制机型
                                            var uNameStart = val['uName'][0];
                                            var uNameOver = val['uName'][val['uName'].length-1];
                                            count += 1;
                                            where = ' where uName like\''+ uNameStart +'%\' OR uName like \'%'+ uNameOver +'\''
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
                                                    column: column,
                                                    where: where,
                                                    order: ' '
                                                },
                                                dataType: 'json',
                                                success: function (data){
                                                    if(data['success'] === 1){
                                                        delete data['success'];
                                                        delete data['count'];
                                                        var p = '&nbsp;&nbsp;有查无结果的信息，请在右边选择可能的人员进行提升：';
                                                        var text = '';
                                                        html += '<tr><td>'+val['uName']+'</td><td>'+val['sjDriveCode']+'</td></tr>';
                                                        for(var i in data){
                                                            text += '<tr>';
                                                            text += '<td><label class="radio"><input type="radio" name=\'group'+ m +'\' value=\''+ i +'\'></label></td>'
                                                            text += '<td>'+ data[i]['archivesId']+'</td>';
                                                            text += '<td>'+ data[i]['Department']+'</td>';
                                                            text += '<td>'+ data[i]['UName']+'</td>';
                                                            text += '<td>'+ data[i]['sjDriveCode']+'</td>';
                                                            text += '<td>'+ data[i]['PC']+'</td>';
                                                            text += '</tr>';
                                                            person.uName = data[i]['UName'];
                                                            person.payId = data[i]['payId'];
                                                            person.archivesId = data[i]['archivesId'];
                                                            person.birthDate = data[i]['birthDate'];
                                                            person.cardId = data[i]['cardId'];
                                                            person.department = data[i]['Department'];
                                                            person.txrq = data[i]['txrq'];
                                                            person.PC = data[i]['PC'];
                                                            tempArr.push(Object.assign({},person))
                                                        }
                                                        $("#appendSubmitLeftP3").empty().append(p)
                                                        $('#appendSubmitTableLeft3').css('visibility','visible')
                                                        $('#appendSubmitTableLeft3 tbody').append(html);
                                                        $('#appendSubmitTableRight3').css('visibility','visible');
                                                        $('#appendSubmitTableRight3 tbody').append(text);
                                                    }else{
                                                        $("#alertModal").modal('show')
                                                        $("#alertModal .text-error").empty().text('文件中姓名为'+ val['uName'] + '的信息查无此人，请对照批次记录，更正Excel并保存后再上传')
                                                        $('#appendSubmit').modal('hide')
                                                    }
                                                }
                                            })
                                        }
                                        $("#appendSubmit .btn-primary").off('click').on('click',function(){
                                            //思路：点提交，先校验用户有没有完整勾选人员，通过数组长度和count比对
                                            //把要提升的人员信息加一个标志位，不能直接移出数组
                                            var checkedArr = $('#appendSubmit table input[type="radio"]:checked')
                                            if(count === ajaxArr.length+checkedArr.length){
                                                for(var i=0;i<checkedArr.length;i++){
                                                    for(var j in tempArr){
                                                        if(tempArr[j]['archivesId'] === $(checkedArr[i]).parent().parent().next('td').text()){
                                                            ajaxArr.push(tempArr[j])
                                                        }
                                                    }
                                                }
                                                var successArr =[];             //成功后展示的数组
                                                $("#appendSubmit").modal('hide')
                                                for(var m in ajaxArr){
                                                    tsAppendAjax(ajaxArr[m],successArr)
                                                }
                                                displaySuccess(successArr)
                                            }else{
                                                $("#alertModal").modal('show')
                                                $("#alertModal .text-info").empty().text('请完整勾选')
                                            }
                                        })
                                    }
                                })
                            })
                        }

                        function tsAppendAjax(person,successArr){
                            $.ajax({
                                url: "../../../ways.php",
                                async:false,
                                type:"POST",
                                timeout:8000,
                                //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                                data:{funcName:'select',where:' where archivesId =\''+person.archivesId+'\'',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                                    tableName:' jbxx ',column:' archivesId',order:' '},
                                dataType:'json',
                                success:function(data){
                                    var date = new Date();
                                    var year = date.getFullYear()
                                    var lotNumber = new Date();
                                    lotNumber.month = lotNumber.getMonth() < 9 ? '0' + (lotNumber.getMonth() + 1) : lotNumber.getMonth() + 1;
                                    lotNumber.date = lotNumber.getDate() < 10 ? '0' + lotNumber.getDate() : lotNumber.getDate();
                                    lotNumber = lotNumber.getFullYear() + '-' + lotNumber.month + '-' + lotNumber.date;
                                    if(data['success'] === 0){
                                        //insert jbxx
                                        $.ajax({
                                            url: "../../../ways.php",
                                            type: "POST",
                                            async:false,
                                            timeout: 8000,
                                            data: {
                                                funcName: 'insert',
                                                serverName: '10.101.62.73',
                                                uid: 'sa',
                                                pwd: '2huj15h1',
                                                Database: 'jszgl',
                                                tableName: ' jbxx',
                                                column: ' (payId,archivesId,UName,sex,department,birthDate,txrq,cardId,sjDate,' +
                                                'startdate,deadline,sjDriveCode,sjDriveType,status,tzdone,phyTest,PC)',
                                                values: '(\''+person.payId+'\',\'' + person.archivesId + '\',\'' + person.uName + '\',\'' + person.sex + '\',\'' + person.department + '\',\'' + person.birthDate + '\',\'' + person.txrq + '\',\'' + person.cardId + '\',\''
                                                + person.sjDate + '\',\'' + person.startDate + '\',\'' + person.deadline + '\',\'' + person.sjDriveCode + '\',\'' + person.sjDriveType + '\',\'' + person.status + '\',\''+person.tzDone+'\',\''+person.phyTest+'\',\''+person.PC+'\')'
                                            },
                                            dataType: 'json',
                                            success: function (){
                                                var successObj ={};
                                                successObj.uName =person.uName;
                                                successObj.archivesId = person.archivesId;
                                                successObj.department = person.department;
                                                successArr.push(Object.assign({},successObj))
                                                //insert bgxx
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
                                                        column: ' (lotNumber,Department,payId,archivesId,UName,changeType,checkStatus,' +
                                                        'driveCode,drive,jykOperator,pc)',
                                                        values: '(\'' + lotNumber + '\',\'' + person.department + '\',\'' + person.payId + '\',\'' + person.archivesId + '\',\'' + person.uName + '\',\'' + csData['czlb-levelup2']['nr2'] + '\',\'' + csData['checkStatus-shtg']['nr2'] +
                                                        '\',\'' + person.sjDriveCode +  '\',\'' + person.sjDriveType + '\',\'' + sessionGet('user') + '\',\'' + person.PC +'\')'
                                                    },
                                                    dataType: 'json',
                                                    success: function (ret) {
                                                    }
                                                })
                                                //删除DBSX表中数据
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
                                                        where: ' where archivesId =\'' + person.archivesId + '\' AND type=\''+csData['czlb-levelup2']['nr2']+'\''
                                                    },
                                                    dataType: 'json'
                                                })
                                                //更新tjxx表
                                                var setStr1 = 'increaseAmount = increaseAmount + 1,kshg=kshg+1,yearlyAmount = yearlyAmount+1';
                                                var where1 =  ' where driveCode = \''+ person.sjDriveCode +'\' AND year = '+year;
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
                                                    dataType: 'json'
                                                })
                                            }
                                        })
                                    }else{
                                        //update
                                        var columnArr = ['payId','UName','department','cardId','sex','birthDate','txrq','sjDate','startDate','deadline','sjDriveCode','sjDriveType','status','tzDone','phyTest','pc'];
                                        var valuesArr = [person.payId,person.uName,person.department,person.cardId,person.sex,person.birthDate,person.txrq,person.sjDate,person.startDate,person.deadline,person.sjDriveCode,person.sjDriveType,person.status,person.tzDone,person.phyTest,person.PC];
                                        var setStr = '';
                                        for (var i = 0; i < columnArr.length; i++) {
                                            setStr += columnArr[i] + '=' + '\'' + valuesArr[i] + '\'' + ','
                                        }
                                        setStr = setStr.substring(0, setStr.length - 1);
                                        //更新jbxx
                                        $.ajax({
                                            url: "../../../ways.php",
                                            type: "POST",
                                            timeout: 8000,
                                            data: {
                                                funcName: 'update',async:false, serverName: '10.101.62.73', uid: 'sa', pwd: '2huj15h1', Database: 'jszgl',
                                                tableName: ' jbxx', setStr: setStr, where: ' where archivesId = \''+person.archivesId+'\''
                                            },
                                            dataType: 'json',
                                            success: function () {
                                                var successObj ={};
                                                successObj.uName =person.uName;
                                                successObj.archivesId = person.archivesId;
                                                successObj.department = person.department;
                                                successArr.push(Object.assign({},successObj))
                                                //插入bgxx
                                                $.ajax({
                                                    url: "../../../ways.php",
                                                    type: "POST",
                                                    timeout: 8000,
                                                    data: {
                                                        funcName: 'insert',
                                                        serverName: '10.101.62.73',
                                                        async:false,
                                                        uid: 'sa',
                                                        pwd: '2huj15h1',
                                                        Database: 'jszgl',
                                                        tableName: ' bgxx',
                                                        column: ' (lotNumber,Department,payId,archivesId,UName,changeType,checkStatus,' +
                                                        'driveCode,drive,jykOperator,pc)',
                                                        values: '(\'' + lotNumber + '\',\'' + person.department + '\',\'' + person.payId + '\',\'' + person.archivesId + '\',\'' + person.uName + '\',\'' + csData['czlb-levelup2']['nr2'] +  '\',\'' + csData['checkStatus-shtg']['nr2'] +
                                                        '\',\'' + person.sjDriveCode +  '\',\'' + person.sjDriveType + '\',\'' + sessionGet('user') + '\',\'' + person.PC +'\')'
                                                    },
                                                    dataType: 'json',
                                                    success: function (ret) {

                                                    }
                                                })
                                                //删除DBSX表中数据
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
                                                        where: ' where archivesId =\'' + person.archivesId + '\' AND type=\''+csData['czlb-levelup2']['nr2']+'\''
                                                    },
                                                    dataType: 'json'
                                                })
                                                //更新tjxx表
                                                var date = new Date();
                                                var year = date.getFullYear()
                                                var setStr1 = 'increaseAmount = increaseAmount + 1,kshg=kshg+1,yearlyAmount = yearlyAmount+1';
                                                var where1 =  ' where driveCode = \''+ person.sjDriveCode +'\' AND year = '+year;
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
                                                    dataType: 'json'
                                                })
                                            }
                                        })
                                    }
                                }
                            })
                        }
                        function displaySuccess(successArr){
                            //成功提升的模态框
                            console.log(successArr)
                            if(successArr.length>0){
                                var html ='<tr><th>档案号</th><th>部门</th><th>姓名</th></tr>';
                                for(var x=0;x<successArr.length;x++){
                                    html+='<tr><td>'+successArr[x]['archivesId']+'</td><td>'+successArr[x]['department']+'</td><td>'+successArr[x]['uName']+'</td></tr>';
                                }
                                var p = '本次操作成功提升司机'+successArr.length+'名';
                                $('#tsSuccessP').empty().append(p)
                                $('#tsSuccessTable').empty().append(html)
                                $(".modal-backdrop").remove()
                                $('#tsSuccess').modal('show');
                            }
                        }


                        function dotTo(str){
                            //该函数接收一个'xxxx.x.xx'格式的日期，返回一个'xxxx-xx-xx'格式
                            var strArr = str.split('.');
                            if(strArr[1].length<2){
                                strArr[1] = '0'+strArr[1];
                            }
                            if(strArr[2].length<2){
                                strArr[2] = '0'+strArr[2];
                            }
                            var _newStr = strArr[0]+'-'+strArr[1]+'-'+strArr[2]
                            return _newStr
                        }
                    };
                    reader.readAsBinaryString(f);
                }
            }
            $('#uploadExcel').bind('change', handleFile);
            $('#uploadExcel1').bind('change', handleFile1);
            $('#uploadExcel2').bind('change', handleFile2);
        }
        $('a[href="#tsContent"]').on('shown', function (e) {
            $("#appendPage").css('display','none')
            var column = ' payId,archivesId,uName,department,cardId,type,PC'
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
                    column:column,
                    order: ' order by PC'
                },
                dataType: 'json',
                success: function (data) {
                    if (data['success'] === 1) {
                        $('#appendContainer .levelUpTableContent').css('display','block')
                        $("#appendContainer .uploadExcelContent").css('display','none')
                        $('.buttonBanner .float:eq(0)').css({'background':'inherit','color':'inherit','fontWeight':'inherit'})
                        $('.buttonBanner .float:eq(1)').css({'background':'green','color':'white','fontWeight':'bold'})
                        $("#appendPage").css('visibility','visible')
                        var table = $("#appendTSTable");
                        var page = $("#appendPage");
                        var extra = '';
                        var thText = '<tr><th>工资号</th><th>档案号</th><th>姓名</th><th>部门</th><th>身份证号</th><th>操作类别</th><th>批次</th></tr>';
                        var eventFunction = boundAppendEvent;
                        commonAppendToTable(table,page,data,thText,extra,eventFunction)
                    }
                    else {
                        $("#appendContainer .uploadExcelContent").css('display','block')
                        $('#appendContainer .levelUpTableContent').css('display','none')
                        $('#appendContainer .checkWithPCContent').css('display','none')
                        $('.buttonBanner .float:eq(0)').css({'background':'green','color':'white','fontWeight':'bold'})
                        $('.buttonBanner .float:eq(1)').css({'background':'inherit','color':'inherit','fontWeight':'inherit'})
                        $('.buttonBanner .float:eq(2)').css({'background':'inherit','color':'inherit','fontWeight':'inherit'})
                        $("#appendPage").css('visibility','hidden')
                        boundAppendEvent(data,csData)
                    }
                }
            })
        })
    }
    //调入调出
    function appendDrdc(csData){
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
                    $('.drdcButton .redPoint').css('display','block');
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
                    $('.drdcButton .redPoint').css('display','block');
                }
            }
        })
        //同步数据库按钮,这里要改成webservice  18/11/21
        $("#drContent #updateDr").off('click').on('click',function(){
            if(confirm('请注意，该功能请不要频繁使用')){
                location.reload();
            }
        })
        //激活标签页
        $('#appendBanner a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        })
        $('a[href="#quitContent"]').on('shown', function (e) {
            $("#drdcPage").css('display','none')
            $(this).find(".redPoint").remove()
            var column = ' payId,archivesId,uName,department,cardId'
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
                    column: column,
                    order: ' order by payId'
                },
                dataType: 'json',
                success: function (data) {
                    if (data['success'] === 1) {
                        var table = $("#appendLZTable");
                        var page = $("#appendPage");
                        var extra = '<td><span class="dc">调出</span><span class="tx">退休</span></td>';
                        var thText = '<tr><th>工资号</th><th>档案号</th><th>姓名</th><th>部门</th><th>身份证号</th><th>操作</th></tr>';
                        var eventFunction = '';
                        commonAppendToTable(table,page,data,thText,extra,eventFunction)
                        //调出
                        $('#appendLZTable .dc').off('click').on('click',function(){
                            if(confirm('请在确认该职工已调出后进行本操作！')){
                                var _this = $(this);
                                var archivesId = $(this).parent().prev().prev().prev().prev().text();
                                var where =' where archivesId =\''+ archivesId+'\'';
                                var setStr = 'status =\''+csData['zjzt-dc']['nr2']+'\'';
                                var column = ' uName,department,sjDriveCode'
                                $.ajax({
                                    url: "../../../ways.php",
                                    type: "POST",
                                    data: {
                                        funcName: 'select',
                                        serverName: '10.101.62.73',
                                        uid: 'sa',
                                        pwd: '2huj15h1',
                                        Database: 'jszgl',
                                        tableName: ' jbxx ',
                                        column: column,
                                        where: where,
                                        order: ' '
                                    },
                                    dataType: 'json',
                                    success: function (data){
                                        var uName = data['row1']['uName'];
                                        if(data['row1']['department'].split(',').length>1){
                                            var department = data['row1']['department'].split(',')[0];
                                        }else{
                                            var department = data['row1']['department']?data['row1']['department']:'';
                                        }
                                        var sjDriveCode = data['row1']['sjDriveCode']
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
                                                        column: ' (lotNumber,archivesId,UName,department,changeType,' +
                                                        'driveCode,drive,jykOperator)',
                                                        values: '(\'' + lotNumber + '\',\'' + archivesId + '\',\'' + uName + '\',\''+ department + '\',\'' + csData['czlb-dc']['nr3'] +
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
                                                        $("#alertModal").modal('show')
                                                        $("#alertModal .text-success").empty().text('操作成功。该证件的状态目前为：'+csData['zjzt-dc']['nr2'])
                                                    }
                                                })
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
                                var column = ' uName,department,sjDriveCode';
                                $.ajax({
                                    url: "../../../ways.php",
                                    type: "POST",
                                    data: {
                                        funcName: 'select',
                                        serverName: '10.101.62.73',
                                        uid: 'sa',
                                        pwd: '2huj15h1',
                                        Database: 'jszgl',
                                        tableName: ' jbxx ',
                                        column: column,
                                        where: where,
                                        order: ' '
                                    },
                                    dataType: 'json',
                                    success: function (data){
                                        var uName = data['row1']['uName'];
                                        if(data['row1']['department'].split(',').length>1){
                                            var department = data['row1']['department'].split(',')[0];
                                        }else{
                                            var department = data['row1']['department']?data['row1']['department']:'';
                                        }
                                        var sjDriveCode = data['row1']['sjDriveCode']
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
                                                        column: ' (lotNumber,archivesId,UName,department,changeType,changeReason,' +
                                                        'driveCode,drive,jykOperator)',
                                                        values: '(\'' + lotNumber + '\',\'' + archivesId + '\',\'' + uName + '\',\''+ department + '\',\'' + csData['czlb-zx']['nr3'] + '\',\'' + csData['zxyy-tx']['nr2'] +
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
                                                        $("#alertModal").modal('show')
                                                        $("#alertModal .text-success").empty().text('操作成功。该证件的状态目前为：'+csData['czlb-zx']['nr3'])
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                    else {
                        $(".quitContent").empty().text('暂无待办信息');
                    }
                }
            })
        })
        $('a[href="#drContent"]').on('shown', function (e) {
            $("#appendPage").css('display','none')
            $(this).find(".redPoint").remove()
            var column = ' payId,archivesId,uName,department,cardId,phone'
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
                    column: column,
                    order: ' order by payId'
                },
                dataType: 'json',
                success: function (data) {
                    if (data['success'] === 1) {
                        var table = $("#appendDRTable");
                        var page = $("#appendPage");
                        var extra = '<td><a href="#drInfo" class="dr" data-toggle="modal" role="button">调入</a><span class="tz">短信通知</span></td>';
                        var thText = '<tr><th>工资号</th><th>档案号</th><th>姓名</th><th>部门</th><th>身份证号</th><th>电话号码</th><th>操作</th></tr>';
                        var eventFunction = '';
                        commonAppendToTable(table,page,data,thText,extra,eventFunction)
                        //调入短信通知
                        $('#appendDRTable .tz').off('click').on('click',function(){
                            var uName = $(this).parent().prev().prev().prev().prev().html();
                            var _this = $(this);
                            var payId = $(this).parent().prev().prev().prev().prev().prev().prev().html();
                            if(confirm('将向'+uName+'师傅发送短信，提醒他来登记驾驶证')){
                                tzEvent(csData,csData['czlb-dr']['nr3'],payId,_this)
                            }
                        })
                        //调入：填写驾驶证信息，添加入系统
                        $('#appendDRTable .dr').off('click').on('click',function(){
                            var _this = $(this);
                            var archivesId = $(this).parent().prev().prev().prev().prev().prev().text();
                            var column = ' payId,uName,sex,department,cardId,birthDate,txrq,pym'
                            $('#drInfo .sjDateInput').val('')
                            $('#drInfo .sjDriveCodeInput').val('')
                            $('#drInfo .startDateInput').val('')
                            $('#drInfo .deadlineInput').val('')
                            $.ajax({
                                url: "../../../ways.php",
                                type: "POST",
                                data: {
                                    funcName: 'select',
                                    serverName: '10.101.62.62',
                                    uid: 'sa',
                                    pwd: '2huj15h1',
                                    Database: 'userinfo',
                                    tableName: ' userinfo1 ',
                                    column: column,
                                    where: ' where archivesId =\''+ archivesId+'\'',
                                    order: ' '
                                },
                                dataType: 'json',
                                success: function (dataR){
                                    if(dataR['row1']['department'].split(',').length>1){
                                        var department = dataR['row1']['department'].split(',')[0];
                                    }else{
                                        var department = dataR['row1']['department']?dataR['row1']['department']:'';
                                    }
                                    $('#drInfo .payId').val(dataR['row1']['payId'])
                                    $('#drInfo .archivesId').val(archivesId)
                                    $('#drInfo .name').val(dataR['row1']['uName'])
                                    $('#drInfo .sex').val(dataR['row1']['sex'])
                                    $('#drInfo .department').val(department)
                                    $('#drInfo .cardId').val(dataR['row1']['cardId'])
                                    $('#drInfo .birthDate').val(dataR['row1']['birthDate'])
                                    $('#drInfo .txrq').val(dataR['row1']['txrq'])
                                    $('#drInfo .pym').val(dataR['row1']['pym'])
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
                                                    $("#alertModal").modal('show')
                                                    $("#alertModal .text-warning").empty().text('人员重复，请不要重复操作')
                                                }else{
                                                    if($('#drInfo .sjDateInput').val().match(/^\d{4}-\d{2}-\d{2}$/)){
                                                        if(checkIfInArray($('#drInfo .sjDriveCodeInput').val(),arr)){
                                                            if($('#drInfo .startDateInput').val().match(/^\d{4}-\d{2}-\d{2}$/)){
                                                                if($('#drInfo .deadlineInput').val().match(/^\d{4}-\d{2}-\d{2}$/)){
                                                                    if(confirm('请确认信息无误，确定后将把该驾驶证插入数据库')){
                                                                        $('#drInfo input').css('backgroundColor','white');
                                                                        var sjDriveType = csData['zjlx-'+$('#drInfo .sjDriveCodeInput').val()]['nr1']
                                                                        var i = 'row1';
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
                                                                                'sjDriveCode,sjDriveType,status,deadline,startDate,sex,cardId,pym)',
                                                                                values: '(\''+ $("#drInfo .payId").val() +'\',\'' + $("#drInfo .archivesId").val() + '\',\'' + $("#drInfo .name").val() + '\',\'' + $("#drInfo .birthDate").val() + '\',\'' + $("#drInfo .txrq").val() + '\',\'' + $("#drInfo .department").val() + '\',\'' + $('#drInfo .sjDateInput').val() + '\',\'' + $('#drInfo .sjDriveCodeInput').val() + '\',\''
                                                                                + sjDriveType + '\',\'' + csData['zjzt-zc']['nr2'] + '\',\'' + $('#drInfo .deadlineInput').val() + '\',\'' + $('#drInfo .startDateInput').val() + '\',\'' + $("#drInfo .sex").val() + '\',\'' + $("#drInfo .cardId").val()+ '\',\'' + $("#drInfo .pym").val() + '\')'
                                                                            },
                                                                            dataType: 'json',
                                                                            success: function () {
                                                                                $("#alertModal").modal('show')
                                                                                $("#alertModal .text-success").empty().text('添加信息成功')
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
                                                                                        column: ' (lotNumber,Department,payId,archivesId,UName,changeType,' +
                                                                                        'driveCode,drive,jykOperator)',
                                                                                        values: '(\'' + lotNumber + '\',\'' + $("#drInfo .department").val() + '\',\'' + $("#drInfo .payId").val() + '\',\'' + $("#drInfo .archivesId").val() + '\',\'' + $("#drInfo .name").val() + '\',\'' + csData['czlb-dr']['nr3']  +
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
                                                                                    $("#alertModal").modal('show')
                                                                                    $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
                                                                                }
                                                                            }
                                                                        })
                                                                        $('#drInfo').modal('hide')
                                                                    }
                                                                }else{
                                                                    $("#alertModal").modal('show')
                                                                    $("#alertModal .text-error").empty().text('有效截止日期格式不正确，应为"xxxx-xx-xx"')
                                                                    $('#drInfo input').css('backgroundColor','white')
                                                                    $('#drInfo .deadlineInput').css('backgroundColor','#ffcccc').focus()
                                                                }
                                                            }else{
                                                                $("#alertModal").modal('show')
                                                                $("#alertModal .text-error").empty().text('有效起始日期格式不正确，应为"xxxx-xx-xx"')
                                                                $('#drInfo input').css('backgroundColor','white')
                                                                $('#drInfo .startDateInput').css('backgroundColor','#ffcccc').focus()
                                                            }
                                                        }else{
                                                            $("#alertModal").modal('show')
                                                            $("#alertModal .text-error").empty().text('准驾类型代码输入不正确')
                                                            $('#drInfo input').css('backgroundColor','white')
                                                            $('#drInfo .sjDriveCodeInput').css('backgroundColor','#ffcccc').focus()
                                                        }
                                                    }else{
                                                        $("#alertModal").modal('show')
                                                        $("#alertModal .text-error").empty().text('初次领证日期格式不正确，应为"xxxx-xx-xx"')
                                                        $('#drInfo input').css('backgroundColor','white')
                                                        $('#drInfo .sjDateInput').css('backgroundColor','#ffcccc').focus()
                                                    }
                                                }
                                            }
                                        })
                                    })
                                }
                            })

                        })
                    }
                    else {
                        $('#appendDRTable').empty()
                        $(".appendContent p").empty().append('暂无调入信息');
                    }
                }
            })
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
                                        if(confirm('是否要生成EXCEL表格')){
                                            var filterArray=['num','company','UName','sex','cardId','birthDate','applyDriveCode','driveCode','startDate','deadline','sjRemark','phyTest'];
                                            var headerArray=['序号','单位','姓名','性别','公民身份号码','出生日期','申请准驾\u000d类型代码','原证准驾\u000d类型代码','原证初次\u000d领证日期','原证有效\u000d截止日期','原证批准文号\u000d(公文号)','体检\u000d结论','备注']
                                            htmlToXls(data,table2,filterArray,headerArray)
                                        }
                                    })
                                }else{
                                    $("#alertModal").modal('show')
                                    $("#alertModal .text-warning").empty().text('暂无有效期满汇总信息')
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
                                    $("#alertModal").modal('show')
                                    $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
                                }
                            }
                        })
                    }
                    else if($(this).val() === table3){//非有效期满
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
                                    $("#alertModal").modal('show')
                                    $("#alertModal .text-warning").empty().text('暂无非有效期满汇总信息')
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
                                    $("#alertModal").modal('show')
                                    $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
                                }
                            }
                        })
                    }
                    else if($(this).val() === table4){//补证
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
                                    $("#alertModal").modal('show')
                                    $("#alertModal .text-warning").empty().text('暂无补证汇总信息')
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
                                    $("#alertModal").modal('show')
                                    $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
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
                                        $("#alertModal").modal('show')
                                        $("#alertModal .text-info").empty().text('查无上年度数据，只生成当年度数据')
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
                                        $("#alertModal").modal('show')
                                        $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
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
                                        $("#alertModal").modal('show')
                                        $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
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
                        $("#alertModal").modal('show')
                        $("#alertModal .text-error").empty().text('您还有尚未完结的' + data['changeType'] + '申请,不允许重复提交')
                    } else {
                        $("#fixButton").css('display', 'none');
                        $("#yxqmButton").css('display', 'none');
                        $("#fyxqmButton").css('display', 'none');
                        $("#fixTable").css('visibility', 'visible');
                        $("#print").css('visibility', 'visible');
                        $("#applySubmit").css('visibility', 'visible');
                        $("#rightContent").css('width', '84%');
                        $(".operateContent").css('margin', 0);
                        $('#back').css('visibility', 'visible');
                        $('#back').off('click').on('click',function(){
                            if(confirm('确认返回？')){
                                $("#fixButton").css('display', 'block');
                                $("#yxqmButton").css('display', 'block');
                                $("#fyxqmButton").css('display', 'block');
                                $("#fixTable").css('visibility', 'hidden');
                                $("#print").css('visibility', 'hidden');
                                $("#applySubmit").css('visibility', 'hidden');
                                $("#rightContent").css('width', '80%');
                                $(".operateContent").css('margin-top', '50px');
                                $('#back').css('visibility', 'hidden');
                            }
                        })
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
                        $("#alertModal").modal('show')
                        $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
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
        $("#applySubmit").css('visibility', 'visible');
        $("#rightContent").css('width', '84%');
        $(".operateContent").css('margin', 0);
        $('#back').css('visibility', 'visible');
        $('#back').off('click').on('click',function(){
            if(confirm('确认返回？')){
                $("#fixButton").css('display', 'block');
                $("#yxqmButton").css('display', 'block');
                $("#fyxqmButton").css('display', 'block');
                $("#fixTable").css('visibility', 'hidden');
                $("#print").css('visibility', 'hidden');
                $("#applySubmit").css('visibility', 'hidden');
                $("#rightContent").css('width', '80%');
                $(".operateContent").css('margin-top', '50px');
                $('#back').css('visibility', 'hidden');
            }
        })
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
                        $("#alertModal").modal('show')
                        $("#alertModal .text-warning").empty().text('您还有尚未完结的' + data['changeType'] + '申请,不允许重复提交')
                    } else {
                        $("#fixButton").css('display', 'none');
                        $("#yxqmButton").css('display', 'none');
                        $("#fyxqmButton").css('display', 'none');
                        $("#fixTable").css('visibility', 'visible');
                        $("#print").css('visibility', 'visible');
                        $("#applySubmit").css('visibility', 'visible');
                        $("#rightContent").css('width', '84%');
                        $(".operateContent").css('margin', 0);
                        $('#back').css('visibility', 'visible');
                        $('#back').off('click').on('click',function(){
                            if(confirm('确认返回？')){
                                $("#fixButton").css('display', 'block');
                                $("#yxqmButton").css('display', 'block');
                                $("#fyxqmButton").css('display', 'block');
                                $("#fixTable").css('visibility', 'hidden');
                                $("#print").css('visibility', 'hidden');
                                $("#applySubmit").css('visibility', 'hidden');
                                $("#rightContent").css('width', '80%');
                                $(".operateContent").css('margin-top', '50px');
                                $('#back').css('visibility', 'hidden');
                            }
                        })
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
                        $("#alertModal").modal('show')
                        $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
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
    //呈现车间级完善信息
    function displayYearly(){
        if(sessionGet('power') === '1'){
            $("#yearlyContainer .queryInfoContent img").prop('src','')
            if($(".yearlyBanner .queryInput").val().match(/^[0-9]{5}$/) || $(".yearlyBanner .queryInput").val().match(/^[0-9]{4}$/)){
                var payid = $(".yearlyBanner .queryInput").val();
                if(payid.length<5){
                    payid = '0'+payid;
                }
                var department = sessionGet('department').split(',')[1]?sessionGet('department').split(',')[0]:sessionGet('department');
                var column = ' archivesId,UName,department,startDate,deadline,phyTest,yearlyCheckDate,cardPath,photoPath,sfzPath';
                var ajaxTimeOut = $.ajax({
                    url: "../../../ways.php",
                    type:"POST",
                    timeout:8000,
                    //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                    data:{funcName:'select',where:' where payid =\''+payid+'\' AND department like \''+department+'%\'',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                        tableName:' jbxx ',column:column,order:' '},
                    dataType:'json',
                    success:function(data) {
                        if(data['success'] ===1){
                            $('.queryInfo>div>div').css('backgroundColor','inherit')
                            $('#yearlyContainer .queryInfoContent').css('display','block')
                            $('#yearlyContainer .queryInfoContent .queryPicInfo #jszPic').prop('src',data['row1']['cardPath']?data['row1']['cardPath']:'../images/暂无图片.png');
                            $('#yearlyContainer .queryInfoContent .queryPicInfo #sfzPic').prop('src',data['row1']['sfzPath']?data['row1']['sfzPath']:'../images/暂无图片.png');
                            $('#yearlyContainer .queryInfoContent .queryPicInfo #photoPic1').prop('src',data['row1']['photoPath']?data['row1']['photoPath']:'../images/暂无图片.png');
                            $('#yearlyContainer .queryInfoContent .queryInfo .archivesId').text(data['row1']['archivesId']);
                            $('#yearlyContainer .queryInfoContent .queryInfo .name').text(data['row1']['UName']);
                            $('#yearlyContainer .queryInfoContent .queryInfo .department').text(data['row1']['department']);
                            $('#yearlyContainer .queryInfoContent .queryInfo .yearlyCheckDateInput').val(data['row1']['yearlyCheckDate']);
                            $('#yearlyContainer .queryInfoContent .queryInfo .startDate').text(data['row1']['startDate']);
                            $('#yearlyContainer .queryInfoContent .queryInfo .deadline').text(data['row1']['deadline']);
                            $('#yearlyContainer .queryInfoContent .queryInfo .phyTest').text(data['row1']['phyTest']);
                            $('#yearlyContainer .queryInfoContent .queryInfo .yearlyCheckDateInput').val(data['row1']['yearlyCheckDate']);
                            $("#yearlyContainer .queryInfoContent .queryInfo input").prop('disabled',true).css('backgroundColor','inherit')
                            $('#uploadImage input').val('')
                            $('#uploadImage img').prop('src','../images/暂无图片.png').css({'width':'73px','height':'64px'})
                            boundYearEvent(data['row1'])
                        }else{
                            $("#alertModal").modal('show')
                            $("#alertModal .text-error").empty().text('您查询的信息不存在')
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
                            $("#alertModal").modal('show')
                            $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
                        }
                    }
                })
            }else{
                $("#alertModal").modal('show')
                $("#alertModal .text-warning").empty().text('请输入正确的工资号')
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
                                $("#alertModal").modal('show')
                                $("#alertModal .text-success").empty().text('年鉴完成')
                            }
                        }
                    })
                }else{
                    $("#alertModal").modal('show')
                    $("#alertModal .text-error").empty().text('日期格式不正确')
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
        $('.yearlyButtonBanner .uploadImg').off('click').on('click',function(){
            $("#uploadImage").modal('show')
            //图片上传功能。
            $("#uploadImage .btn-primary").off('click').on('click', function () {
                var archivesId = $("#yearlyContainer .queryInfoContent .archivesId").text();
                var uname = $("#yearlyContainer .queryInfoContent .name").text();
                //取用户身份证号
                var ajaxTimeOut1 = $.ajax({
                    url: "../../../ways.php",
                    type: "POST",
                    timeout: 8000,
                    data: {
                        funcName: 'getInfo', serverName: '10.101.62.62', uid: 'sa', pwd: '2huj15h1', Database: 'USERINFO',
                        tableName: 'userinfo1', column: ' cardid ', where: ' where archivesId = \'' + archivesId + '\'', order: ' '
                    },
                    dataType: 'json',
                    success: function (data) {
                        var cardId = data['row']['cardid'];
                        var fileCard = document.getElementById('cardInput').files[0];
                        var fileSfz = document.getElementById('sfzInput').files[0];
                        var filePhoto = document.getElementById('photoInput').files[0];
                        var formData = new FormData($('#uploadImageForm')[0]);
                        var cardPath = uname + cardId + '驾驶证' + '.jpg';
                        var sfzPath = uname + cardId + '身份证' + '.jpg';
                        var photoPath = uname + cardId + '电子照' + '.jpg';
                        var setStr = '';
                        //该变量是update语句中set后面的句段
                        formData.append("uname", uname);
                        formData.append("cardId", cardId);
                        formData.append("serverName", '10.101.62.73');
                        formData.append("uid", 'sa');
                        formData.append("pwd", '2huj15h1');
                        formData.append("Database", 'JSZGL');
                        formData.append("tableName", 'jbxx');
                        formData.append("where", ' where ' + ' archivesId = \'' + archivesId + '\'');
                        var cardFlag = false;
                        var sfzFlag = false;
                        var photoFlag = false;
                        var flag = true;
                        if (!fileCard || fileCard.size <= 0) {}else{
                            cardFlag = true;
                            formData.set("file", fileCard);
                            setStr = 'cardPath = \'..' + '/' + 'images' + '/' + 'userPic' + '/' + cardPath + '\'';
                            formData.set("setStr", setStr);
                            formData.set("fileName",cardPath)
                            uploadImage(formData)
                        }
                        if( !fileSfz || fileSfz.size <= 0){}else{
                            sfzFlag = true;
                            formData.set("file", fileSfz);
                            setStr = 'sfzPath = \'..' + '/' + 'images' + '/' + 'userPic' + '/' + sfzPath + '\'';
                            formData.set("fileName",sfzPath)
                            formData.set("setStr", setStr);
                            uploadImage(formData)
                        }
                        if(!filePhoto || filePhoto.size <= 0){}else{
                            photoFlag = true;
                            formData.set("file", filePhoto);
                            setStr = 'photoPath = \'..' + '/' + 'images' + '/' + 'userPic' + '/' + photoPath + '\' ';
                            formData.set("fileName",photoPath)
                            formData.set("setStr", setStr);
                            uploadImage(formData)
                        }
                        if(!cardFlag && !sfzFlag && !photoFlag){
                            $("#alertModal").modal('show')
                            $("#alertModal .text-warning").empty().text('请选择图片')
                            return;
                        }
                        function uploadImage(formData){
                            $.ajax({
                                url: "../../../storeImg.php",
                                type: "POST",
                                data: formData,
                                dataType:'JSON',
                                async:false,
                                processData: false,
                                contentType: false,
                                cache: false,
                                success: function (data) {
                                    if(data['success'] === 1) {
                                        if(flag){
                                            $("#alertModal").modal('show')
                                            $("#alertModal .text-success").empty().text('上传成功')
                                            displayYearly()
                                            $('#uploadImage').modal('hide')
                                        }else{
                                            $("#alertModal").modal('show')
                                            $("#alertModal .text-error").empty().text('文件格式错误')
                                        }
                                    }else{
                                        flag = false;
                                    }
                                }
                            })
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
                            ajaxTimeOut1.abort();    // 超时后中断请求
                            $("#alertModal").modal('show')
                            $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
                        }
                    }
                })
            });
        })

    }
    //车间级人员登陆时提示本车间未完善信息的人员
    appendImproveAlert()
    function appendImproveAlert(){
        var power = sessionGet('power');
        if(power === '1'){
            var department = sessionGet('department').split(',')[1]?sessionGet('department').split(',')[0]:sessionGet('department');
            var column = ' payId,uName,cardPath,sfzPath,photoPath';
            var where = ' where department like \''+ department +'%\' AND (cardPath = \'\' OR sfzPath = \'\' OR photoPath = \'\')';
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
                    column: column,
                    where: where,
                    order: ' order by payid'
                },
                dataType: 'json',
                success: function (data) {
                    if(data['success'] === 1){
                        $('#improveAlert').modal('show');
                        for(var i in data){
                            data[i]['cardPath'] = data[i]['cardPath'] === ''?'尚未上传':'已上传';
                            data[i]['sfzPath'] = data[i]['sfzPath'] === ''?'尚未上传':'已上传';
                            data[i]['photoPath'] = data[i]['photoPath'] === ''?'尚未上传':'已上传';
                        }
                        var html = '<tr><th>工资号</th><th>姓名</th><th>驾驶证</th><th>身份证</th><th>电子照</th></tr>';
                        var table = $("#improveAlertTable");
                        var page = $("#improveAlertPage");
                        commonAppendToTable(table,page,data,html)
                    }else{

                    }
                }
            })
        }
    }
    //教育科级配置参数
    options()
    function options(){
        var power = sessionGet('power');
        if(power === 'V'){
            $('#options').off('click').on('click',function(e){
                e.preventDefault();
                $("#paramOption").modal('show');

            })
        }
        function displayCodeParam(){

        }
    displayCodeParam()
    }
    //证件查询
    function displayQueryForm(csData){
        var queryButton = $("#queryCardButton");
        $(queryButton).off('click').on('click',function(){
            var obj = checkQueryRequest();
            obj = addQueryDepartment(obj);
            if(obj === undefined){
                return false
            }
            var ajaxTimeOut = $.ajax({
                url: "../../../ways.php",
                type:"POST",
                timeout:8000,
                //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
                data:{funcName:'select',where:obj.where,serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                    tableName:'jbxx',column:obj.column,order:obj.order},
                dataType:'json',
                success:function(data){
                    if(data.success === 1){
                        var table = $("#queryTable");
                        var page = $("#queryPage");
                        var count = data['count'];
                        var extra = '';
                        var thText = '<tr>';
                        var thArr = [];
                        for(var i=0;i<obj['column'].split(',').length;i++){
                                //字典，中英文对照
                                var j ='';
                                thArr.push(obj['column'].split(',')[i])
                                switch(obj['column'].split(',')[i]){
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
                                        j = '司机初次<br>领证日期';
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
                                    case 'DATEDIFF(day':
                                        j = '年龄';
                                        break;
                                    case 'birthdate':
                                        thArr.pop()
                                        break;
                                    case 'getdate())/365 as age':
                                        thArr.pop()
                                        break;
                                    case 'startDate':
                                        j = '有效起始日期';
                                        break;
                                    case 'cardPath':
                                        break;
                                    case 'photoPath':
                                        break;
                                    case 'changeType':
                                        j = '申请类型';
                                        break;
                                    case 'remainingDays':
                                        j = '距到期剩余天数';
                                        break;
                                    case 'cardId':
                                        j = '身份证号';
                                        break;
                                    case 'yearlyCheckDate':
                                        j = '年鉴日期';
                                        break;
                                    case 'phyTest':
                                        j = '体检结论';
                                        break;
                                    case 'PC':
                                        j = '批次';
                                        break;
                                }
                                if(thArr[i]){
                                    thText += '<th id='+thArr[i]+'>'+j+'</th>';
                                }
                            }
                        thText+='</tr>'
                        var eventFunction = '';
                        commonAppendToTable(table,page,data,thText,extra,eventFunction)
                        $(page).children('.totalCount').text(count);
                        prevOrderColumn = '';
                        orderColumn = '';
                        orderFlag = '';
                        boundHeadEvent()
                        //生成EXCEL按钮出现
                        $("#queryCardBanner .htmlToXls").css("visibility",'visible');
                        boundOutputExcel(data)
                    }else{
                        $("#alertModal").modal('show')
                        $("#alertModal .text-warning").empty().text('您查询的信息不存在')
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
                        $("#alertModal").modal('show')
                        $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
                    }
                }
            })
        })

    }

//向表格中输入数据，参数：table是表格jq对象，page是分页器jq对象,data是数据集
//extra针对最后一列是按钮的表格，是字符串，若无，传空字符串
//eventFunction是绑定事件的函数名
    function commonAppendToTable(table,page,data,thText,extra,eventFunction){
        if(eventFunction){}else{
            eventFunction = function(){

            }
        }
        var html = thText;          //字符串
        var count = data['count']?data['count']:data.length;
        delete data['count'];
        delete data['success'];
        for(var i in data){
            if(data[i]['department']){
                data[i]['department'] = data[i]['department'].split(',')[1]?data[i]['department'].split(',')[0]:data[i]['department'];
            }
        }
        if(count<11){
            $(page).css('display','none')
            for(var i in data){
                html += '<tr>';
                for(var j in data[i]){
                    html += '<td>'+data[i][j]+'</td>';
                }
                if(eventFunction === boundBackEvent){
                    var my = new Date();
                    var today = new Date();
                    my.setFullYear(parseInt(data[i]['lotNumber'].split('-')[0]),parseInt(data[i]['lotNumber'].split('-')[1])-1,parseInt(data[i]['lotNumber'].split('-')[2]))
                    if((today-my)/(1000*60*60*24) < csData['chqx-dc']['nr2']){
                        html += extra;
                    }else{
                        html += '<td>超过撤回期限</td>'
                    }
                }else{
                    html += extra;
                }
                html += '</tr>'
            }
            $(table).empty().append(html);
            eventFunction(data,csData)
            //空白tr补齐表格
            if($(table).children('tbody').children('tr').length<11){
                html = '';
                var c = 11-$(table).children('tbody').children('tr').length;
                var columns = $(table).children('tbody').children('tr:first-child').children('th').length;
                for(var m=0;m<c;m++){
                    html+='<tr>';
                    for(var n=0;n<columns;n++){
                        html+="<td>&nbsp</td>";
                    }
                    html+="</tr>";
                }
                $(table).children('tbody').append(html);
            }
        }
        else{
            var q =0;
            var cur =1;
            var total = Math.ceil(count/10);
            $(page).css("display",'block');
            for(var i in data){
                html += '<tr>';
                for(var j in data[i]){
                    html += '<td>'+data[i][j]+'</td>';
                }
                html += extra;
                html += '</tr>';
                q+=1;
                if(q>9){
                    break
                }
            }
            $(table).empty().append(html);
            eventFunction(data,csData)
            $(page).children('.cur').text(cur);
            $(page).children('.total').text(total);
            $(page).children('.next').off('click').on('click',function(){
                if(cur<total){
                    var j =0;
                    var html = thText;
                    for(var i in data){
                        if(j>10*cur-1 && j<10*(cur+1) && i ){
                            j++;
                            html += '<tr>';
                            for(var m in data[i]){
                                html += '<td>'+data[i][m]+'</td>';
                            }
                            html += extra;
                            html += '</tr>'
                        }else{
                            j++;
                        }
                    }
                    $(table).empty().append(html);
                    eventFunction(data,csData)
                    //空白tr补齐表格
                    if($(table).children('tbody').children('tr').length<11){
                        html = '';
                        var count = 11-$(table).children('tbody').children('tr').length;
                        var columns = $(table).children('tbody').children('tr:first-child').children('th').length;
                        for(var m=0;m<count;m++){
                            html+='<tr>';
                            for(var n=0;n<columns;n++){
                                html+="<td>&nbsp</td>";
                            }
                            html+="</tr>";
                        }
                        $(table).children('tbody').append(html);
                    }
                    cur+=1;
                    $(page).children('.cur').text(cur);
                }

            })
            $(page).children('.prev').off('click').on('click',function(){
                if(cur>1){
                    var j =0;
                    var html = thText;
                    for(var i in data){
                        if(j>10*(cur-2)-1 && j<10*(cur-1) && i ){
                            j++;
                            html += '<tr>';
                            for(var m in data[i]){
                                html += '<td>'+data[i][m]+'</td>';
                            }
                            html += extra;
                            html += '</tr>'
                        }else{
                            j++;
                        }
                    }
                    $(table).empty().append(html);
                    eventFunction(data,csData)
                    cur-=1;
                    $(page).children('.cur').text(cur);
                }
            })
        }
    }


    function boundHeadEvent(){
        var obj = checkQueryRequest();
        obj = addQueryDepartment(obj);
        if(obj === undefined){
            return false
        }
        var permission = 1;
        var eventElement = $('#queryTable th');
        $('#queryCardBanner input').off('change').change(function(){
            permission =0;
            $(eventElement).css({'cursor':'default'}).addClass('muted');
        });
        //给表头栏目添加事件：例如点击工资号，升序，再次点击，降序排列
        $(eventElement).off('click').on('click',function(){
            if(permission){
                orderColumn = $(this).attr('id');
                if(orderColumn === 'DATEDIFF(day'){
                    orderColumn = 'age'
                }
                if(prevOrderColumn !== orderColumn){
                    orderFlag = ''
                }else{
                    if(orderFlag === 'DESC'){
                        orderFlag = ''
                    }else{
                        orderFlag = 'DESC'
                    }
                }
                obj.order = ' order by ' + orderColumn + ' '+ orderFlag;
                prevOrderColumn = orderColumn;
                orderAjaxRequest(obj);
            }else{
                $("#alertModal").modal('show')
                $("#alertModal .text-warning").empty().text('请重新进行查询')
            }
        })
    }
//参数：要按哪列排序、排序方式、当前是第几页、sql语句对象
    function orderAjaxRequest(obj){
        var ajaxTimeOut = $.ajax({
            url: "../../../ways.php",
            type:"POST",
            timeout:8000,
            //若后期连接数据库的接口需求有变化，需要从这里更改数据的键值
            data:{funcName:'select',where:obj.where,serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                tableName:'jbxx',column:obj.column,order:obj.order},
            dataType:'json',
            success:function(data){
                if(data.success === 1){
                    var table = $("#queryTable");
                    var page = $("#queryPage");
                    var count = data['count'];
                    var extra = '';
                    var thText = '<tr>';
                    var thArr = [];
                    for(var i=0;i<obj['column'].split(',').length;i++){
                        //字典，中英文对照
                        var j ='';
                        thArr.push(obj['column'].split(',')[i])
                        switch(obj['column'].split(',')[i]){
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
                                j = '司机初次<br>领证日期';
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
                            case 'DATEDIFF(day':
                                thArr[i] = 'age'
                                j = '年龄';
                                break;
                            case 'birthdate':
                                thArr.pop()
                                break;
                            case 'getdate())/365 as age':
                                thArr.pop()
                                break;
                            case 'startDate':
                                j = '有效起始日期';
                                break;
                            case 'cardPath':
                                break;
                            case 'photoPath':
                                break;
                            case 'changeType':
                                j = '申请类型';
                                break;
                            case 'remainingDays':
                                j = '距到期剩余天数';
                                break;
                            case 'cardId':
                                j = '身份证号';
                                break;
                            case 'yearlyCheckDate':
                                j = '年鉴日期';
                                break;
                            case 'phyTest':
                                j = '体检结论';
                                break;
                            case 'PC':
                                j = '批次';
                                break;
                        }
                        if(thArr[i]){
                            thText += '<th id='+thArr[i]+'>'+j+'</th>';
                        }
                    }
                    thText+='</tr>'
                    var eventFunction = '';
                    commonAppendToTable(table,page,data,thText,extra,eventFunction)
                    if(orderColumn === 'DATEDIFF(day'){
                        orderColumn = 'age'
                    }
                    if(orderFlag === 'DESC'){
                        $('#queryTable #'+orderColumn).append(' <i class="icon-arrow-down"></i>')
                    }else if(orderFlag === ''){
                        $('#queryTable #'+orderColumn).append(' <i class="icon-arrow-up"></i>')
                    }
                    $(page).children('.totalCount').text(count)
                    boundHeadEvent()
                    //生成EXCEL按钮出现
                    $("#queryCardBanner .htmlToXls").css("visibility",'visible');
                    boundOutputExcel(data)
                }else{
                    $("#alertModal").modal('show')
                    $("#alertModal .text-warning").empty().text('您查询的信息不存在')
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
                    $("#alertModal").modal('show')
                    $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
                }
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
                    $("#alertModal").modal('show')
                    $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
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

        if(cardData['sjDriveCode']){
            if(cardData['sjDriveCode'] === 'A' || cardData['sjDriveCode'] === 'B' || cardData['sjDriveCode'] === 'C'){
                $("#originOther").prop({'checked':true,'disabled':true}).siblings('input').prop({'checked':false,'disabled':true})
                $("#originOtherInput").prop({
                    'disabled':true
                }).val(cardData['sjDriveCode'])
                if(cardData['sjDriveCode'] === csData['zjlx-A']['name']){
                    $("#applyJ4").attr({
                        'checked': 'checked',
                        'disabled': true
                    }).siblings('input').attr('disabled', true);
                }else if(cardData['sjDriveCode'] === csData['zjlx-B']['name']){
                    $("#applyJ5").attr({
                        'checked': 'checked',
                        'disabled': true
                    }).siblings('input').attr('disabled', true);
                }else if(cardData['sjDriveCode'] === csData['zjlx-C']['name']){
                    $("#applyJ6").attr({
                        'checked': 'checked',
                        'disabled': true
                    }).siblings('input').attr('disabled', true);
                }
            }
            $("#origin" + cardData['sjDriveCode']).attr({
                'checked': 'checked',
                'disabled': true
            }).siblings('input').attr('disabled', true);
            if(changeType === csData['czlb-fyxqmhz']['name']){
                if(cardData['applyDriveCode']){
                    //审核界面非有效期满
                    $("#apply" + cardData['applyDriveCode']).attr({
                        'checked': 'checked',
                        'disabled': true
                    }).siblings('input').attr({'disabled':true,'checked':false});
                    if(cardData['changeReason'] && changeType === csData['czlb-fyxqmhz']['name']){
                        $(".reason input").prop({
                            'disabled':true,
                            'checked':false
                        })
                        if(cardData['changeReason'] === csData['hzyy-jdzjjx']['nr2']){
                            $("#reasonLower").prop({'checked': 'checked'})
                        }else if(cardData['changeReason'] === csData['hzyy-nrbh']['nr2']){
                            $("#reasonContChange").prop({'checked': 'checked'})
                        }else{
                            $("#otherReason").prop({'checked': 'checked'})
                            console.log(cardData['changeReason'])
                            $("#otherReasonText").val(cardData['changeReason'])
                        }
                    }
                }else{
                    //申请界面非有效期满
                    $(".apply input").prop({
                        'disabled':false,
                        'checked':false
                    })
                    $('.apply input').off('change').on('change',function(){
                        $(this).siblings('input').prop('checked',false)
                        if($('.origin input:checked').attr('id') === 'originOther'){
                            var origin = $('#originOtherInput').val()
                        }else{
                            var origin = $('.origin input:checked').next('label').text()
                        }
                        if(csData['zjlx-'+$(this).next('label').text()]['nr2'] > csData['zjlx-'+origin]['nr2']){
                            $("#alertModal").modal('show')
                            $("#alertModal .text-error").empty().text('不能选择比原证等级高的类型')
                            $(this).prop('checked',false)
                        }
                    })
                    $(".reason div input").prop({
                        'disabled':true,
                        'checked':false
                    })
                    $(".fyxqmhz").prop({
                        'disabled':false
                    })
                    $('.fyxqmhz').off('click').on('click',function(){
                        $(this).parent().siblings('div').children('input').prop('checked',false);
                        $("#otherReasonText").prop('disabled',true);
                        if($(this).prop('id') === 'otherReason'){
                            $("#otherReasonText").prop('disabled',false).focus();
                        }
                    })
                }
                $("#fixCheckBox").prop({"disabled": true,'checked':false});
                $("#changeCheckBox").prop({"disabled": true, "checked": "checked"});
            }else if(changeType === csData['czlb-yxqmhz']['name']){
                if(cardData['applyDriveCode']){

                }else{

                }
                $("#fixCheckBox").prop({"disabled": true,'checked':false});
                $("#changeCheckBox").prop({"disabled": true, "checked": "checked"});
                $("#reasonDeadline").prop({
                    'checked': 'checked',
                    'disabled': true
                }).parent('div').siblings('div').children('input').prop({'disabled': true,'checked':false});
            }else if(changeType === csData['czlb-bz']['name']){
                if(cardData['applyDriveCode']){
                    $("#apply" + cardData['applyDriveCode']).attr({
                        'checked': 'checked',
                        'disabled': true
                    }).siblings('input').attr('disabled', true);
                }else{

                }
                $("#changeCheckBox").prop({"disabled": true,'checked':false});
                $("#fixCheckBox").prop({"disabled": true, "checked": "checked"});
                $("#cardLost").prop({
                    'checked': 'checked',
                    'disabled': true
                }).parent('div').siblings('div').children('input').prop({'disabled': true,'checked':false});
            }
        }else{
            $("#alertModal").modal('show')
            $("#alertModal .text-warning").empty().text('您的证件准驾机型为空，请完善信息')
            return false;
        }
        $("#phyOk").attr({'checked': 'checked', 'disabled': true}).siblings('input').attr('disabled', true);
        $("#originYearInTable").text(cardData['sjDate'].split('-')[0]);
        $("#originMonthInTable").text(cardData['sjDate'].split('-')[1]);
        $("#originDateInTable").text(cardData['sjDate'].split('-')[2]);
        //添加提交事件
        $("#applySubmit").off('click').on('click', function () {
            if($('.apply input:checked').length<1 || $(".reason div input:checked").length<1){
                $("#alertModal").modal('show')
                $("#alertModal .text-warning").empty().text('请完整填写表格')
            }else if($("#otherReason").prop('checked') && $("#otherReasonText").val().length<1){
                $("#alertModal").modal('show')
                $("#alertModal .text-warning").empty().text('请填写换证原因')
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
        var changeReason ='';
        var needed = '';
        if(changeType === csData['czlb-bz']['nr3']){
            for(var i in csData){
                if(csData[i]['lb'] === 'bzsxcl'){
                    needed += csData[i]['nr2'];
                    needed +=','
                }
            }
            needed = needed.substring(0,needed.length-1);
        }else if(changeType === csData['czlb-yxqmhz']['nr3'] || changeType === csData['czlb-fyxqmhz']['nr3']){
            for(var i in csData){
                if(csData[i]['lb'] === 'hzsxcl'){
                    needed += csData[i]['nr2'];
                    needed+=','
                }
            }
            needed = needed.substring(0,needed.length-1);
        }
        //根据用户勾选，取变更原因
        if ($("#cardLost").prop('checked')) {
            changeReason = csData['bzyy-jszds']['nr2'];
            status =csData['zjzt-ds']['nr2'];
        } else if ($("#cardBreak").prop('checked')) {
            changeReason = csData['bzyy-jszsh']['nr2'];
            status =csData['zjzt-sh']['nr2'];
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
            $("#alertModal").modal('show')
            $("#alertModal .text-warning").empty().text('请勾选原证准驾类型，老证请选“其他”并在后面输入准驾代码')
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
                    column: ' (lotNumber,Department,payId,archivesId,UName,cardId,changeType,changeReason,' +
                    'driveCode,drive,phyTest,needed,checkStatus,applyDriveCode,sex,birthDate,startDate,deadline,sjRemark)',
                    values: '(\'' + lotNumber + '\',\'' + department + '\',\'' + payId + '\',\'' + archivesId + '\',\'' + UName + '\',\'' + cardId + '\',\'' + changeType + '\',\''
                    + changeReason + '\',\'' + driveCode + '\',\'' + drive + '\',\'' + phyTest + '\',\'' + needed + '\',\'' + checkStatus + '\',\''+applyDriveCode+'\',\''+sex+'\',\''+birthDate+'\',\''+startDate+'\',\''+deadline+'\',\''+sjRemark+'\')'
                },
                dataType: 'json',
                success: function () {
                    $("#applySubmit").css('display', 'none');
                    if(changeType === csData['czlb-bz']['nr3']){
                        $("#alertModal").modal('show')
                        $("#alertModal .text-success").empty().text('您的补证申请提交成功，请联系车间开具《驾驶证丢失证明》')
                        tzEvent(csData,csData['czlb-bz']['nr3'],payId)
                    }else{
                        $("#alertModal").modal('show')
                        $("#alertModal .text-success").empty().text('您的换证申请提交成功，请留意审核状态')
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
                        $("#alertModal").modal('show')
                        $("#alertModal .text-error").empty().text('网络超时，请检查网络连接')
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
                    column: ' (date,Department,payId,UName,sex,cardId,changeType,changeReason,' +
                    'sjDriveCode,applyDriveCode,phyTest,fixedPhone,mobilePhone,company,address,mail,sjDate)',
                    values: '(\''+date+'\',\''+department + '\',\'' + payId + '\',\'' + UName + '\',\''+sex+'\',\'' + cardId + '\',\'' + changeType + '\',\''
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
                            if (data['success'] === 1) {
                                //换证补证，执行以下
                                if (data['row']['changeType'] === csData['czlb-fyxqmhz']['nr3'] || data['row']['changeType'] === csData['czlb-yxqmhz']['nr3'] || data['row']['changeType'] === csData['czlb-bz']['nr3']) {
                                    $("#applyInfo").empty().append('您有一项未完结的 ' + data['row']['changeType'] + ' 申请')
                                    $("#applyInfo").append('<br><span id="checkStatus"></span><br>' +
                                        '                    <span id="finishStatus"></span><br>' +
                                        '                    <span id="needed"></span>')
                                    //审核未通过，执行以下
                                    if (data['row']['checkStatus'] === csData['checkStatus-shwtg']['nr2']) {
                                        $("#checkStatus").empty().append('审核状态为：' + data['row']['checkStatus'] + '，原因是：' + data['row']['failedReason']+'，'+data['row']['shortage']);
                                    }//审核通过，执行以下
                                    else if(data['row']['checkStatus'] === csData['checkStatus-shtg']['nr2']){
                                        $("#checkStatus").empty().append('审核状态为：' + data['row']['checkStatus']);
                                        $("#finishStatus").empty().append('发放状态为：' + data['row']['finishStatus'])
                                    }//审核中，执行以下
                                    else if(data['row']['checkStatus'] === csData['checkStatus-jykshz']['nr2']){
                                        $("#checkStatus").empty().append('审核状态为：' + data['row']['checkStatus']);
                                        $("#finishStatus").empty().append('发放状态为：' + data['row']['finishStatus'])
                                    }else if(data['row']['checkStatus'] === csData['checkStatus-cjshz']['nr2']){
                                        $("#checkStatus").empty().append('审核状态为：' + data['row']['checkStatus']);
                                        $("#finishStatus").empty().append('发放状态为：' + data['row']['finishStatus'])
                                        if (data['row']['changeType'] === csData['czlb-fyxqmhz']['nr3'] || data['row']['changeType'] === csData['czlb-yxqmhz']['nr3']) {
                                            var text = '您需要将以下材料提交车间：';
                                            for(var i in csData){
                                                if(csData[i]['lb'] === 'hzsxcl'){
                                                    text += csData[i]['nr3'] ;
                                                    text += '、'
                                                }
                                            }
                                            text = text.substring(0,text.length-1);
                                            text += '。'
                                            $("#needed").empty().append(text);
                                        } else if (data['row']['changeType'] === csData['czlb-bz']['nr3']) {
                                            var text = '您需要将以下材料提交车间：';
                                            for(var i in csData){
                                                if(csData[i]['lb'] === 'bzsxcl'){
                                                    text += csData[i]['nr3'] ;
                                                    text += '、'
                                                }
                                            }
                                            text = text.substring(0,text.length-1);
                                            text += '。'
                                            $("#needed").empty().append(text);
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
    //渲染页面中需要动态添加的元素(高级搜索中的checkbox)
    appendElement()
    //添加用户高级搜索的选项
    appendSelection();
    $('#column').off('change').on('change', appendSelection);
})