window.onload = function () {

    //Màu sắc trạng thái của đỉnh và cạnh
    var COLOR_1 = "#1093a7",  COLOR_2 = "#24454c",   COLOR_3 = "#def2f3", COLOR_4 = "#589ba4",  WHITE_COLOR = "#ffffff", BLACK_COLOR = "#000", WEIGHT_COLOR = "#4816ea",
        CURRENT_VERTEX_COLOR = "#ff3300", CURRENT_EDGE_COLOR = "#ff3300",DISABLED_COLOR = "#808080", VISIT_VERTEX_COLOR = "#808080", VISIT_EDGE_COLOR = "#808080",
        ADJACENCY_VERTEX_COLOR = "#ffffcc",START_VERTEX_COLOR = "#00ff00",DEFAULT_VERTEX_COLOR = "#ffffff",DEFAULT_EDGE_COLOR = "#000";


    //Khai báo liên quan đến canvas
    var canvas,ctx, graph, render, dragNode,dragPoint, firstSelectedNode = undefined, startVertex = undefined; 
 
    //Các đối tượng trong bảng "Khoảng cách"
    var idRow,  distancesRow, prevVertexRow,  infoField,sendInfo;

    
    infoField = document.getElementById("info_field");
    
    sendInfo = function (info) {    infoField.innerHTML += "> " + info + "<br>";   infoField.scrollTop = 9999;   };
    

    ///Khai báo các button
    var currentBtn,  prevStyle,  btnCreateVertex, btnCreateEdge, btnStart, btnPause, btnStop,btnView, btnClearGraph,btnNextStep, btnSelectStartVertex,btnCreateRandomGraph, graphBtns,btnCreateRandomGraph; 
    
    /* Khu vực kiểm soát thời gian, tốc độ chạy thuật toán */
    //Các biến liên quan đến tốc độ, tạm dừng, bước kế tiếp,...
    var speedSelect,  getSpeed,   nextStep,  nextTimer,  currentStep,
    isStopped = false,    isPaused = false,      isSkipped = false,
    changeContinueButton,     isPauseOrStop,     currentVertex,     edges,      edge,     prevColor;

    //Chọn tốc độ chạy chương trình
    speedSelect = document.getElementById("speed_select");
    getSpeed = function () {
        return Number(speedSelect.options[speedSelect.options.selectedIndex].value);
    };

    //Khi nhấn nút continue trong lúc chương trình đang tạm dừng
    //Thay đổi tên nhãn (label button name) của continue thành pause và vô hiệu hóa nút "Bước kế tiếp"
    changeContinueButton = function () {
        isPaused = false;     btnNextStep.disabled = true;       btnPause.innerHTML = "Pause";
    };


    //Bước kế tiếp - Hay còn gọi là chạy từng bước
    nextStep = function (func, timeInSec) {
        if(isSkipped)
        {
            isSkipped = false;   func();   return;
        } 
        else if(isPauseOrStop(func)) return;

        nextTimer = setTimeout(func, timeInSec*1000*(1/getSpeed()));
    };

    //Kiểm tra trạng thái của chương trình
    //Xem nó có đang ở chế độ "Tạm dừng" hoặc bị bấm "Stop" hay không
    isPauseOrStop = function (func) {
        currentStep = func;
        return isStopped || isPaused;
    };


    //Kết nối button với đối tượng html 
    btnCreateVertex = document.getElementById('btnCreateVertex');    btnCreateEdge = document.getElementById('btnCreateEdge');
    btnView = document.getElementById('btnView');                    btnClearGraph = document.getElementById('btnClearGraph');
    btnCreateRandomGraph = document.getElementById("btnCreateRandomGraph");

    //Bắt sự kiện click chuột cho từng button trong "Khu vực đồ thị"
    btnCreateVertex.addEventListener("click", function (event) { changeCurrentButton(btnCreateVertex);  });
    btnCreateEdge.addEventListener("click", function (event) {   changeCurrentButton(btnCreateEdge);    });
    btnView.addEventListener("click", function (event) {    changeCurrentButton(btnView);    });
    btnClearGraph.addEventListener("click", function (event) {   clearGraph();    render();    });

    //Bắt sự kiện chạy thuật toán
    btnStart = document.getElementById("btnStart");   btnStart.disabled = true;
    btnStart.addEventListener("click", function (event) {
        currentStep = startDijkstra;   btnStop.disabled = false;  btnPause.disabled = false;  btnStart.disabled = true;  isStopped = false;  isPaused = false;
        nextStep(currentStep, 1);
    });


    //Bắt sự kiện tạm dừng thuật toán
    btnPause = document.getElementById("btnPause");     btnPause.disabled = true;
    btnPause.addEventListener("click", function (event) 
    {
        if(isPaused)
        {         changeContinueButton();   nextStep(currentStep, 1);       } 
        else
        {    isPaused = true;    btnNextStep.disabled = false;    btnPause.innerHTML = "Continue";  clearTimeout(nextTimer);  }
    });


    //Bắt sự kiện dừng hẳn chương trình
    btnStop = document.getElementById("btnStop");     btnStop.disabled = true;
    btnStop.addEventListener("click", function (event)
     {
        clearTimeout(nextTimer);       isStopped = true;               btnStop.disabled = true;      isPaused = false;      btnStart.disabled = false;
        changeContinueButton();        btnPause.disabled = true;      clearAlgorithmInfo();
        sendInfo("Chọn <b>Đỉnh nguồn (Đỉnh xuất phát)</b>và nhấn<b>Start</b> để bắt đầu quá trình mô phỏng thuật toán");
        setGraphBtnsDisabledProperty(false);     render();
    });

    //Bắt sự kiện bước kế tiếp
    //Chỉ khả dụng khi chương trình đang ở chế độ "Tạm dừng"
    btnNextStep = document.getElementById("btnNextStep");   btnNextStep.disabled = true;
    btnNextStep.addEventListener("click", function (event) {
        isSkipped = true;     nextStep(currentStep);
    });


    //Bắt sự kiện tạo đồ thị ngẫu nhiên
    btnCreateRandomGraph = document.getElementById("btnCreateRandomGraph");
    btnCreateRandomGraph.addEventListener("click", function (event) {
        createRandomGraph();
    }, false);

    //Bắt sự kiện chọn đỉnh bắt đầu
    btnSelectStartVertex = document.getElementById("btnSelectStartVertex");
    btnSelectStartVertex.addEventListener("click", function (event) {
        changeCurrentButton(btnSelectStartVertex);
    });


    var createRandomGraph = function () {
        clearGraph();

        // Ask vertex count
        // Hỏi số lượng đỉnh
        var vertexCount;
        while((
            vertexCount = prompt("Enter vertices count (Maximum is 4) \nLưu ý đồ thị có đôi lúc không được vẽ rõ ràng\nVì vậy hãy random tiếp nếu bị lỗi nhé")) > 4);
        if(!vertexCount) return;

        // Save vertices position to colibrate their
        // Lưu vị trí của từng đỉnh
        var verticesPos = [];

        //Lấy giá trị ngẫu nhiên (Cho độ dài cạnh, tọa độ x,y,...)
        var getRandomValue = function (limit) {
            return Math.floor(Math.random()*1000) % limit;
        };

        //Lấy tọa độ ngẫu nhiên
        var getRandomPos = function() {
            // For vertices don't touch the borders of canvas 
            // Ngăn chặn đỉnh không vượt qua viền của canvas
            var checkBorders = function (pos) {
                //range là bán kính hình tròn 
                var range = graph.vertexRange * 2;

                if(pos.x < range){                   pos.x += range;   }

                if(canvas.width - pos.x < range){    pos.x -= range;   }

                if(pos.y < range){                   pos.y += range;    }

                if(canvas.height - pos.y < range){   pos.y -= range;    }
                return pos;
            };
            return checkBorders({
                //Kiểm tra từng tọa độ x,y của đỉnh
                x: getRandomValue(canvas.width),  y: getRandomValue(canvas.height)
            });
        };

        // Generate vertices
        // Tạo ra các đỉnh
        for(var i = 0; i < vertexCount; i++){
            var pos = getRandomPos();
         
            verticesPos.push(pos);
            createVertex(pos);
        }


        // Create adjacency matrix to generate random edges
        //Tạo ra ma trận cạnh kề để tạo các cạnh ngẫu nhiên nối giữa các đỉnh
        var adjacencyMatrix = new Array(vertexCount);
        for(var i = 0; i < vertexCount; i++){
            adjacencyMatrix[i] = new Array(vertexCount);
        }

        // For all pair of different vertices generate edges (If random want it)
        // Đối với các cặp đỉnh khác nhau. Ta ngẫu nhiên tạo cảnh cho chúng
        // Dĩ nhiên giá trị sẽ random từ 0 tới 9 theo hàm Math.floor(Math.random() * 9)
        for(var i = 0; i < vertexCount; i++){
            for(var j = i; j < vertexCount; j++){
                //Lưu ý nếu i,j trùng nhau thì ta xem chúng như là 1 đỉnh (Không thể tạo cạnh được)
                if(i !== j ){
                    addEdgeToGraph(i, j, Math.floor(Math.random() * 9));
                }
            }
        }
        render();
    };


    //Xóa bảng thông tin, mỗi khi bắt đầu chạy thuật toán
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



    //Danh sách các button "Khu vực đồ thị"
    graphBtns = [btnView, btnCreateVertex, btnCreateEdge, btnCreateRandomGraph, btnClearGraph, btnSelectStartVertex];

    //Vô hiệu hóa các nút bấm bên "Khu vực đồ thị"
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

    //Xóa đồ thị, xóa hình vẽ lẫn dữ liệu 
    var clearGraph = function () {
        graph = Graph();        startVertex = undefined;      btnStart.disabled = true;
        [idRow, distancesRow, prevVertexRow].forEach(function(row)
         {
            for(var i = row.cells.length - 1 ; i >= 1; i--){
                row.deleteCell(i);
            }
        });
    };

    //Khởi tạo đồ thị hình học
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

    //Gán hàm Graph() vào biến graph
    //idRow, distancesRow,prevVertexRow là các hàng trong "Bảng thông tin khoảng cách"
    //Distance là khoảng cách, preVertex là đỉnh kề trước đỉnh đang xét mà nó được duyệt hồi nãy
    graph = Graph();
    canvas = document.getElementById('canvas');                     idRow = document.getElementById('tr_id');   
    distancesRow = document.getElementById('tr_distances');        prevVertexRow = document.getElementById('tr_prev_vertex');
   
    //Sử dụng đồ họa 2D của canvas
    ctx = canvas.getContext('2d');


    //Hàm phụ trách vẽ đồ thị
    render = function () {
        ctx.fillStyle = WHITE_COLOR;       ctx.fillRect(0, 0, canvas.width, canvas.height);
        graph.edges.forEach(function (edge)
         {
            var from = getNodeById(edge.from),   to = getNodeById(edge.to);
            ctx.fillStyle = BLACK_COLOR;        ctx.strokeStyle = edge.color;
            ctx.lineWidth = 1.5;                ctx.beginPath();
                                                ctx.moveTo(from.x, from.y);    ctx.lineTo(to.x, to.y);
                                                ctx.stroke();                  ctx.font = "24px Arial";
                                                ctx.textAlign = "right";       ctx.textBaseline = "bottom";
                                                ctx.lineWidth = 2.5;           ctx.fillStyle = WEIGHT_COLOR;
                                                ctx.fillText(edge.weight.toString(), (from.x + to.x) / 2, (from.y + to.y) / 2);
        });

        graph.nodes.forEach(function (node) {
            ctx.beginPath();
            ctx.fillStyle = node.color;                                     ctx.strokeStyle = BLACK_COLOR;
            ctx.arc(node.x, node.y, graph.vertexRange, 0, 2 * Math.PI);     ctx.fill();       ctx.stroke();
            ctx.fillStyle = BLACK_COLOR;      ctx.font = "20px Arial";      ctx.textAlign = "center";
            ctx.textBaseline = "middle";       ctx.fillText( ((node.id)+1).toString(), node.x, node.y);
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


    //Hàm bắt tọa độ chuột khi ta tạo đỉnh, tạo cạnh,...
    var getMousePosFromEvent = function (evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,        y: evt.clientY - rect.top
        };
    };


    //Cho phép kéo thả chuột khi ở chế độ quan sát
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


    //Mouse up có nghĩa là nhả chuột ra
    //Khi không nhấn giữ chuột nữa, ta đừng kéo di chuyển vị trí nút nữa
    canvas.addEventListener('mouseup', function () {
        dragNode = undefined;
    });

    //Bắt sự kiện cho từng button và kiểm soát hành vi click chuột
    //Nếu createVertex thì click chuột sẽ tạo đỉnh
    //Nếu createEdge
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


    //Tạo đỉnh
    var createVertex = function (pos) {
        var id = graph.nodes.length,     header = idRow.insertCell(id + 1);

        header.innerHTML = "<b>" + (id + 1).toString() + "</b>";
        distancesRow.insertCell(id + 1);        prevVertexRow.insertCell(id + 1);        prevVertexRow.insertCell(id + 1);
        graph.nodes.push(graph.createNode(pos, id));
    };
    

    //Thêm cạnh vào đồ thị
    var addEdgeToGraph = function (from, to, weight) {
        var edge1 = graph.createEdge(from, to, Number(weight), graph.edges.length),
            edge2 = graph.createEdge(to, from, Number(weight), graph.edges.length);

            graph.nodes[from].edges.push(edge1);         graph.nodes[to].edges.push(edge2);
                        graph.edges.push(edge1);
    };

    //Tạo cạnh
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

    /* 
        THUẬT TOÁN DIJKSTRA BẮT ĐẦU TỪ ĐÂY
    */

     //Chọn đỉnh bắt đầu
    var selectStartVertex = function (pos) {
        if(startVertex !== undefined) startVertex.color = DEFAULT_VERTEX_COLOR;

        startVertex = getNodeByPos(pos);
        if(startVertex === undefined) return;
        startVertex.color = START_VERTEX_COLOR;          btnStart.disabled = false; 
    };


    //flags:dùng để đánh dấu những đỉnh đã được duyệt (true)
    var distances,     flags,     edgesIdToPrevVertex;
    var INFINITY_CHAR = "&#8734";
    //Ghi lại giá trị khoảng cách vào bảng "Thông tin khoảng cách"
    var setDistance = function(ind, num) {
        distancesRow.cells[ind + 1].innerHTML = num !== Number.MAX_VALUE ? num.toString() : INFINITY_CHAR;
        distances[ind] = Number(num);
    };

    //Ghi lại đỉnh kề trước của mỗi đỉnh
    var setPrevVertex = function(to, from) {
        prevVertexRow.cells[to + 1].innerHTML = (from + 1).toString();
    };


    //Tìm đỉnh có khoảng cách nhỏ nhất từ từ nguồn và các đỉnh đã duyệt   --> tới
    var getMinVertex = function() {
        var min = Number.MAX_VALUE,     index = -1;
        for(var i = 0; i < graph.nodes.length; i++){
            if(!flags[i] && distances[i] < min){
                min = distances[i];
                index = i;
            }
        }
        return (min < Number.MAX_VALUE) ? index : false;
    };


    //Bắt đầu chạy  Dijkstra khi nhất nút "Start"
    var startDijkstra = function() {
        setGraphBtnsDisabledProperty(true);      clearAlgorithmInfo();      sendInfo("Start algorithm...");    nextStep(setFirstDistances, 1);
    };


    //Khởi tạo giá trị khoảng cách ban đầu
    //INFINITY_CHAR Là kí hiệu "vô cùng"
    //Flag cho tất cả các đỉnh là false, vì ta chưa duyệt đỉnh nào cả
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
    

    //Kiểm tra từng đỉnh xem có duyệt hay chưa, nếu chưa thì duyệt các cạnh xuất phát từ đỉnh đó
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

        flags[currentVertex] = true;
        graph.setNodeColor(currentVertex, CURRENT_VERTEX_COLOR);
        edges = [];
        graph.getNode(currentVertex).edges.forEach(function(edge) {
            edges.push(graph.createEdge(edge.from, edge.to, edge.weight, edge.id));
        });

        sendInfo("Duyệt tất cả các cạnh xuất phát từ đỉnh <b>" + (currentVertex + 1) + "</b> này...");
        nextStep(checkEdgesStep, 3);
    };


    //Kiểm tra từng cạnh xem có duyệt hay chưa, nếu chưa thì duyệt tiếp các cạnh x
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


    //So sánh khoảng cách từng bước,nếu thỏa thì tô màu đường đi, nếu chưa 
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

    //Kết thúc Thuật toán
    var endDijkstra = function () {
        sendInfo("\n<b>Mô phỏng thuật toán đã kết thúc. Cảm ơn thầy cô và các bạn đã xem</b>");
        isStopped = false;   btnPause.disabled = true;  isPaused = false;         changeContinueButton();
    };
    render();
};