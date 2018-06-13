$(document).ready(function(){
    var queryCardButton = document.getElementById("queryCardButton");
    initialScreen();
    loginStatus();
    //证件查询按钮的事件,调用displayQueryForm函数
    eventBound(queryCardButton,'click',displayQueryForm);

    //根据用户的权限来显示左边的li内容
    appendLi(sessionGet('power'))
    function appendLi(power){
        var html ='';
        if(power ==='V'){//这里填管理员的权限
            html = '<li class=\"appendButton\">证件添加</li><li class=\"queryButton\">证件查询</li><li class=\"dataButton\">数据统计</li><li class=\"checkButton\">申请审核</li>' +
                '<li class="alertButton">预警信息</li><li class="giveOutButton">证件发放</li><li class="cancelButton">证件注销</li><li class="logOutButton">退出系统</li>'
            $("#buttonList").append(html);
            appendQueryElement(power);
        }else if(power ==='1'){//这里填车间管理人员的权限
            html = '<li class=\"queryButton\">证件查询</li><li class=\"dataButton\">数据统计</li><li class=\"checkButton\">申请审核</li>' +
                '<li class="alertButton">预警信息</li><li class="giveOutButton">证件发放</li><li class="logOutButton">退出系统</li>';
            $("#buttonList").append(html);
            //车间管理人员没有添加和注销功能，移除相应区域
            $("#appendContainer").remove();
            $("#cancelContainer").remove();
            appendQueryElement(power);
        }else if(power ==='0'){//这里填普通人员的权限
            html = '<li class=\"informationButton\">证件信息</li><li class=\"applyButton\">换补申请</li><li class=\"statusButton\">证件状态</li>' +
                '<li class="improveButton">完善信息</li><li class="logOutButton">退出系统</li>';
            $("#buttonList").empty().append(html);
            normalUser();
        }
    }
    //接收参数是权限值，如果是教育科管理人员，显示全部车间，如果是车间管理人员，显示本车间
    function appendQueryElement(power){
        //等待添加内容：在这个函数里，定义 添加查询选项卡里面元素的代码，从参数表取值添加
        //添加选择车间部门的checkbox
        var html='';
        if(power === 'V'){
            $.ajax({
                //取参数表的车间部门名补全部门选项
                //6.13   实现根据权限来渲染不同页面元素。获取车间人员的所属车间，把检索范围规定住。找几个权限不同的测试用户
                url: "../../../index.php",
                type:"POST",
                timeout:8000,
                data:{funcName:'select',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                    tableName:'csxx',column:'name,nr1',where:' where lb = \'ssbm\' ',order:' '},
                dataType:'json',
                success:function(data){
                    delete data['success'];
                    delete data['count'];
                    html = '';
                    for(var i in data){
                        if(data[i]['nr1']!==''){
                        html += '<div><input type="checkbox" id=\"'+data[i]['name']+'\"><label for="'+data[i]['name']+'\">'+data[i]['nr1']+'</label></div>'
                        }
                    }
                    $("#queryCardBanner").prepend(html);
                }
            })
        }else if(power === '1'){
            var department = sessionGet('department').split(',')[0];
            $.ajax({
                url: "../../../index.php",
                type:"POST",
                timeout:8000,
                data:{funcName:'select',serverName:'10.101.62.73',uid:'sa',pwd:'2huj15h1',Database:'JSZGL',
                    tableName:'csxx',column:'name,nr1',where:' where nr1 = \''+department+'\' ',order:' '},
                dataType:'json',
                success:function(data){
                    delete data['success'];
                    delete data['count'];
                    html = '';
                    for(var i in data){
                        if(data[i]['nr1']!==''){
                            html += '<div><input type="checkbox" id=\"'+data[i]['name']+'\"><label for="'+data[i]['name']+'\">'+data[i]['nr1']+'</label></div>'
                        }
                    }
                    $("#queryCardBanner").prepend(html).css('paddingLeft','35%');
                    $("#queryCardBanner input").attr({'checked':'checked','disabled':'true'})
                }
            })
        }
    }
    //给左边的按钮添加事件，更新右边容器的内容
    $("#buttonList li").each(function(){
        $(this).on('click',displayContainer);
    });

    function normalUser(){
        var payId = sessionGet('payId');

    }





    //记住登录时的session
    userSessionInfo = rememberSession('token','user','power','department');
    //渲染页面中需要动态添加的元素(高级搜索中的checkbox)
    appendElement()

    //添加用户高级搜索的选项
    appendSelection();
    $('#column').off('change').on('change',appendSelection);


    //绑定“更多”按钮事件
    $("#more").off('click').on('click',function () {
        if($("#querySelectBanner").attr('class') === 'less'){
            $("#querySelectBanner").dequeue().animate({'height':'0'},700,function(){
                $("#querySelectBanner").attr('class','more');
                $("#more").text('更多...');
            });
        }else {
            $("#querySelectBanner").dequeue().animate({'height':'200px'},700,function(){
                $("#querySelectBanner").attr('class','less');
                $("#more").text('收起');
            });
        }

    });





//lockQueryRange()
//规定查询范围：根据用户的权限及所属车间，限制用户的查询只能在这个车间:如果是高级用户，则不受限制
    function lockQueryRange(){
        var power = sessionGet('power');
        //调试，周一取数据
        $("#lyyy").attr('checked','checked');
        $("#queryCardBanner").children('input').attr("disabled",'disabled')
    }
});