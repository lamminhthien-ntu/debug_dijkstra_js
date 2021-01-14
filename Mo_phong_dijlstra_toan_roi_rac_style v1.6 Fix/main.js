//Phương thức push(): Thêm các mục(item) mới vào cuối mảng và trả về độ dài mới cho mảng (length).
//Weight được gọi là hao phí (Quảng đường đi được). Còn riêng (length) sẽ được gọi là độ dài mảng (Array)
//PrevVertex là đỉnh vừa được duyệt trước, vừa kề bên cạnh đỉnh đang xét.
window.onload = function () {

    // Màu sắc
    var COLOR_1 = "#1093a7",
        COLOR_2 = "#24454c",
        COLOR_3 = "#def2f3",
        COLOR_4 = "#589ba4",
        START_VERTEX_COLOR = "#00e640"
        WHITE_COLOR = "#ffffff",
        BLACK_COLOR = "#01452c",
        RED_COLOR ="#ff7f7f",
        BLUE_STRONG_COLOR = "#035bf0"
        CURRENT_VERTEX_COLOR = "#ff3300",
        CURRENT_EDGE_COLOR = "#ff3300",
        DISABLED_COLOR = "#808080",
        VISIT_VERTEX_COLOR = "#808080",
        VISIT_EDGE_COLOR = "#808080",
        ADJACENCY_VERTEX_COLOR = "#ffffcc",
        START_VERTEX_COLOR = "#00ff00",
        DEFAULT_VERTEX_COLOR = "#ffffff",
        DEFAULT_EDGE_COLOR = "#000";

    // Các biến canvas
    var canvas,
        ctx,
        graph,
        render,
        dragNode,
        dragPoint,
        firstSelectedNode = undefined, // Nút được tạo đầu tiên trong chế độ "create edge"
        startVertex = undefined; // Start vertex for algorithm  Đỉnh nguồn 

    // Info div 
    var idRow, // First row in table with id  Hàng id
        distancesRow, // Second row in table with distances  Hàng chứa khoảng cách từ nguồn tới đỉnh tương ứng
        prevVertexRow, // // Third row in table with id of prev Hàng chứa id đỉnh được xét trước đó mà kề đỉnh của "idRow"
        infoField,
        sendInfo,
        clearInfo;

    // In algorithm div info field   Ghi lại quá trình giải thuật toán
    infoField = document.getElementById("info_field");
    // Add info to info field  Thêm dữ liệu vào table thông tin
    sendInfo = function (info) {
        infoField.innerHTML += "> " + info + "<br>";
        infoField.scrollTop = 9999; // Scroll to last string in field  Tự động cuộn nội dung dọc xuống
    };
    // Delete all info in field    Làm sạch trường info
    clearInfo = function () {
        infoField.innerHTML = "";
    };

    // Buttons   //Nút tương tác
    var currentBtn, // Current selected button    //Nút bấm được kích hoạt hiện tại
        prevStyle, // Previous style of current button    // Trạng thái trước đó của currentBtn
        btnCreateVertex,
        btnCreateEdge,
        btnStart,
        btnPause,
        btnStop,
        btnView,
        btnClearGraph,
        btnNextStep,
        btnSelectStartVertex,
        btnCreateRandomGraph,
        graphBtns; // Buttons from graph div     Các nút điều khiển thuật toán

    /*
        GRAPH DIV BUTTONS  Khu vực các nút điều khiển thuật toán
    */
    btnCreateVertex = document.getElementById('btnCreateVertex');
    btnCreateVertex.addEventListener("click", function (event) {
        changeCurrentButton(btnCreateVertex);
    }, false);

    btnCreateEdge = document.getElementById('btnCreateEdge');
    btnCreateEdge.addEventListener("click", function (event) {
        changeCurrentButton(btnCreateEdge);
    }, false);

    btnView = document.getElementById('btnView');
    btnView.addEventListener("click", function (event) {
        changeCurrentButton(btnView);
    }, false);

    btnClearGraph = document.getElementById('btnClearGraph');
    btnClearGraph.addEventListener("click", function (event) {
        clearGraph();
        render();
    }, false);

    btnCreateRandomGraph = document.getElementById("btnCreateRandomGraph");
    btnCreateRandomGraph.addEventListener("click", function (event) {
        createRandomGraph();
    }, false);

    /*
     Algorithm DIV BUTTONS  Khu vực các nút điều khiển thuật toán
     */
    btnStart = document.getElementById("btnStart");
    btnStart.disabled = true;
    btnStart.addEventListener("click", function (event) {
        currentStep = startDijkstra;
        btnStop.disabled = false;
        btnPause.disabled = false;
        btnStart.disabled = true;
        isStopped = false;
        isPaused = false;
        nextStep(currentStep, 1);
    }, false);

    btnPause = document.getElementById("btnPause");
    btnPause.disabled = true;
    btnPause.addEventListener("click", function (event) {
        if(isPaused){ // If click when algorithm is pausing     Nếu nó được click chuột khi thuật toán đang tạm dừng
            changeContinueButton();
            nextStep(currentStep, 1);
        } else{ // If click when algorithm is working        Nếu nó được click chuột khi thuật toán đang hoạt động
            isPaused = true;
            btnNextStep.disabled = false;
            btnPause.innerHTML = "Continue";
            clearTimeout(nextTimer);
        }
    }, false);

    btnStop = document.getElementById("btnStop");
    btnStop.disabled = true;
    btnStop.addEventListener("click", function (event) {
        clearTimeout(nextTimer);
        isStopped = true;
        btnStop.disabled = true;
        isPaused = false;
        btnStart.disabled = false;
        changeContinueButton();
        btnPause.disabled = true;
        clearAlgorithmInfo();
        sendInfo("Chọn <b>Đỉnh nguồn (Đỉnh xuất phát)</b>và nhấn<b>Start</b> để bắt đầu quá trình mô phỏng thuật toán");
        setGraphBtnsDisabledProperty(false);  // Switch off graph buttons for disable graph changes     Vô hiệu hóa các nút điều khiển thuật toán khi nhấn nút stop
        render();
    }, false);

    btnNextStep = document.getElementById("btnNextStep");
    btnNextStep.disabled = true;
    btnNextStep.addEventListener("click", function (event) {
        isSkipped = true;
        nextStep(currentStep);
    }, false);


    //Chọn đỉnh nguồn
    btnSelectStartVertex = document.getElementById("btnSelectStartVertex");
    btnSelectStartVertex.addEventListener("click", function (event) {
        changeCurrentButton(btnSelectStartVertex);
    }, false);

    var clearAlgorithmInfo = function () {
        clearInfo();
        recreateAlgorithmExtraInfo();
        // Clean table   Xóa bảng
        for(var i = 0; i < graph.nodes.length; i++){
            graph.setNodeColor(i, DEFAULT_VERTEX_COLOR); // Return back default color for vertices   Trả lại màu sắc mặc định cho các đỉnh
            distancesRow.cells[i + 1].innerHTML = "";
            prevVertexRow.cells[i + 1].innerHTML = "";
        }
        startVertex.color = START_VERTEX_COLOR;

        // Return back default color for edges   Trả lại màu sắc mặc định cho các cạnh
        for(var i = 0; i < graph.edges.length; i++){
            graph.setEdgeColor(i, DEFAULT_EDGE_COLOR);
        }
    };

    // Buttons from graph div   Mảng các nút tương tác với đồ thị 
    graphBtns = [btnView, btnCreateVertex, btnCreateEdge, btnCreateRandomGraph, btnClearGraph, btnSelectStartVertex];



    // Change disabled property for all graph buttons
    // Vô hiệu hóa tất cả các nút bên trái khi thuật toán đang diễn ra "bool=true"
    var setGraphBtnsDisabledProperty = function(bool) {
        graphBtns.forEach(function(btn) {
            btn.disabled = bool;
        });
        if(bool){

            //Thay đổi kiểu màu sắc cho các nút bị disabled
            // Change style for disabled buttons
            currentBtn.style = prevStyle;
            //btnSelectStartVertex.style.visibility = "hidden";
        }
        else {
            // Return previous buttons style
            //Trả về trạng thái enable kiểu màu xanh "enable"
            //btnSelectStartVertex.style.visibility = "visible";
            setStyleToCurrentButton(currentBtn);
        }
    };


    //Đặt style cho nút hiện tại
    // Set style to current button
    var setStyleToCurrentButton = function (btn) {
        prevStyle = btn.style;
        btn.style.backgroundColor = "#ffffff";
        btn.style.border = "2px solid #589ba4";
        btn.cssText += "-webkit-transition-duration: 0s; transition-duration: 1s;";
    };

    currentBtn = btnView; // First current button is btnView   Ban đầu mới mở chương trình lên thì vào sẵn chế độ View
    setStyleToCurrentButton(currentBtn);

    // Change current button for new one
    // Thay đổi trạng thái nút bấm
    var changeCurrentButton = function (button) {
        // If one vertices was picked in "Create edge" mode
        // Nếu một đỉnh được chọn trong chế độ "Create edge" 
        if(firstSelectedNode !== undefined) firstSelectedNode.node.color = firstSelectedNode.prevColor;
        firstSelectedNode = undefined;
        render();

        currentBtn.style = prevStyle; // Return previous style to previous current button
        // Change current button
        currentBtn = button;
        setStyleToCurrentButton(currentBtn);
    };

    var clearGraph = function () {
        graph = Graph(); // Create new graph  //Tái tạo đồ thị mới
        startVertex = undefined;
        btnStart.disabled = true;


        //Xóa tất cả các đỉnh trong table "thông tin"
        // Delete all vertices from the table
        [idRow, distancesRow, prevVertexRow].forEach(function(row) {
            for(var i = row.cells.length - 1 ; i >= 1; i--){
                row.deleteCell(i);
            }
        });
    };

    var Graph = function(){
      return {
          // Vertices list 
          //Danh sách các đỉnh
          // Vertex has coordinates, id and color 
          //Các đỉnh có tọa độ, cạnh và màu sắc
          nodes: [],

          edges: [],

          //Bán kính của đỉnh
          // Vertex's radius
          vertexRange: 17,

          // Create new vertices
          //Tạo những đỉnh mới
          createNode: function(pos, id) {
              return {
                  x: pos.x,
                  y: pos.y,
                  id: id,
                  color: DEFAULT_VERTEX_COLOR,
                  edges: []
              }
          },

          // Find vertex in graph by ID
          getNode: function (ind) {
            return this.nodes[ind];
          },

          // Set new color for vertex
          setNodeColor: function (ind, color) {
              this.nodes[ind].color = color;
              render();
          },

          // Create new edge
          //Tạo đỉnh mới
          createEdge: function(from, to, weight, id) {
              return {
                  id: Number(id),
                  color: DEFAULT_EDGE_COLOR,
                  from: Number(from),
                  to: Number(to),
                  weight: Number(weight)
              }
          },

          // Set new color for edge
          //Thiết lập màu sắc mới cho các cạnh
          setEdgeColor: function (ind, color) {
              this.edges[ind].color = color;
              render();
          }

      };
    };

    graph = Graph();

    canvas = document.getElementById('canvas');

    idRow = document.getElementById('tr_id');
    distancesRow = document.getElementById('tr_distances');
    prevVertexRow = document.getElementById('tr_prev_vertex');


    //Chế độ vẽ 2D của canvas
    ctx = canvas.getContext('2d');

    // Redraw canvas and his elements
    // Vẽ lại canvas và các phần tử của nó
    render = function () {

        
        // Clear canvas
        // Xóa đồ thị cũ (nếu có))  
        //Tạo một lớp phủ màu trắng
        ctx.fillStyle = WHITE_COLOR;

        //Vẽ đường viền dưới dạng hình hộp chữ nhật
            //Có chiều dài chiều rộng bằng chính độ phân giải (display resolution) của canvas
            // Mục đích để phục vụ chức năng tạo đồ thị ngẫu nhiên
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw edges (drawing edges before vertices locate edges under vertices)
        // Tạo cạnh 
        graph.edges.forEach(function (edge) {
            var from = getNodeById(edge.from),
                to = getNodeById(edge.to);
            ctx.fillStyle =  BLUE_STRONG_COLOR;
            ctx.strokeStyle = edge.color;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
            ctx.font = "17px Verdana";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(edge.weight.toString(), (from.x + to.x) / 2, (from.y + to.y) / 2);
        });

        // Draw vertices
        // Vẽ các đỉnh
        graph.nodes.forEach(function (node) {
            ctx.beginPath();
            ctx.fillStyle = node.color;
            ctx.strokeStyle = BLACK_COLOR;
            ctx.arc(node.x, node.y, graph.vertexRange, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = RED_COLOR;
            ctx.font = "20px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(node.id.toString(), node.x, node.y);
        });
    };



    //Chưa hiểu hàm này để làm gì
    // Find node in graph by ID
    //Tìm kiếm nút (đỉnh) trong đồ thị bởi ID
    var getNodeById = function (id) {
        var result = undefined;
        graph.nodes.forEach(function (node) {
            if (node.id === id) {
                result = node;
            }
        });
        return result;
    };


    //Lấy tạo độ chuột trong canvas
    // Get from mouse event coordinates relatively left-top corner of canvas
    var getMousePosFromEvent = function (evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };


    // Tìm kiếm đỉnh bởi tọa độ trên canvas
    // Find node by coordinates on canvas
    // Dùng công thức toán học để xác định lại hai đỉnh A,B của 1 đoạn thẳng, và vẽ chúng 
    var getNodeByPos = function (pos) {
        var result = undefined;
        graph.nodes.forEach(function (node) {
            if ((node.x - pos.x) * (node.x - pos.x) + (node.y - pos.y) * (node.y - pos.y)
                <= graph.vertexRange * graph.vertexRange) {
                result = node;
            }
        });
        return result;
    };

    // When the mouse is pressed find node and remember that in dragNode
    // Khi nhấn giữ chuột , tìm xem thử đó là nút nào (đỉnh nào) và ghi nhớ rằng đó à nút kéo thả (dragNode)
    // dragPoint remember what place in node was pressed
    // dragPoint ghi nhớ vị trí dragNode
    canvas.addEventListener('mousedown', function (event) {
        // This function need only for "View" mode
        // For trace node moving
        if (currentBtn !== btnView) {
            return;
        }
        var pos = getMousePosFromEvent(event);
        dragNode = getNodeByPos(pos);
        // Find dragPoint
        if (dragNode !== undefined) {
            dragPoint = {
                x: pos.x - dragNode.x,
                y: pos.y - dragNode.y
            }
        }
    }, false);



    // Khi không còn nhấn giữ chuột nữa, hệ thống sẽ quên dragNode hiện tại
    // When the mouse is depressed, forgot current dragNode
    canvas.addEventListener('mouseup', function () {
        dragNode = undefined;
    }, false);





    // Do action relatively current button mode
    // Xem xét khi nào người dùng nhất 1 trong 4 nut "Tạo đỉnh", "Tạo cạnh", "Chọn đỉnh nguồn" thì thực hiện function cụ thể ấy
    canvas.addEventListener('click', function (event) {
        var pos = getMousePosFromEvent(event);
        switch (currentBtn.id) {
            case "btnCreateVertex":
                createVertex(pos);
                break;
            case "btnCreateEdge":
                createEdge(pos);
                break;
            case "btnSelectStartVertex":
                selectStartVertex(pos);
                break;
            default:
                return;
        }
        render();
    }, false);

    //Hàm tạo đỉnh
    var createVertex = function (pos) {
        // Add new vertex in table
        // Thêm các đỉnh mới vào bảng thông tin nằm dưới nút chỉnh tốc độ
        var id = graph.nodes.length;
        var header = idRow.insertCell(id + 1);
        header.innerHTML = "<b>" + id.toString() + "</b>";
        distancesRow.insertCell(id + 1);
        prevVertexRow.insertCell(id + 1);

        // Add new vertex in graph
        //Thêm đỉnh mới vào đồ thị
        graph.nodes.push(graph.createNode(pos, id));
    };
    
    //Thêm cạnh mới vào đồ thị
    var addEdgeToGraph = function (from, to, weight) {
        var edge1 = graph.createEdge(from, to, Number(weight), graph.edges.length),
            edge2 = graph.createEdge(to, from, Number(weight), graph.edges.length);
        // Add edge in two vertex because the edges in graph have two ways
        // Thêm cạnh vào hai đỉnh . Bởi vì cạnh trong đồ thị có thể xuất phát từ 1 trong hai hướng (Từ đỉnh A qua đỉnh B, từ đỉnh B qua đỉnh A và ngược lại)
        // Cần xem lại edge 2
        graph.nodes[from].edges.push(edge1);

        
        graph.nodes[to].edges.push(edge2);
        graph.edges.push(edge1);
    };
    
    var createEdge = function (pos) {

        // Find clicked node
        // Tìm đỉnh được click chuột
        var node = getNodeByPos(pos);
        if(node === undefined || (firstSelectedNode !== undefined && node.id === firstSelectedNode.node.id)) return;


        // Đặt màu sắc hiện tại cho đỉnh đó
        // Set current color to this vertex
        var prevColor = node.color;
        node.color = CURRENT_VERTEX_COLOR;

        if (firstSelectedNode === undefined) { // If it is first choosing vertex
            firstSelectedNode = {
                node: node,
                prevColor: prevColor
            };
        } else {
            var weight = prompt("Nhập độ dài cạnh (Mức độ hao phí) (Tối đa là 50):");
            while(Number.isNaN(Number(weight)) || Number(weight) > 60){
                weight = prompt("Hãy nhập lại cho đúng (Tối đa là 50):")
            }

            if (weight) {
                var firstId = firstSelectedNode.node.id,
                    secondId = node.id;

                addEdgeToGraph(firstId, secondId, weight);
            }

            // Forgot this vertices
            firstSelectedNode.node.color = firstSelectedNode.prevColor;
            node.color = prevColor;
            firstSelectedNode = undefined;
        }
    };

    var selectStartVertex = function (pos) {
        // Forgot previous vertex
        if(startVertex !== undefined) startVertex.color = DEFAULT_VERTEX_COLOR;
        startVertex = getNodeByPos(pos);

        if(startVertex === undefined) return;
        startVertex.color = START_VERTEX_COLOR;
        btnStart.disabled = false; // Open button start   //Mở khóa nút "Start"

    };

    var createRandomGraph = function () {
        clearGraph();

        // Ask vertex count
        // Hỏi số lượng đỉnh
        var vertexCount;
        while((
            vertexCount = prompt("Nhập số lượng đỉnh (Tối đa là 4) \nLưu ý đồ thị có đôi lúc không được vẽ rõ ràng\nVì vậy hãy random tiếp nếu bị lỗi nhé")) > 4);
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
                //Kiểm tra từng tọa độ x,y của đỉnh
                x: getRandomValue(canvas.width),
                y: getRandomValue(canvas.height)
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

    // Arrays for algorithm (Extra info)
    // Phục vụ "Extra Info"
    var distances,
        flags,
        edgesIdToPrevVertex;

        //Tạo lại bảng thông tin thuật toán
    var recreateAlgorithmExtraInfo = function () {
        distances = [];
        flags = [];
        edgesIdToPrevVertex = [];
    };


    //Hiển thị kí hiệu "Vô Cùng" trong toán học
    var INFINITY_CHAR = "&#8734";

    // --Set values to array and table
    // Đặt giá trị cho mảng và bảng thông tin
    var setDistance = function(ind, num) {
        distancesRow.cells[ind + 1].innerHTML = num !== Number.MAX_VALUE ? num.toString() : INFINITY_CHAR;
        distances[ind] = Number(num);
    };

    var setPrevVertex = function(to, from) {
        prevVertexRow.cells[to + 1].innerHTML = from.toString();
    };


    // Tìm đỉnh có khoảng cách nhỏ nhất, tính từ đỉnh đang xét.
    // Đang xử lí thuật toán
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

    // Variables for algorithm
    // Các biến điều khiển thuật toán
    var speedSelect, // What speed of algorithm  Tốc độ chạy thuật toán
        getSpeed,
        nextStep,
        nextTimer,
        currentStep,
        isStopped = false,
        isPaused = false,
        isSkipped = false,
        changeContinueButton,
        isPauseOrStop,
        currentVertex,
        edges,
        edge,
        prevColor;

    speedSelect = document.getElementById("speed_select");
    getSpeed = function () {
        return Number(speedSelect.options[speedSelect.options.selectedIndex].value);
    };

    changeContinueButton = function () {
        isPaused = false;
        btnNextStep.disabled = true;
        btnPause.innerHTML = "Pause";
    };

    // Bước kế tiếp, mục đích để làm chạm lại chương trình để chạy từng bước
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


    //Bắt đầu thuật toán
    var startDijkstra = function() {
        //Thay đổi thuộc tính các nút bên trái thành disable
        setGraphBtnsDisabledProperty(true);
        // Xóa các thông tin thuật toán 
        clearAlgorithmInfo();

        sendInfo("Start algorithm...");
        nextStep(setFirstDistances, 1);
    };

    var setFirstDistances = function () {
        sendInfo("Đặt giá trị khoảng cách ban đầu cho tất cả các đỉnh<br>" +
        "Đối với đỉnh xuất phát ban đầu thì giá trị khoảng cách của nó cũng chính là 0, các đỉnh khác ta tạm thời gán giá trị  INFINITY");
        // Set starting value of distances to all vertices
        // Khởi tạo giá trị khoảng cách từ nguồn tới từng đỉnh là "MAX_VALUE"
        for(var i = 0; i < graph.nodes.length; i++){
            setDistance(i, Number.MAX_VALUE);
            flags[i] = false;
        }
        edgesIdToPrevVertex = new Array(graph.nodes.length);

        setDistance(startVertex.id, 0);
        setPrevVertex(startVertex.id, "-");

        nextStep(checkVerticesStep, 3);
    };
    
    var checkVerticesStep = function () {
        currentVertex = getMinVertex();
        // If all vertices is checked
        //Nếu tất cả các đỉnh được kiểm tra
        if(currentVertex === false) {
            sendInfo("---------<b>Tất cả các đỉnh đã được duyệt</b>-------------");
            nextStep(endDijkstra, 3);
            return;
        }

        sendInfo("--------------------------------------------------------------");
        sendInfo("Chọn đỉnh có khoảng cách nhỏ nhất (tính từ đỉnh nguồn đến)<br>" +
            "ID của đỉnh có khoảng cách nhỏ nhất là <b>" + currentVertex + "</b>");
        flags[currentVertex] = true;
        graph.setNodeColor(currentVertex, CURRENT_VERTEX_COLOR);

        // Create edges array
        // Tạo mảng hướng đối tượng cho dữ liệu cạnh kề
        edges = [];
        graph.getNode(currentVertex).edges.forEach(function(edge) {
            edges.push(graph.createEdge(edge.from, edge.to, edge.weight, edge.id));
        });

        sendInfo("Duyệt tất cả các cạnh xuất phát từ đỉnh này <b>" + currentVertex + "</b>...");
        nextStep(checkEdgesStep, 3);
    };

    // Duyệt các cạnh
    var checkEdgesStep = function() {
        if(edges.length > 0) checkEdgeStep();
        else {
            sendInfo("<u> Tất cả các cạnh kề xuất phát từ đỉnh </u> <b>"+ currentVertex +"</b> <u> này đã được kiểm tra rồi </u> \n");
            sendInfo("------------------------------------------------------------");
          //  sendInfo("Khoảng cách cộng dồn lúc này là <b>" + newDistance + "</b>");
            graph.setNodeColor(currentVertex,(currentVertex !== startVertex.id)
                ? VISIT_VERTEX_COLOR : START_VERTEX_COLOR);
            nextStep(checkVerticesStep, 3);
        }
    };


    //Duyệt từng cạnh riêng
    var checkEdgeStep = function () {
        edge = edges.pop();

        // if vertex with ID edge.to is visited
        // Nếu đỉnh với ID edge.to đã được duyệt qua
        while(flags[edge.to]){
            edge = edges.pop();
            if(edge === undefined) {
                checkEdgesStep();
                return;
            }
        }

        sendInfo("Cạnh từ đỉnh <b>" + edge.from + "</b> đến đỉnh <b>" + edge.to + "</b> với độ dài (độ hao phí) là <b>" + edge.weight + "</b>");
        prevColor = graph.getNode(edge.to).color;
        graph.setNodeColor(edge.to, ADJACENCY_VERTEX_COLOR);
        nextStep(checkDistancesStep, 3);
    };

    var checkDistancesStep = function () {
        var newDistance = Number(distances[currentVertex]) + Number(edge.weight);
        if(newDistance < distances[edge.to]) {
            var message = "Khoảng cách từ cạnh này ngắn hơn cạnh hồi nãy: <b>" + newDistance + " < ";
            message += distances[edge.to] !== Number.MAX_VALUE ? distances[edge.to].toString() : INFINITY_CHAR;
            sendInfo(message + "</b>");
            setDistance(edge.to, newDistance);
            setPrevVertex(edge.to, edge.from);
            // Change previous vertex
            if(edgesIdToPrevVertex[edge.to] !== undefined)
                graph.setEdgeColor(edgesIdToPrevVertex[edge.to], VISIT_EDGE_COLOR);
            edgesIdToPrevVertex[edge.to] = edge.id;
            graph.setEdgeColor(edge.id, CURRENT_EDGE_COLOR);
        } else{
            sendInfo("Khoảng cách từ cạnh này ngắn hơn cạnh hồi nãy: <b>" +
                + newDistance + " >= " + distances[edge.to].toString());
            graph.setEdgeColor(edge.id, VISIT_EDGE_COLOR);
        }
        graph.setNodeColor(edge.to, prevColor);
        nextStep(checkEdgesStep, 3);
    };

    var endDijkstra = function () {
        sendInfo("\n<b>Mô phỏng thuật toán đã kết thúc. Cảm ơn thầy cô và các bạn đã xem</b>");
        // Block and unblock buttons
        // Chặn và bỏ chặn các nút Stop, Paused, Continue
        isStopped = false;
        btnPause.disabled = true;
        isPaused = false;
        changeContinueButton();
    };

    render();

};