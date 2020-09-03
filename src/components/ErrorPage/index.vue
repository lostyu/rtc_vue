<template>
  <div class="ui-page page-error">
    <div class="ui-content">
        <div class="error-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" fill="#DBE1EC" viewBox="0 0 48 48">
                <path d="M22 30h4v4h-4zm0-16h4v12h-4zm1.99-10C12.94 4 4 12.95 4 24s8.94 20 19.99 20S44 35.05 44 24 35.04 4 23.99 4zM24 40c-8.84 0-16-7.16-16-16S15.16 8 24 8s16 7.16 16 16-7.16 16-16 16z" />
            </svg>
            <div class="error-msg">{{enhancedError.message}}</div>   
        </div>


        
    </div>
  </div>
</template>

<script>
export default {
    data(){

        return {
            
            enhancedError:this.enhanceError(this.error)
        }
    },
    props:['error'],
    methods:{
        enhanceError(error){

            // console.log(error.message)
            //EBADREQUEST,EAXIOSFAIL,EDEFAULT
            let enhancedError = {
                type:"EDEFAULT",
                message:error.message
            }
            return enhancedError;
        }
    },
    mounted(){
        console.log(this.error.message)
    }
}
</script>

<style scoped lang="scss">
.error-container{
    position:absolute;
    top:0;
    left:0;
    width:100%;
    height:100%;
    display:flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
}
.error-msg{
    font-size: 0.32rem;
    margin-top: 0.15rem;
    padding:0 1rem;
    color: #47494E;
    margin-bottom: 0.0rem;
    word-break: break-word;
    text-align: center;
}
</style>
