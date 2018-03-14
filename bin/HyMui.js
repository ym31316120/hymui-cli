if(process.argv.length>2){
    require('../dist/index').run(process.argv[2]);
}else{
    console.error('缺少启动的任务名参数,请输入需要运行的任务名');
}