window.onload = function () {

    var COLOR_1 = "#1093a7",  COLOR_2 = "#24454c",   COLOR_3 = "#def2f3", COLOR_4 = "#589ba4",  WHITE_COLOR = "#ffffff", BLACK_COLOR = "#000", WEIGHT_COLOR = "#4816ea",
        CURRENT_VERTEX_COLOR = "#ff3300", CURRENT_EDGE_COLOR = "#ff3300",DISABLED_COLOR = "#808080", VISIT_VERTEX_COLOR = "#808080", VISIT_EDGE_COLOR = "#808080",
        ADJACENCY_VERTEX_COLOR = "#ffffcc",START_VERTEX_COLOR = "#00ff00",DEFAULT_VERTEX_COLOR = "#ffffff",DEFAULT_EDGE_COLOR = "#000";


    var canvas,ctx, graph, render, dragNode,dragPoint, firstSelectedNode = undefined, startVertex = undefined; 
 
    var idRow,  distancesRow, prevVertexRow,  infoField,sendInfo,send_pathInfo;

    
    infoField = document.getElementById("info_field");
    
    sendInfo = function (info) {    infoField.innerHTML += "> " + info + "<br>";   infoField.scrollTop = 9999;   };
    var Testing = [];
    
    send_pathInfo = function (Testing) {   path_info_field.innerHTML += " -> " + Testing + "<br>";   path_info_field.scrollTop = 9999;  };

    var currentBtn,  prevStyle,  btnCreateVertex, btnCreateEdge, btnStart, btnPause, btnStop,btnView, btnClearGraph,btnNextStep, btnSelectStartVertex,btnCreateRandomGraph, graphBtns; 


    btnCreateVertex = document.getElementById('btnCreateVertex');    btnCreateEdge = document.getElementById('btnCreateEdge');
    btnView = document.getElementById('btnView');  btnClearGraph = document.getElementById('btnClearGraph');
    btnCreateRandomGraph = document.getElementById("btnCreateRandomGraph");

    btnCreateVertex.addEventListener("click", function (event) { changeCurrentButton(btnCreateVertex);  });
    btnCreateEdge.addEventListener("click", function (event) {   changeCurrentButton(btnCreateEdge);    });
    btnView.addEventListener("click", function (event) {    changeCurrentButton(btnView);    });
    btnClearGraph.addEventListener("click", function (event) {   clearGraph();    render();    });
    btnCreateRandomGraph.addEventListener("click", function (event) { createRandomGraph();  });

    btnStart = document.getElementById("btnStart");   btnStart.disabled = true;
    btnStart.addEventListener("click", function (event) {
        currentStep = startDijkstra;   btnStop.disabled = false;  btnPause.disabled = false;  btnStart.disabled = true;  isStopped = false;  isPaused = false;
        nextStep(currentStep, 1);
    });


    btnPause = document.getElementById("btnPause");     btnPause.disabled = true;
    btnPause.addEventListener("click", function (event) 
    {
        if(isPaused)
        {         changeContinueButton();   nextStep(currentStep, 1);       } 
        else
        {    isPaused = true;    btnNextStep.disabled = false;    btnPause.innerHTML = "Continue";  clearTimeout(nextTimer);  }
    });

    
    btnStop = document.getElementById("btnStop");     btnStop.disabled = true;
    btnStop.addEventListener("click", function (event)
     {
        clearTimeout(nextTimer);       isStopped = true;               btnStop.disabled = true;      isPaused = false;      btnStart.disabled = false;
        changeContinueButton();        btnPause.disabled = true;      clearAlgorithmInfo();
        sendInfo("Chọn <b>Đỉnh nguồn (Đỉnh xuất phát)</b>và nhấn<b>Start</b> để bắt đầu quá trình mô phỏng thuật toán");
        setGraphBtnsDisabledProperty(false);     render();
    });

    btnNextStep = document.getElementById("btnNextStep");   btnNextStep.disabled = true;
    btnNextStep.addEventListener("click", function (event) {
        isSkipped = true;     nextStep(currentStep);
    });

    btnSelectStartVertex = document.getElementById("btnSelectStartVertex");
    btnSelectStartVertex.addEventListener("click", function (event) {
        changeCurrentButton(btnSelectStartVertex);
    });


    var clearAlgorithmInfo = function () {
        infoField.innerHTML = "";      distances = [];   flags = [];   edgesIdToPrevVertex = [];
        for(var i = 0; i < graph.nodes.length; i++){
            graph.setNodeColor(i, DEFAULT_VERTEX_COLOR);         distancesRow.cells[i + 1].innerHTML = "";      prevVertexRow.cells[i + 1].innerHTML = "";
        }
        startVertex.color = START_VERTEX_COLOR;
        for(var i = 0; i < graph.edges.length; i++){
            graph.setEdgeColor(i, DEFAULT_EDGE_COLOR);
        }

      
    };

    graphBtns = [btnView, btnCreateVertex, btnCreateEdge, btnCreateRandomGraph, btnClearGraph, btnSelectStartVertex];

    var setGraphBtnsDisabledProperty = function(bool) {
        graphBtns.forEach(function(btn) {       btn.disabled = bool;       });
        if(bool)
        {
            currentBtn.style = prevStyle;
        }
        else 
        {
            setStyleToCurrentButton(currentBtn);
        }
    };

    var setStyleToCurrentButton = function (btn) {
        prevStyle = btn.style;        btn.style.backgroundColor = "#ffffff";       btn.style.border = "2px solid #589ba4";     btn.cssText += "-webkit-transition-duration: 0s; transition-duration: 1s;";
    };
    currentBtn = btnView; 
    setStyleToCurrentButton(currentBtn);

    var changeCurrentButton = function (button) {
        if(firstSelectedNode !== undefined)     firstSelectedNode.node.color = firstSelectedNode.prevColor;       firstSelectedNode = undefined;      render();
        currentBtn.style = prevStyle;          currentBtn = button;         setStyleToCurrentButton(currentBtn);
    };

    var clearGraph = function () {
        graph = Graph();        startVertex = undefined;      btnStart.disabled = true;
        [idRow, distancesRow, prevVertexRow].forEach(function(row)
         {
            for(var i = row.cells.length - 1 ; i >= 1; i--){
                row.deleteCell(i);
            }
        });
    };

    var Graph = function(){
      return {
          nodes: [],    edges: [],    vertexRange: 17,
          createNode: function(pos, id) {
              return {
                  x: pos.x,         y: pos.y,         id: id,       color: DEFAULT_VERTEX_COLOR,      edges: []
              }
          },

          getNode: function (ind) {     return this.nodes[ind];    },

          setNodeColor: function (ind, color) {      this.nodes[ind].color = color;       render();         },

          createEdge: function(from, to, weight, id) 
          {
                 return {       id: Number(id),     color: DEFAULT_EDGE_COLOR,    from: Number(from),     to: Number(to),    weight: Number(weight)             }
          },
          setEdgeColor: function (ind, color)
           {
              this.edges[ind].color = color;       render();
          }
      };
    };
    graph = Graph();
    canvas = document.getElementById('canvas');                     idRow = document.getElementById('tr_id');   
    distancesRow = document.getElementById('tr_distances');        prevVertexRow = document.getElementById('tr_prev_vertex');
   
    ctx = canvas.getContext('2d');


    render = function () {
        ctx.fillStyle = WHITE_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        graph.edges.forEach(function (edge) {
            var from = getNodeById(edge.from),
                to = getNodeById(edge.to);
            ctx.fillStyle = BLACK_COLOR;
            ctx.strokeStyle = edge.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
            ctx.font = "24px Arial";
            ctx.textAlign = "right";
            ctx.textBaseline = "bottom";
            ctx.lineWidth = 2.5;
            ctx.fillStyle = WEIGHT_COLOR;
            ctx.fillText(edge.weight.toString(), (from.x + to.x) / 2, (from.y + to.y) / 2);
        });


        graph.nodes.forEach(function (node) {
            ctx.beginPath();
            ctx.fillStyle = node.color;
            ctx.strokeStyle = BLACK_COLOR;
            ctx.arc(node.x, node.y, graph.vertexRange, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = BLACK_COLOR;
            ctx.font = "30px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText( ((node.id)+1).toString(), node.x, node.y);
        });
    };

    var getNodeById = function (id) {
        var result = undefined;
        graph.nodes.forEach(function (node) {
            if (node.id === id) {
                result = node;
            }
        });
        return result;
    };

    var getMousePosFromEvent = function (evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,        y: evt.clientY - rect.top
        };
    };

    var getNodeByPos = function (pos) {
        var result = undefined;
        graph.nodes.forEach(function (node) {
            if ((node.x - pos.x) * (node.x - pos.x) + (node.y - pos.y) * (node.y - pos.y)    <=       graph.vertexRange * graph.vertexRange) 
            {
                result = node;
            }
        });
        return result;
    };


    canvas.addEventListener('mousedown', function (event) 
    {
        if (currentBtn !== btnView) {
            return;
        }
        var pos = getMousePosFromEvent(event);      dragNode = getNodeByPos(pos);
        if (dragNode !== undefined) {
            dragPoint = {
                x: pos.x - dragNode.x,     y: pos.y - dragNode.y
            }
        }
    });



    canvas.addEventListener('mouseup', function () {
        dragNode = undefined;
    });


    canvas.addEventListener('click', function (event) {
        var pos = getMousePosFromEvent(event);
        switch (currentBtn.id) {
            case "btnCreateVertex":         createVertex(pos);          break;
            case "btnCreateEdge":           createEdge(pos);            break;
            case "btnSelectStartVertex":    selectStartVertex(pos);     break;
            default: return;
        }
        render();
    });


    var createVertex = function (pos) {
        var id = graph.nodes.length;
        var header = idRow.insertCell(id + 1);
        header.innerHTML = "<b>" + (id + 1).toString() + "</b>";
        distancesRow.insertCell(id + 1);
        prevVertexRow.insertCell(id + 1);
        graph.nodes.push(graph.createNode(pos, id));
    };
    

    var addEdgeToGraph = function (from, to, weight) {
        var edge1 = graph.createEdge(from, to, Number(weight), graph.edges.length),
            edge2 = graph.createEdge(to, from, Number(weight), graph.edges.length);

            graph.nodes[from].edges.push(edge1);
            graph.nodes[to].edges.push(edge2);
            graph.edges.push(edge1);
    };
    


    var createEdge = function (pos) 
    {
        var node = getNodeByPos(pos);
        if(node === undefined || (firstSelectedNode !== undefined && node.id === firstSelectedNode.node.id)) return;
        var prevColor = node.color;     node.color = CURRENT_VERTEX_COLOR;
        if (firstSelectedNode === undefined)
         { 
            firstSelectedNode = {
                node: node,      prevColor: prevColor
            };
        } 
        else 
        {
            var weight = prompt("Nhập độ dài cạnh (Mức độ hao phí) (Tối đa là 50):");
            while(Number.isNaN(Number(weight)) || Number(weight) > 60){
                weight = prompt("Hãy nhập lại cho đúng (Tối đa là 50):")
            }
            if (weight) 
            {
                var firstId = firstSelectedNode.node.id,   secondId = node.id;
                addEdgeToGraph(firstId, secondId, weight);
            }
            firstSelectedNode.node.color = firstSelectedNode.prevColor;       node.color = prevColor;      firstSelectedNode = undefined;
        }
    };

    var selectStartVertex = function (pos) {
        if(startVertex !== undefined) startVertex.color = DEFAULT_VERTEX_COLOR;

        startVertex = getNodeByPos(pos);
        if(startVertex === undefined) return;
        startVertex.color = START_VERTEX_COLOR;
        btnStart.disabled = false; 
    };


    var createRandomGraph = function () {
        clearGraph();
        var vertexCount;
        while((
            vertexCount = prompt("Nhập số lượng đỉnh (Tối đa là 4) \nLưu ý đồ thị có đôi lúc không được vẽ rõ ràng\nVì vậy hãy random tiếp nếu bị lỗi nhé")) > 4);
        if(!vertexCount) return;
        var verticesPos = [];
        var getRandomValue = function (limit) {
            return Math.floor(Math.random()*1000) % limit;
        };

        var compareCoordinateForCompatibility = function (pos1, pos2, withWhat) {
            return Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2) > withWhat * withWhat;
        };
        var getRandomPos = function() {
            var checkBorders = function (pos) {
                var range = graph.vertexRange * 2;

                if(pos.x < range){
                    pos.x += range;
                }
                if(canvas.width - pos.x < range){
                    pos.x -= range;
                }
                if(pos.y < range){
                    pos.y += range;
                }
                if(canvas.height - pos.y < range){
                    pos.y -= range;
                }
                return pos;
            };
            return checkBorders({
                x: getRandomValue(canvas.width),
                y: getRandomValue(canvas.height)
            });
        };

        
        var checkPosCompatibility = function (pos) {
            var check = true;
            verticesPos.forEach(function(iter) {
                check = check && compareCoordinateForCompatibility(pos, iter, graph.vertexRange * 4);
            });
            return check;
        };



        for(var i = 0; i < vertexCount; i++){
            var pos = getRandomPos();
            while(!checkPosCompatibility(pos)){
                pos = getRandomPos();
            }
            verticesPos.push(pos);
            createVertex(pos);
        }



        var adjacencyMatrix = new Array(vertexCount);
        for(var i = 0; i < vertexCount; i++){
            adjacencyMatrix[i] = new Array(vertexCount);
        }
        for(var i = 0; i < vertexCount; i++){
            for(var j = i; j < vertexCount; j++){
                if(i !== j ){
                    addEdgeToGraph(i, j, Math.floor(Math.random() * 9));
                }
            }
        }
        render();
    };



    var distances,     flags,     edgesIdToPrevVertex;
    var INFINITY_CHAR = "&#8734";
    var setDistance = function(ind, num) {
        distancesRow.cells[ind + 1].innerHTML = num !== Number.MAX_VALUE ? num.toString() : INFINITY_CHAR;
        distances[ind] = Number(num);
    };

    var setPrevVertex = function(to, from) {
        prevVertexRow.cells[to + 1].innerHTML = (from + 1).toString();
    };


    var getMinVertex = function() {
        var min = Number.MAX_VALUE;
        var index = -1;

        for(var i = 0; i < graph.nodes.length; i++){
            if(!flags[i] && distances[i] < min){
                min = distances[i];
                index = i;
            }
        }
        return (min < Number.MAX_VALUE) ? index : false;
    };

    var speedSelect,  getSpeed,   nextStep,  nextTimer,  currentStep,
        isStopped = false,    isPaused = false,      isSkipped = false,
        changeContinueButton,     isPauseOrStop,     currentVertex,     edges,      edge,     prevColor;

    speedSelect = document.getElementById("speed_select");
    getSpeed = function () {
        return Number(speedSelect.options[speedSelect.options.selectedIndex].value);
    };

    changeContinueButton = function () {
        isPaused = false;     btnNextStep.disabled = true;       btnPause.innerHTML = "Pause";
    };


    nextStep = function (func, timeInSec) {
        if(isSkipped){
            isSkipped = false;
            func();
            return;
        } else if(isPauseOrStop(func)) return;

        nextTimer = setTimeout(func, timeInSec*1000*(1/getSpeed()));
    };

    isPauseOrStop = function (func) {
        currentStep = func;
        return isStopped || isPaused;
    };

    var startDijkstra = function() {
        setGraphBtnsDisabledProperty(true);      clearAlgorithmInfo();      sendInfo("Start algorithm...");    nextStep(setFirstDistances, 1);
    };

    var setFirstDistances = function () {
        sendInfo("Đặt giá trị khoảng cách ban đầu cho tất cả các đỉnh<br>" +
        "Đối với đỉnh xuất phát ban đầu thì giá trị khoảng cách của nó cũng chính là 0, các đỉnh khác ta tạm thời gán giá trị "+ INFINITY_CHAR);
        for(var i = 0; i < graph.nodes.length; i++){
            setDistance(i, Number.MAX_VALUE);
            flags[i] = false;
        }
        edgesIdToPrevVertex = new Array(graph.nodes.length);
        setDistance(startVertex.id, 0);
        setPrevVertex(startVertex.id, "-");
        nextStep(checkVerticesStep, 3);
    };
    


    var checkVerticesStep = function () 
    {
        currentVertex = getMinVertex();
        if(currentVertex === false) {
            sendInfo("---------<b>Tất cả các đỉnh đã được duyệt</b>-------------");
            nextStep(endDijkstra, 3);
            return;
        }

        sendInfo("--------------------------------------------------------------");
        sendInfo("Chọn đỉnh có khoảng cách nhỏ nhất (tính từ đỉnh nguồn đến)<br>" +
            "ID của đỉnh có khoảng cách nhỏ nhất là <b>" + (currentVertex + 1) + "</b>");
        send_pathInfo(currentVertex+1);
            
        flags[currentVertex] = true;
        graph.setNodeColor(currentVertex, CURRENT_VERTEX_COLOR);
        edges = [];
        graph.getNode(currentVertex).edges.forEach(function(edge) {
            edges.push(graph.createEdge(edge.from, edge.to, edge.weight, edge.id));
        });

        sendInfo("Duyệt tất cả các cạnh xuất phát từ đỉnh <b>" + (currentVertex + 1) + "</b> này...");
        nextStep(checkEdgesStep, 3);
    };


    var checkEdgesStep = function() {
        if(edges.length > 0) checkEdgeStep();
        else {
            sendInfo("<u> Tất cả các cạnh kề xuất phát từ đỉnh </u> <b>"+ (currentVertex + 1 ) +"</b> <u> này đã được kiểm tra rồi </u> \n");
            sendInfo("------------------------------------------------------------");
            graph.setNodeColor(currentVertex,(currentVertex !== startVertex.id)
                ? VISIT_VERTEX_COLOR : START_VERTEX_COLOR);
            nextStep(checkVerticesStep, 3);
        }
    };



    var checkEdgeStep = function () {
        edge = edges.pop();
        while(flags[edge.to]){
            edge = edges.pop();
            if(edge === undefined) {
                checkEdgesStep();
                return;
            }
        }

        sendInfo("Cạnh từ đỉnh <b>" + ( (edge.from) + 1 ) + "</b> đến đỉnh <b>" + ( (edge.to) + 1 ) + "</b> với độ dài (độ hao phí) là <b>" + edge.weight + "</b>");
        prevColor = graph.getNode(edge.to).color;
        graph.setNodeColor(edge.to, ADJACENCY_VERTEX_COLOR);
        nextStep(checkDistancesStep, 3);
    };


    var checkDistancesStep = function () 
    {
        var newDistance = Number(distances[currentVertex]) + Number(edge.weight);
        if(newDistance < distances[edge.to]) 
        {

            var message = "Khoảng cách từ cạnh này ngắn hơn cạnh hồi nãy: <b>" + newDistance +   " <= ";
            message += distances[edge.to] !== Number.MAX_VALUE ? distances[edge.to].toString() : INFINITY_CHAR;
            sendInfo(message + "</b>");
            setDistance(edge.to, newDistance);
            setPrevVertex(edge.to, edge.from);
           
            if(edgesIdToPrevVertex[edge.to] !== undefined)
                graph.setEdgeColor(edgesIdToPrevVertex[edge.to], VISIT_EDGE_COLOR);
                edgesIdToPrevVertex[edge.to] = edge.id;
                graph.setEdgeColor(edge.id, CURRENT_EDGE_COLOR);
        }
         else
         {
            sendInfo("Khoảng cách từ cạnh này dài hơn cạnh hồi nãy: <b>"  + Number(distances[currentVertex]) + "+"  + Number(edge.weight) +   " >= " + distances[edge.to].toString());
            graph.setEdgeColor(edge.id, VISIT_EDGE_COLOR);
         }
        graph.setNodeColor(edge.to, prevColor);
        nextStep(checkEdgesStep, 3);
    };

    var endDijkstra = function () {
        sendInfo("\n<b>Mô phỏng thuật toán đã kết thúc. Cảm ơn thầy cô và các bạn đã xem</b>");
        isStopped = false;   btnPause.disabled = true;  isPaused = false;         changeContinueButton();
    };
    render();
};