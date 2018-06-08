/**
 * Created by ThinkPad on 2016/5/17.
 */
 function createAjax(_method,_url,_asyn,_function,_data){
    function createXMLHttpRequest() {
        try {
            return new window.XMLHttpRequest();
        } catch (e) {
            try {
                return new ActiveXObject("MSXML2.XMLHTTP.6.0");
            } catch (e) {
                try {
                    return new ActiveXObject("MSXML2.XMLHTTP.3.0");
                } catch (e) {
                    try {
                        return new ActiveXObject("MSXML2.XMLHTTP");
                    } catch (e) {
                        alert("this browser don't support JS");
                    }
                }
            }

        }
    }

    var _ajax = new createXMLHttpRequest();
    if (_ajax) {
        _ajax.onreadystatechange = function () {
            if (_ajax.readyState == 4 && _ajax.status == 200) {
                //alert(_ajax.responseText);
                _function(_ajax.responseText);
            }
        }
        _ajax.open(_method,_url,_asyn);
        _ajax.setRequestHeader("content-type", "application/x-www-form-urlencoded;charset=utf-8");
        _ajax.send(_data);
    }
}
