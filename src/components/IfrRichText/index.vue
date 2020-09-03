<template>
    <div class="richText-virtual">
        <van-popup
            v-model="init"
            position="right"
            class="ui-page page-richText"
            :class="{hide:!showRule}"
            :lock-scroll="false"
            :overlay="false"
        >
            <iframe src="/__richText__" ref="ifr"></iframe>
        </van-popup>
    </div>
</template>
<script>
export default {
    data(){
        return {
            init:true
        }
    },
    computed:{
        showRule(){
            return this.value;
        }
    },
    props:['content',"value"],
    mounted(){
        const content = this.content;
        this.$refs.ifr.onload = function(){
            this.contentWindow.postMessage(content,'*');   
        }

    },
}
</script>
<style lang="stylus" scoped>
.page-richText{
    iframe{
        border:0;
        position:absolute;
        top:0;
        bottom:0;
        left:0;
        right:0;
        width: 100%;
        height: 100%;
    }
    &.hide{
        display:none !important;
    }

}
</style>
