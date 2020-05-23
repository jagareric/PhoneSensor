// 下标1表示是当前值，下标0存储的上一时刻点的值
q0 = q1 = [[1],[0],[0],[0]];
v0 = v1 = [0,0,0];
s0 = s1 = [0,0,0];
H0 = H1 = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];

function position(data_pre, data_now, data_post){
    // 调用本函数的时候就已经从内存数据库中提取所存储的数据
    // data_now表示当前时间点 data_pre表示前五十个点的数据，同理data_post为后五十个点，总共101个点。
    var id, ax, ay, az, wx, wy, wz, T;
    var returnData;
    // 在数据库里面的数据量足够的情况下提取数据，否则会出现读取错误
    id = data_now.id;
    wx = data_now.wx;
    wy = data_now.wy;
    wz = data_now.wz;
    //把角速度从°/s转换成rad/s
    wx = wx * Math.PI / 180;
    wy = wy * Math.PI / 180;
    wz = wz * Math.PI / 180;
    ax = data_now.ax;
    ay = data_now.ay;
    az = data_now.az;
    //滑动均值滤波
    // var N = 51; // N = numberPre + 1;
    // var sumdata_ax = 0;
    // var sumdata_ay = 0;
    // var sumdata_az = 0;
    // var sumdata_wx = 0;
    // var sumdata_wy = 0;
    // var sumdata_wz = 0;
    // for (let i = 0; i < 50; i++) {
    //     sumdata_ax = sumdata_ax + data_pre[i].ax;
    //     sumdata_ay = sumdata_ay + data_pre[i].ay;
    //     sumdata_az = sumdata_az + data_pre[i].az;
        // sumdata_wx = sumdata_wx + data_pre[i].wx;  //角速度先不要滤波，可能出现差错
        // sumdata_wy = sumdata_wy + data_pre[i].wy;
        // sumdata_wz = sumdata_wz + data_pre[i].wz;
    // }
    // ax = (sumdata_ax + data_now.ax) / N;
    // ay = (sumdata_ay + data_now.ay) / N;
    // az = (sumdata_az + data_now.az) / N;
    // wx = (sumdata_wx + data_now.wx) / N;
    // wy = (sumdata_wy + data_now.wy) / N;
    // wz = (sumdata_wz + data_now.wz) / N;
    
    T = (data_now.time - data_pre[49].time) * 0.001;
    // data_pre[49]为当前时刻的上一时刻点
    var c = zero_judge(data_pre, data_now, data_post);

    if(c===0){  // 0加速度条件下
        wx = wy = wz = ax = ay = az = 0;
        // 判断为0加速度，则保持原速度不变前进T秒
        // s1[0] = s0[0] + v0[0] * T;
        // s1[1] = s0[1] + v0[1] * T;
        // s1[2] = s0[2] + v0[2] * T;
        //判断为0速度时刻，则认为此刻人站立没动，不产生位移
        s1[0] = s0[0] ;
        s1[1] = s0[1] ;
        s1[2] = s0[2] ;
        // 画图
        returnData = {number: id, location:[s1[0],s1[1],s1[2]]}  //重要的返回数组
        addData2(returnData);
        s0 = s1;
        v0 = [0,0,0];
        //q0 = [[1],[0],[0],[0]]; //！！！四元数重置不能重置成1000，需要重置为前一个时刻的四元数！！！
        H0 = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];  // 重置4维化角速度矩阵，因视作静止，角速度计0
    }

    if(c===1){// 非0加速度条件下
        H1 = [[0,-wx,-wy,-wz],[wx,0,wz,-wy],[wy,-wz,0,wx],[wz,wy,-wx,0]];  // 四维角速度矩阵
        q1 = q1_cal(T);  // 四元数矩阵4*1
        pos_cal(ax, ay, az, T);  // 计算得到当前点的位置，把数据写入进数据库中，然后重置此处数组
        returnData = {number: id, location:[s1[0],s1[1],s1[2]]};
        // console.log(s1[0],s1[1],s1[2]);
        //不用把所有的点都画出来
        addData2(returnData);  // 调用画图函数，传入的参数为当前点的数据唯一标识和三维位置坐标
        // 重置速度，位置，角速度，四元数 数据
        v0 = v1;
        s0 = s1;
        H0 = H1;
        q0 = q1;
    }
}

function zero_judge(data_pre, data_now, data_post){
    var th1=0.5, th2=5, s=50;
    var a_var, am=[], c=1;
    a = math.sqrt(data_now.ax ** 2 + data_now.ay ** 2 + data_now.az ** 2);
    w = math.sqrt(data_now.wx ** 2 + data_now.wy ** 2 + data_now.wz ** 2);
    am[s] = a;
    // a和w为当前点的加速度和角速度幅值
    if( a < th1 && w < th2){
        // 采集前后共2s+1组数据,求加速度方差
        // 提取前五十个数据
        for(k=0; k<s; k++){
            am[k] = math.sqrt(data_pre[k].ax ** 2 + data_pre[k].ay ** 2 + data_pre[k].az ** 2);
        }
        // 提取后五十个数据
        for(k=0; k<s; k++){
            am[k+51] = math.sqrt(data_post[k].ax ** 2 + data_post[k].ay ** 2 + data_post[k].az ** 2);
        }
        //求方差
        a_var = math.variance(am);
        if(a_var < th1)
        {
            c = 0;
        }
    }
    return c;
}

// 计算q1四元数矩阵
function q1_cal(T){
    var zj = math.multiply(T, H0, q0);
    zj = math.multiply(H1,math.add(q0, zj));
    zj = math.multiply(0.5*T, math.add(math.multiply(H0, q0),zj));
    q1 = math.add(q0, zj);
    q1_all = math.sqrt(q1[0][0] ** 2 + q1[1][0] ** 2 + q1[2][0] ** 2+ q1[3][0] ** 2);
    q1[0][0] = q1[0][0] / q1_all;
    q1[1][0] = q1[1][0] / q1_all;
    q1[2][0] = q1[2][0] / q1_all;
    q1[3][0] = q1[3][0] / q1_all;
    return q1;
}
// 通过加速度和时间计算出最终位置信息
function pos_cal(ax, ay, az, T){
    var a, q00, q11, q22, q33, c1, c2, c3, c4, c5, c6, c7, c8, c9, G, V, S, C, g=9.8;
    // q00 q11 q22 q33分别是四元数矩阵中的四个值，单独取出方便计算
    q00 = q1[0][0];
    q11 = q1[1][0];
    q22 = q1[2][0];
    q33 = q1[3][0];

    // 3*3矩阵中的各个区域的值
    c1 = q00**2+q11**2-q22**2-q33**2;
    c2 = 2*(q11*q22+q00*q33);
    c3 = 2*(q11*q33-q00*q22);
    c4 = 2*(q11*q22-q00*q33);
    c5 = q00**2-q11**2+q22**2-q33**2;
    c6 = 2*(q22*q33+q00*q11);
    c7 = 2*(q11*q33+q00*q22);
    c8 = 2*(q22*q33-q00*q11);
    c9 = q00**2-q11**2-q22**2+q33**2;
    // C = [[c1,c2,c3],[c4,c5,c6],[c7,c8,c9]];  // 姿态解算矩阵
    C = [[c1,c4,c7],[c2,c5,c8],[c3,c6,c9]];
    a = [[ax],[ay],[az]];
    a = math.multiply(C,a);
    v1[0] = v0[0] + a[0][0] * T;
    v1[1] = v0[1] + a[1][0] * T;
    v1[2] = v0[2] + a[2][0] * T;
    s1[0] = s0[0] + v0[0] * T + 0.5 * T * T * a[0][0];
    s1[1] = s0[1] + v0[1] * T + 0.5 * T * T * a[1][0];
    s1[2] = s0[2] + v0[2] * T + 0.5 * T * T * a[2][0];
    // v1[0] = v0[0] + a[0] * T;
    // v1[1] = v0[1] + a[1] * T;
    // v1[2] = v0[2] + a[2] * T;
    // s1[0] = s0[0] + v0[0] * T + 0.5 * T * T * a[0];
    // s1[1] = s0[1] + v0[1] * T + 0.5 * T * T * a[1];
    // s1[2] = s0[2] + v0[2] * T + 0.5 * T * T * a[2];  
}