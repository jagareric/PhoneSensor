var traceData = [] // 历史点
var pointNum = [] // 已绘制点的编号
var currentNum // 当前点的编号
var currentPoint = [] //当前点，仅包含x,y坐标
var testPoint //目标点
//已绘制的点的数组，只含x,y坐标
traceData = []
// 目标点数组，只含x,y
testPoint = []
// 目标点数组，含x,y,z
targetList = []

async function addData2(data){
    // 异步加载数据
    // 传入数据：{number: id, location: [x, y, z]}
    // 填入更新的位置数据
    currentNum = data['number']
    // 未画过新点时才画
    if (!pointNum.includes(currentNum)){

        console.log('id:' + String(currentNum) + ' is drawing')
        // currentPoint = data['location']
        let temp = data['location']
        temp[2] = temp[2] + parseFloat(beginHeight) //添加初始高度
        $("#currentX").val(String(temp[0]));  //页面上获取并显示当前点的x,y,z坐标
        $("#currentY").val(String(temp[1]));
        $("#currentZ").val(String(temp[2]));
        // console.log('当前显示坐标为 ' +　String(temp))
        currentPoint = [temp[0], temp[1]]  //从position计算的函数结果的返回值得到当前点的x,y坐标
        traceData.push(currentPoint) //当前点坐标push进历史点数组
        // console.log('Trace is ' +　String(traceData))
        console.log('currentPoint' +　' (' + [currentPoint] + ')')
        calcNext(targetList,temp) //计算当前点和最近距离的目标点之间的调整量，并把差值显示出来
        pointNum.push(currentNum)  //当前点编号push进已绘制点编号数组
//当traceData中的数据，150个画一次历史轨迹？
        myChart.setOption({
            series:
                [
                    {
                        // 根据名字对应到相应的系列
                        name: '轨迹',
                        data: traceData
                    },
                    {
                        // 根据名字对应到相应的系列
                        name: '当前位置',
                        data: [currentPoint]
                    }]
        });
    }
}

// 基于准备好的dom，初始化echarts实例
var myChart = echarts.init(document.getElementById('main'));
// 指定图表的配置项和数据
var option = {
    // 指定图表的配置项和数据
    baseOption:
        {
            xAxis: {},
            yAxis: {},
            // 图例
            legend: {
                data: [{
                    name: '轨迹',
                    },
                    {
                        name: '当前位置',
                    },
                    {
                        name: '布设目标',
                    },
                    {
                        name: '最近路径'
                    }
                ]
            },
            // 悬停时显示点坐标
            tooltip: {
                // formatter: 'X: {c0}[0]<br />Y: {c0}[1]'
                formatter: function (params) {
                    var data = params.data || [0, 0];
                    return 'X: ' + data[0] + '<br />Y: ' + data[1];
                }
            },
            series:
                [
                    {
                        symbol:'circle',
                        symbolSize: 5,
                        color: '#0099CC',
                        data:[],
                        name:'轨迹',
                        type: 'line' 
                    },
                    {
                        symbolSize: 20,
                        symbol: 'diamond',
                        color: '#000000',
                        data: [],
                        name:'当前位置',
                        type: 'scatter'
                    },
                    {
                        symbolSize: 20,
                        symbol: 'pin',
                        color: '#CC3333',
                        data: [],
                        name:'布设目标',
                        type: 'scatter'
                    },
                    {
                        symbol:'circle',
                        symbolSize: 5,
                        color: '#90B44B',
                        data:[],
                        name:'最近路径',
                        type: 'line'
                    }
                ]
        }
};

// 使用刚指定的配置项和数据显示图表。
myChart.setOption(option);
// 窗口大小调整时重新绘图以实现实时响应式
window.addEventListener('resize', () => {
    myChart.resize() 
})

// 按钮-开始
$("#start").click(function(){
    recordData = true;
    startTime = Date.now();
});

// 按钮-结束
$("#finish").click(function(){
    recordData = false;
});

// 按钮-清除轨迹
$("#clearTrace").click(function(){
    traceData = []
    myChart.setOption({
        series:[
            {
                name: '轨迹',
                data: traceData
            }]
    });});

// 按钮-重置
$("#reload").click(function(){
    location.reload(); // 刷新当前页面
});

// 按钮-设置初始高度
var beginHeight = 0;
$("#setHeight").click(function(){
    let temp = $("#beginHeight").val();
    if ($.isNumeric(temp)){ // 为数字的时候才继续执行
        beginHeight = temp; //把人为输入进去的初始数赋给beginHeight
    }
    else {
        console.log('输入数据非数字');
    }
    console.log('初始高度为' + String(beginHeight))
});

// 按钮-设置目标
$("#setTarget").click(function(){
    let targetX,targetY,targetZ
    targetX = $("#targetX").val()
    targetY = $("#targetY").val()
    targetZ = $("#targetZ").val()
    if ($.isNumeric(targetX)&&$.isNumeric(targetY)&&$.isNumeric(targetZ)){ // 只有全为数字的时候才继续执行
        let targetAdd = [targetX,targetY]
        testPoint.push(targetAdd) // 这里抛弃了targetZ，把targetAdd的新数据push进testPoint目标点数组
        let targetAdd2 = [targetX,targetY,targetZ]
        targetList.push(targetAdd2) //保留targetZ，目的是计算当前点坐标和目标的三维坐标差值，给出调整量
        console.log('当前增加目标为 ' +　String(targetAdd))
        console.log('全部目标为 ' +　String(testPoint))
        myChart.setOption({
            series:[
                {
                    name: '布设目标',
                    data: testPoint
                }]
        });
    }
    else {
        console.log('输入数据非数字')
    }
});


// 用于遍历的函数，输入目标坐标和当前坐标，返回差值数组，差值很重要
function calcDelta(target,current){
    return [target[0]-current[0],target[1]-current[1],target[2]-current[2]];
}

// 用于求距离的函数，输入差值数组，返回绝对值之和，曼哈顿距离
function calcDistance(delta) {
    return Math.abs(delta[0]) + Math.abs(delta[1]) + Math.abs(delta[2]);
}

// 遍历目标点数组(let i in targetList)，求差值用于求最近路径和调整量，用于画图时调用
// current应是加了初始高度的
async function calcNext(targetList,current) {
    let deltaList = [];
    let distanceList = [];
    if(targetList.length !== 0){
        console.log('求最近距离！')
        for(let i in targetList) { //遍历含z的目标点数组
            let temp = calcDelta(targetList[i],current); //计算所有差值
            deltaList.push(temp)
            distanceList.push(calcDistance(temp)) //根据坐标差值更新距离
        }
        let min = Math.min.apply(null, distanceList); //求出最小距离
        let nextIndex = distanceList.indexOf(min); // 求出最小距离的索引
        let deltaNext = deltaList[nextIndex] //根据最小距离的索引反推出到达距离最小的目标的调整量
        console.log('最小距离为：' +　String(min))
        console.log('最近点为：' +　String(targetList[nextIndex]))
        console.log('delta为：' +　String(deltaNext))
        $("#deltaX").val(String(deltaNext[0]));
        $("#deltaY").val(String(deltaNext[1]));
        $("#deltaZ").val(String(deltaNext[2]));
        myChart.setOption({
            series:[
                {
                    name: '最近路径',
                    data: [
                        [targetList[nextIndex][0],targetList[nextIndex][1]],
                        [current[0],current[1]]
                    ]
                }]
        });
    }
}
