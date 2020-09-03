const transformCurrency = (number, symbol, places, thousand, decimal)=> {
    number = number || 0;
    places = !isNaN(places = Math.abs(places)) ? places : 2;
    symbol = symbol !== undefined ? symbol : "";
    thousand = thousand || ",";
    decimal = decimal || ".";
    let negative = number < 0 ? "-" : "",

        i = parseInt(number = Math.abs(+number || 0).toFixed(places), 10) + "",
        j = i.length;
        j = j > 3 ? j % 3 : 0;
    return symbol + negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) : "");
};
const toCapital = (n)=> {    
    var fraction = ['角', '分'];    
    var digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];    
    var unit = [ ['元', '万', '亿'], ['', '拾', '佰', '仟']  ];    
    var head = n < 0? '欠': '';    
    n = Math.abs(n);    
  
    var s = '';    
  
    for (var i = 0; i < fraction.length; i++)     
    {    
        s += (digit[Math.floor(n * 10 * Math.pow(10, i)) % 10] + fraction[i]).replace(/零./, '');    
    }    
    s = s || '整';    
    n = Math.floor(n);    
  
    for (var i = 0; i < unit[0].length && n > 0; i++)     
    {    
        var p = '';    
        for (var j = 0; j < unit[1].length && n > 0; j++)     
        {    
            p = digit[n % 10] + unit[1][j] + p;    
            n = Math.floor(n / 10);    
        }    
        s = p.replace(/(零.)*零$/, '').replace(/^$/, '零')  + unit[0][i] + s;    
    }    
    return head + s.replace(/(零.)*零元/, '元').replace(/(零.)+/g, '零').replace(/^整$/, '零元整');    
}
const formatSpectTime = (value,fmt) =>{
    let toDate = value.match(/^\d*$/) ? parseInt(value) : value;
    let getDate = new Date(toDate);
    let o = {
      'M+': getDate.getMonth() + 1,
      'd+': getDate.getDate(),
      'h+': getDate.getHours(),
      'm+': getDate.getMinutes(),
      's+': getDate.getSeconds(),
      'q+': Math.floor((getDate.getMonth() + 3) / 3),
      'S': getDate.getMilliseconds()
    };
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (getDate.getFullYear() + '').substr(4 - RegExp.$1.length))
    }
    for (let k in o) {
      if (new RegExp('(' + k + ')').test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)))
      }
    }
    return fmt;
}
const transformMoney= (v)=>{
  // 将 金额/类金额/数字转换 成 金额数字（最多2位小数）;
  if(v){
    let s=String(v);
    let num=Number(s.replace(/\,/g,''));
    if(isNaN(num)){
      return 0;
    }else{
      return Number(num.toFixed(2));
    }
    // result = Number( .toFixed(2) );
    // result = s;
  }else{
    return 0;
  }

}
const toHttps = (v)=>{
  if(v){
      return v.replace(
          "http://",
          "https://"
      )
  }
  return '';
}
export {
    transformCurrency,
    toCapital,
    formatSpectTime,
    transformMoney,
    toHttps
}
