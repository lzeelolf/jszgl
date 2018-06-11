$(document).ready(function(){
    var queryCardButton = document.getElementById("queryCardButton");
    initialScreen();
    ///loginStatus();
    //证件查询按钮的事件,调用displayQueryForm函数
    eventBound(queryCardButton,'click',displayQueryForm);
    //给左边的按钮添加事件，更新右边容器的内容
    $("#buttonList li").each(function(){
        $(this).on('click',displayContainer);
    });
    //记住登录时的session
    userSessionInfo = rememberSession('token','user','power');
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