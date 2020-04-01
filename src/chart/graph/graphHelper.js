/*
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements.  See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership.  The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance
* with the License.  You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
*/

export function getNodeGlobalScale(seriesModel) {
    var coordSys = seriesModel.coordinateSystem;
    if (coordSys.type !== 'view') {
        return 1;
    }

    var nodeScaleRatio = seriesModel.option.nodeScaleRatio;

    var groupScale = coordSys.scale;
    var groupZoom = (groupScale && groupScale[0]) || 1;
    // Scale node when zoom changes
    var roamZoom = coordSys.getZoom();
    var nodeScale = (roamZoom - 1) * nodeScaleRatio + 1;

    return nodeScale / groupZoom;
}

export function getSymbolSize(node) {
    var symbolSize = node.getVisual('symbolSize');
    if (symbolSize instanceof Array) {
        symbolSize = (symbolSize[0] + symbolSize[1]) / 2;
    }
    return +symbolSize;
}

//TODO:song 解决node之间多连线重叠问题 -----------------------------------------
export function updateMultRelationPosition(graph,seriesModel)
{
    var edges = graph.edges
    //大于3000个关系，不处理，避免影响效率，后续 添加根据当前缩放比例控制是否显示
    if(edges.length>3000)
        return;
    var sameEdgesCount = {};
    for(var i = 0;i<edges.length;i++)
    {
        var edge = graph.getEdgeByIndex(i);
        if(!edge)
            continue;
        var key = edge.node1["id"]+'-'+edge.node2["id"];
        var curveness = edge.getModel().get('lineStyle.curveness') || 0;
        if (+curveness)
        {
            if(!sameEdgesCount[key])
                sameEdgesCount[key] = [1,1];
            else
                sameEdgesCount[key][0]++;
        }
        else
        {
            var key2 = edge.node2["id"]+'-'+edge.node1["id"];
            if(!sameEdgesCount[key] && !sameEdgesCount[key2])
                sameEdgesCount[key] = [1,1];
            else if(sameEdgesCount[key])
                sameEdgesCount[key][0]++;
            else if(sameEdgesCount[key2])
                sameEdgesCount[key2][0]++;
        }
    }
    //连线之间偏移量
    var scale =getNodeGlobalScale(seriesModel);
    var vector = 16*scale;
    for(var i = 0;i<edges.length;i++)
    {
        var edge = graph.getEdgeByIndex(i);
        if(!edge)
            continue;
        var key = edge.node1["id"]+'-'+edge.node2["id"];
        var isReverse = false;
        if(!sameEdgesCount[key])
        {
            key = edge.node2["id"]+'-'+edge.node1["id"];
            isReverse = true;
        }
        if(sameEdgesCount[key][0] == 1 && edge.node1.id !=edge.node2.id)
            continue;
        var offset = 0;
        //区分单双数处理情况
        //双数，奇数、偶数往不同方向移动
        //单数，第一条边位置不变，其余边按奇偶数往不同方向移动
        if(sameEdgesCount[key][0] %2 ==0)
        {
            offset = Math.floor((sameEdgesCount[key][1]-1)/2)*vector+vector/2;
            offset = sameEdgesCount[key][1]%2==0?-offset:offset;
        }
        else
        {
            if(sameEdgesCount[key][1] ==1 && edge.node1.id !=edge.node2.id)
            {
                sameEdgesCount[key][1]++;
                continue;
            }
            else
            {
                offset = Math.floor((sameEdgesCount[key][1])/2)*vector;
                offset = sameEdgesCount[key][1]%2==0?offset:-offset;
            }
        }
        var layout = edge.getLayout();
        var x = layout[1][0] - layout[0][0];
        var y = layout[1][1] - layout[0][1];
        if(isReverse)
        {
            x = -x;
            y = -y;
        }
        var sin = x/Math.sqrt(Math.pow(x,2)+Math.pow(y,2))
        var cos = y/Math.sqrt(Math.pow(x,2)+Math.pow(y,2))
        //如果是弧线，弧线中间点也得处理 
        var curveness = edge.getModel().get('lineStyle.curveness') || 0;
        if (+curveness)
        {
            if(edge.node1.id !=edge.node2.id)
            {
                layout[2][0] =layout[2][0] + offset*cos;
                layout[2][1] = layout[2][1] - offset*sin;
            }
            else
            {
                //处理边起点和终点都是自己的情况
                var symbolSize = edge.node1.getModel().get("symbolSize");
                if(!symbolSize)
                    symbolSize = 60;
                symbolSize = (symbolSize/2)*scale;
                layout[0][0] =layout[0][0] - symbolSize;
                layout[0][1] =layout[0][1] +symbolSize;
                layout[1][0] = layout[1][0] +symbolSize;
                layout[1][1] =layout[1][1] +symbolSize;
                layout[2][1] = layout[2][1] - symbolSize*(3+sameEdgesCount[key][1]);
            }
        }
        else
        {
            layout[0][0] = layout[0][0] + offset*cos;
            layout[0][1] = layout[0][1] - offset*sin;
            layout[1][0] = layout[1][0] + offset*cos;
            layout[1][1] = layout[1][1] - offset*sin;
        }
        edge.setLayout(layout);
        // console.log(i+"x1:"+layout[0][0]+"y1:"+layout[0][1]+"x2:"+layout[1][0]+"y2:"+layout[1][1])
        sameEdgesCount[key][1]++;
    }
}
//TODO:song 解决node之间多连线重叠问题 -----------------------------------------