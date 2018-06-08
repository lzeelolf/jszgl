$(document).ready(function(){
    //一来到登录界面，首先清session中的登录信息
    sessionRemove('user');
    sessionRemove('token');
    sessionRemove('power');
    //登录按钮
    var loginBtn = document.getElementById('login');
    loginBtn.onclick = login;
    resizePage();
    //缩放窗口，获取body当前尺寸来重新定义元素的高度
    $(window).resize(function() {
        //选出body的height属性并截取数值部分
        resizePage()
    });
    //绑定登录事件
    $("#username").keyup(function(event){
        if(event.keyCode ===13){
            login()
        }
    });
    $("#password").keyup(function(event){
        if(event.keyCode ===13){
            login()
        }
    });
});