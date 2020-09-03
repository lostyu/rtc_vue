import EXIF from "exif-js";
const fixUploadRotate = (file)=>{
    return new Promise((resolve,reject)=>{
        EXIF.getData(file, function () {
            const Orientation = EXIF.getTag(this, "Orientation");
            console.log("Orientation>>>>>>", Orientation);
            if (!Orientation || Orientation == 1) {
                console.log("图片无需处理");
                resolve(file);
            }else{
                //转换成base64
                const reader = new FileReader();
                reader.readAsDataURL(file);

                reader.onload = e => {
                    let img = new Image();
                    img.src = e.target.result;
        
                    img.onload = function () {
                        //最大高度，最大宽度，等比缩放
                        const expectWidth = 750;
                        const expectHeight = 1334;
                        let imgWidth = this.width;
                        let imgHeight = this.height;
                        // 控制上传图片的宽高
                        if(imgWidth > imgHeight && imgWidth > expectWidth){
                            imgWidth = expectWidth;
                            imgHeight = Math.ceil(expectWidth * this.height / this.width);
                        }else if(imgWidth < imgHeight && imgHeight > expectHeight){
                            imgWidth = Math.ceil(expectHeight * this.width / this.height);
                            imgHeight = expectHeight;
                        }
        
                        const canvas = document.createElement("canvas"),
                            ctx = canvas.getContext("2d");
                        canvas.width = imgWidth;
                        canvas.height = imgHeight;

                        switch(Orientation){
                            case 6:     // 旋转90度
                                canvas.width = imgHeight;    
                                canvas.height = imgWidth;    
                                ctx.rotate(Math.PI / 2);
                                // (0,-imgHeight) 从旋转原理图那里获得的起始点
                                ctx.drawImage(this, 0, -imgHeight, imgWidth, imgHeight);
                                break;
                            case 3:     // 旋转180度
                                ctx.rotate(Math.PI);    
                                ctx.drawImage(this, -imgWidth, -imgHeight, imgWidth, imgHeight);
                                break;
                            case 8:     // 旋转270度
                                canvas.width = imgHeight;    
                                canvas.height = imgWidth;    
                                ctx.rotate(3 * Math.PI / 2);    
                                ctx.drawImage(this, -imgWidth, 0, imgWidth, imgHeight);
                                break;
                            default:
                                ctx.drawImage(this, 0, 0, imgWidth, imgHeight);
                                break;
                        }
                        //输出转换后的base64图片
                        const base64 = canvas.toDataURL(file.type, 1);
    
                        //输出转换后的流
                        const newFile = dataURLtoFile(file.name, base64);
                        resolve(newFile);

                    };
                }
           

            };
        })
        
    })
}
function dataURLtoFile(filename , dataurl){
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bytes = atob(arr[1]), n = bytes.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bytes.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}
function dataURLtoBlob(dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}
export {
    fixUploadRotate,
    dataURLtoFile,
    dataURLtoBlob
}