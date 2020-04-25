// array.splice(第几个数开始，删除几个数，要添加的数据)
async function position()
{
    var i = 2, s = 50, q0= [[1],[0],[0],[0]], v0 = [[0],[0],[0]], s0 = [[0],[0],[0]];
    var H0= [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
    var q1, v1, s1, H1;
    // 下标1表示是当前值，下标0存储的上一时刻点的值
    // i是对当前进行到第几个点的标号 s是由于需要求加速度的前后各s个点的方差
    var id, ax, ay, az, wx, wy, wz, T;
    var returnData;
    while(1)
    {
        // TODO:数据读取的部分暂时还空着，假设这个部分已经正常读取了
        var data0 = CalPath.chain().where(function (obj) { return obj.id === (i-1) }).data()[0];
        var data1 = CalPath.chain().where(function (obj) { return obj.id === i }).data()[0];
        // 这里是再从内存数据库中提取我们所存储的数据，data1表示当前时间点 data0表示上一时间点。
        id = data1.id;
        wx = data1.wx;
        wy = data1.wy;
        wz = data1.wz;
        ax = data1.ax;
        ay = data1.ay;
        az = data1.az;
        T = data1.time - data0.time;

        if (wx === 10 && wy === 10 && wz === 10 && ax === 10 &&  ay === 10 && az === 10)
        {
            break;
            //这里是选了一个平时不可能达到的各个加速度和角度度值来作为数据的结尾
        }
        var C = zero_judge(s, i, ax, ay, az, wx, wy, wz);
        if (C===0)
        {
            i = i + 1;
            wx = wy = wz = ax = ay = az = 0;
            v1 = v0;
            data1.vx = v1[0];
            data1.vy = v1[1];
            data1.vz = v1[2];
            data1.sx = s0[0]+v1[0]*T;
            data1.sy = s0[1]+v1[1]*T;
            data1.sz = s0[2]+v1[2]*T;
            // 判断为0加速度，则保持原速度不变前进T秒，数据存入
            continue;
        }
        H1 = [[0,-wx,-wy,-wz],[wx,0,wz,-wy],[wy,-wz,0,wx],[wz,wy,-wx,0]];
        // H矩阵为角速度所构成的四维角速度矩阵
        q1 = q1_cal(q0, H0, H1, T);
        // q即为四元数矩阵4*1
        var obj = pos_cal(ax, ay, az, T, q1, v0, s0);
        data1.sx = obj.s1;
        data1.sy = obj.s2;
        data1.sz = obj.s3;
        data1.vx = obj.v1;
        data1.vy = obj.v2;
        data1.vz = obj.v3;
        // 此处把数据写入进数据库中，然后重置此处数组
        returnData = {number: id, location:[obj.s1,obj.s2,obj.s3]};
        addData2(returnData);
        // 调用画图函数
        v0 = v1;
        s0 = s1;
        H0 = H1;
        q0 = q1;
        i = i+1;
        // 重置数据

    }
}

function zero_judge(s, i, ax, ay, az, wx, wy, wz)
{
    th=0.01;
    var a_var, data2, am=[], c=1;
    a = math.sqrt(ax ** 2 + ay ** 2 + az ** 2);
    w = math.sqrt(wx ** 2 + wy ** 2 + wz ** 2);
    // a和w就是当前点的加速度和角速度幅值
    if( a < th && w < th)
    {
        if(s<i)
        {
            // TODO: 采集前后共2s+1组数据,求加速度方差
            data2 = CalPath.chain().where(function (obj) { return obj.id >= i-s && obj.id <= i+s }).data();
            for(k=0; k<2*s+1; k++)
            {
                am[k] = math.sqrt(data2[k].ax ** 2 + data2[k].ay ** 2 + data2[k].az ** 2);
            }
            a_var = math.variance(am);
            //求方差
        }
        else
        {
            // TODO: 采集s+i组数据,求加速度方差
            data2 = CalPath.chain().where(function (obj) { return obj.id >= 1 && obj.id <= i+s }).data();
            for(k=0; k<s+i; k++)
            {
                am[k] = math.sqrt(data2[k].ax ** 2 + data2[k].ay ** 2 + data2[k].az ** 2);
            }
            a_var = math.variance(am);
            //求方差
        }
        if(a_var < th)
        {
            c = 0;
        }
    }
    return c;
}
// 这个函数是计算q1四元数矩阵的
function q1_cal(q0, H0, H1, T)
{
    var zj = math.multiply(T, H0, q0);
    zj = math.multiply(H1,math.add(q0, zj));
    zj = math.multiply(0.5*T, math.add(math.multiply(H0, q0),zj));
    q1 = math.add(q0, zj);
    return q1;
}
// 这个函数是通过加速度和时间计算出最终位置信息
function pos_cal(ax, ay, az, T, q1, v0, s0)
{
    var q00, q11, q22, q33, c1, c2, c3, c4, c5, c6, c7, c8, c9, G, V, S, C;
    q00 = q1[0];
    q11 = q1[1];
    q22 = q1[2];
    q33 = q1[3];
    // q00 q11 q22 q33分别是四元数矩阵中的四个值，单独取出方便计算
    c1 = q00^2+q11^2-q22^2-q33^2;
    c2 = 2*(q11*q22+q00*q33);
    c3 = 2*(q11*q33-q00*q22);
    c4 = 2*(q11*q22-q00*q33);
    c5 = q00**2-q11**2+q22**2-q33**2;
    c6 = 2*(q22*q33+q00*q11);
    c7 = 2*(q11*q33+q00*q22);
    c8 = 2*(q22*q33-q00*q11);
    c9 = q00**2-q11*2-q22**2+q33**2;
    C = [[c1,c2,c3],[c4,c5,c6],[c7,c8,c9]];
    // C即为姿态结算矩阵
    // c1-c9分别是3*3矩阵中的各个区域的值
    a = [[ax],[ay],[az]];
    G = [[0],[0],[-g]];
    a = math.add(math.multiply(C,a),G);
    // 减去竖直方向上的重力加速度影响
    V = math.add(v0, math.multiply(a, T));
    S = math.add(s0, math.multiply(T,v0), math.multiply(0.5, T ** 2, a))
    sx = S[0];
    sy = S[1];
    sz = S[2];
    vx = V[0];
    vy = V[1];
    vz = V[2];
    return {s1:sx, s2:sy, s3:sz, v1:vx, v2:vy, v3:vz};
}