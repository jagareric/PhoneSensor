// TODO:当前基于每次从服务器获得一个新点来设计，或许需要改成获取一组新点
// TODO:考虑到收包顺序的不确定，为确定当前位置，可能需要对点进行编号，编号最靠后的认为是当前位置
// TODO:考虑到数据溢出的风险，或许需要增加自动删除traceData中数据的功能，考虑用array.shift()实现
// TODO:data.json会留一些冗余以应对网络波动，需要增加根据序号筛选掉重复点的功能
// TODO:时间充裕且确有必要的话可以加入根据网络状况(重复数据的量）动态调整下载数据速度的功能
// TODO:时间充裕且确有必要的话可以加入与服务器协商更新数据量的功能
var traceData = [] // 历史点
var pointNum = [] // 已绘制点的编号
var currentNum // 当前点的编号
var currentPoint = [] //当前点
var testPoint //目标点
traceData = [
]
// 设定目标点
testPoint =
    [
        [5.0, 5.0],
        [5.0, 8.0],
        [2.0, 5.0],
        [2.0, 2.0]
    ]
function addData(){
    // 异步加载数据
    $.getJSON('get_location/').done(function (data) {
        // 填入更新的位置数据
        // 当前假定json中只有一个点
        currentNum = data.number
        // 未画过新点时才画
        if (!pointNum.includes(currentNum)){
            console.log(String(currentNum) + ' is drawing')
            currentPoint = data.location
            traceData.push(currentPoint)
            console.log('Trace is ' +　String(traceData))
            console.log('currentPoint' +　[currentPoint])
            pointNum.push(data.number)
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
    });
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
                    icon: 'circle'
                },
                    {
                        name: '当前位置',
                        icon: 'diamond'
                    },
                    {
                        name: '布设目标',
                        icon: 'pin'
                    }]
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
                        type: 'line' // TODO:或可用'scatter'
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
                        data: [
                            [5.0, 5.0],
                            [5.0, 8.0],
                            [2.0, 5.0],
                            [2.0, 2.0]
                        ],
                        name:'布设目标',
                        type: 'scatter'
                    }
                ]
        }
    // },
    // 实现响应式绘图,控制各种情况下的缩放比例，元素布局方式，还没搞定
    //     media: [ // 这里定义了 media query 的逐条规则。
    //         {
    //             query: { minAspectRatio: 1},   // 第一个规则，长宽比大于等于1时
    //             option: {       // 第一个规则满足下的option。
    //                 series: [
    //                     {
    //                         radius: [20, '50%'],
    //                         center: ['25%', '50%']
    //                     }
    //                 ]
    //             }
    //         },
    //         {
    //             query: { maxAspectRatio: 1},   // 第二个规则，长宽比小1时
    //             option: {
    //                 series: [
    //                     {
    //                         radius: [20, '50%'],
    //                         center: ['50%', '30%']
    //                     }
    //                 ]
    //             }
    //         },
    //         {
    //             query: { maxWidth: 500},   // 第二个规则，宽度小于500像素时
    //             option: {
    //                 series: [
    //                     {
    //                         radius: [20, '50%'],
    //                         center: ['50%', '30%']
    //                     }
    //                 ]
    //             }
    //         },
    //         {                   // 这条里没有写规则，表示『默认』，
    //             option: {       // 即所有规则都不满足时，采纳这个option。
    //                 series: [
    //                     {
    //                         radius: [20, '50%'],
    //                         center: ['25%', '50%']
    //                     }
    //                 ]
    //             }
    //         }
    //     ]
};

// 使用刚指定的配置项和数据显示图表。
myChart.setOption(option);
// 窗口大小调整时重新绘图以实现实时响应式
window.addEventListener('resize', () => {
    myChart.resize() // 多个图表，第一个图表
})

// 按钮-开始
var startCode
var drawInterval
$("#start").click(function(){
    recordData = true;
    startTime = Date.now();
});

// 按钮-结束
var finishCode
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
