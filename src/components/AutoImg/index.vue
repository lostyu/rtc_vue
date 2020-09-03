<template>
    <div class="autoImg-container" ref="autoImg"
    :style="{
        'background-image':`url(${loadSrc})`,
    }">
        <img :src="src" @load="load" :onerror="onerror" ref="img" v-if="reloadControl">
    </div>
</template>
<script>
export default {
    data(){
        return{
          displayWidth:'0',
          displayHeight:'0',
          loadSrc:"",
          reloadControl:true
        }
    },
    components: {
    },
    props:['width',"height","src","onerror"],
    methods:{
        load(){
            // 只展示最终加载成功的图片！；
            if(!this.loadSrc){
                // 注意图片还未加载时，销毁了这个组件,则$refs.img不存在了
                this.loadSrc=this.$refs.img&&this.$refs.img.src;
            }
        }
    },
    watch:{
        src(){
            this.loadSrc = "";
            this.reloadControl = false;
             this.$nextTick(()=>{
                this.reloadControl = true;
            })
        }
    },
    created(){
       
    },
    mounted(){
        // let img = new Image();
        // img.src = this.src;
        // console.log(this.$refs.autoImg.parentNode);
        // img.onload = () => {
        //     console.log(img);
        //     console.log(img.naturalWidth)
        //     if(!this.width && !this.height){
        //         //未设置宽，也未设置高，则默认展示原始宽高
        //         this.displayWidth = img.naturalWidth + 'px';
        //         this.displayHeight = img.naturalHeight + 'px';
        //         console.log(this);
        //     }else if(this.width && !this.height){
        //         //设置宽，则高度自适应;
        //         const unit = this.width.match(/(\D)*$/)[0];
        //         const width = this.width.replace(unit,'');
        //         console.log(width);
        //         console.log(unit);
    
        //         this.displayWidth = this.width;
        //         if(unit == "%"){

        //         }
 
        //         this.displayHeight = this.width * ( this.naturalHeight/ img.naturalWidth);
        //         
        //     }

  
        // }
    },
}
</script>
<style scoped lang="scss">
.autoImg-container{
    background-size:cover;
    background-position: center center;
    width:100%;
    height:100%;
    overflow: hidden;
    img{
        visibility: hidden;
        width:100%;
        height:100%;
    }
}
</style>
