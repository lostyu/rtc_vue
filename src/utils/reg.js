const Reg={
        /*手机*/
       isMobile:new RegExp(/^1[0-9]{10}$/),
       /*邮箱*/
       isEmail:new RegExp(/^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/),
       /*数字、字母、字符6位以上*/
       isPwd:new RegExp(/([a-zA-Z0-9#@!~%^&*_\-]){6,20}/),
       /*身份证*/
       isIdCard:new RegExp(/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/),

       isIPHost:new RegExp(/^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])(\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])){3}(\:([0-9]|[1-9]\d{1,3}|[1-5]\d{4}|6[0-5]{2}[0-3][0-5]))?$/)
}
export default Reg;