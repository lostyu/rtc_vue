export default function getTopDomain(host) {
  host = host.toLowerCase();

  var topLevelDomain,
    matched,
    domain = /[a-z0-9][a-z0-9\-]*[a-z0-9]\.[a-z\.]{2,6}$/i;
    matched = host.match(domain);
    topLevelDomain = matched ? matched[0] : "";
  return topLevelDomain;
  
};

// export function getMainDomain() {
//     let key  = `mh_${Math.random()}`;
//     let keyR = new RegExp( `(^|;)\\s*${key}=12345` );
//     let expiredTime = new Date( 0 );
//     let domain = document.domain;
//     let domainList = domain.split( '.' );
   
//     let urlItems   = [];
//     // 主域名一定会有两部分组成
//     urlItems.unshift( domainList.pop() );
    
//     // 慢慢从后往前测试
//     while( domainList.length ) {
//       urlItems.unshift( domainList.pop() );
//       let mainDomain = urlItems.join( '.' );
//       let cookie   = `${key}=${12345};domain=.${mainDomain}`;
   
//       document.cookie = cookie;
   
//       //如果cookie存在，则说明域名合法
//       if ( keyR.test( document.cookie ) ) {
//         document.cookie = `${cookie};expires=${expiredTime}`;
//         return mainDomain;
//       }
//     }
// }