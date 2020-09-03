<template>
    <div  @click="clickHandle" :class="{disabled:wait != 0}">{{wait==0?'发送验证码':`${wait}s`}}</div>
</template>
<script>
import Reg from '~/utils/reg'
export default {
    data(){
        return{
            wait:0
        }
    },
    components: {
    },
    props:{
        phone:{
            required:true,
            type:String
        },
        onSendCodeError:{
            type:Function
        }
    },
    methods:{
        sendCodeError(err){
            if(err.type==1){
                this.$toast(err.msg)
            }
        },
        clickHandle(){
            let isMobile=Reg.isMobile;
            let handleError=this.onSendCodeError||this.sendCodeError;
            let timer = null;
            if(this.phone!='*'){
                if(this.phone==''){
                    handleError({type:1,msg:'手机号不能为空'});
                    return;
                }
                if(!this.phone.match(isMobile)){
                    handleError({type:1,msg:'您输入的手机号无效，请更正后重试'});
                    return;
                }
            }
            if(this.wait != 0){
                handleError({type:2,msg:'尚在等待中'});
                return;
            }
            var countDown=()=>{
                if(this.wait==0){
                    clearInterval(timer);
                    return;
                }
                this.wait--;
            }
            this.wait = 60;
            clearInterval(timer);
            timer=setInterval(countDown,1000);
            this.$emit('send',this.phone);

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
    },
}
</script>
<style scoped lang="scss">

</style>
