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
                        if(data[i]['fsjRemark']!==''){
                            __html += '<option value=\"'+data[i]['fsjRemark']+'\">'+data[i]['fsjRemark']+'</option>';
                        }
                    }
                    __html += '</select>';
                    $("#valueDiv").empty().append(__html)
                }
            })

        }else if(column === 'fsjDriveCode' || column ==='sjDriveCode'){
            _html = '属于';
            __html = '这里是准驾代码';
        }else if(column === 'fsjDriveType' || column==='sjDriveType'){
            _html = '属于';
            __html = '这里是准驾类型';
        }else if(column === 'deadline'){
            _html = '<select name=\"selectType\" id=\"selectType\"><option value="please">--请选择--</option><option value=\"greater\">大于</option><option value=\"less\">小于</option><option value=\"between\">介于</option></select>';
        }else{
            _html = '等于';
            __html = '这里是证件状态'
        }
        $("#selectTypeDiv").empty().append(_html);
        $("#valueDiv").empty().append(__html);
        $('#selectType').off('change').on('change',appendValue);
    }
    function appendValue(){
        var selectType = $("#selectType").val()? $("#selectType").val() : $("#selectType").text();
        var column = $("#column").val();
        var _html ='';
        if((selectType === 'less' || selectType ==='greater') && (column === 'payId' || column === 'archivesId' || column === 'age')){
            _html = '<input type=\"text\" id=\"value\"/>';
        }else if((selectType === 'earlier' || selectType ==='later') && (column === 'fsjDate' || column === 'sjDate')){
            //input type=date 标签只有chrome支持，IE和FF都不支持
            //_html = '<input type=\"date\" id=\"value\"/>';
            _html = '<input type=\"text\" id=\"value\"/>';
        }else if((selectType === 'between') && (column === 'payId' || column === 'archivesId' || column === 'age')){
            _html = '<input type="text" id="value1"/>至<input type="text" id="value2"/>之间'
        }else if((selectType === 'between') && (column === 'fsjDate' || column === 'sjDate')){
            _html = '<input type="text" id="value1"/>至<input type="text" id="value2"/>之间'
        }else if((selectType === 'less' || selectType ==='greater') && column === 'deadline'){
            _html = '这里是生于事件';
        }else if((selectType === 'between') && column === 'deadline'){
            _html = '这里是生于事件2';
        }
        $("#valueDiv").empty().append(_html)
}

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