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
export function updateMultRelationPosition(graph)
{
    var edges = graph.edges
    //大于3000个关系，不处理，避免影响效率，后续 添加根据当前缩放比例控制是否显示
    if(edges.length>3000)
        return;
    var sameEdgesCount = {};
    for(var i = 0;i<edges.length;i++)
    {
        var edge = graph.getEdgeByIndex(i);
        var key = edge.node1["id"]+'-'+edge.node1["id"];
        if(!sameEdgesCount[key])
            sameEdgesCount[key] = [1,1];
        else
            sameEdgesCount[key][0]++;
    }
    for(var i = 0;i<edges.length;i++)
    {
        var edge = graph.getEdgeByIndex(i);
        var key = edge.node1["id"]+'-'+edge.node1["id"];
        if(sameEdgesCount[key][0] == 1)
            continue;
        var offset = 0;
        //区分单双数处理情况
        if(sameEdgesCount[key][0] %2 ==0)
        {
            offset = Math.floor((sameEdgesCount[key][1]-1)/2)*20+10;
            offset = sameEdgesCount[key][1]%2==0?-offset:offset;
        }
        else
        {
            if(sameEdgesCount[key][1] ==1)
            {
                sameEdgesCount[key][1]++;
                continue;
            }
            else
            {
                offset = Math.floor((sameEdgesCount[key][1])/2)*20;
                offset = sameEdgesCount[key][1]%2==0?offset:-offset;
            }
        }
        var layout = edge.getLayout();
        var x = layout[1][0] - layout[0][0];
        var y = layout[1][1] - layout[0][1];
        var sin = x/Math.sqrt(Math.pow(x,2)+Math.pow(y,2))
        var cos = y/Math.sqrt(Math.pow(x,2)+Math.pow(y,2))
        layout[0][0] = layout[0][0] + offset*cos;
        layout[0][1] = layout[0][1] - offset*sin;

        layout[1][0] = layout[1][0] + offset*cos;
        layout[1][1] = layout[1][1] - offset*sin;
        edge.setLayout(layout);
        sameEdgesCount[key][1]++;
    }
}
//TODO:song 解决node之间多连线重叠问题 -----------------------------------------

