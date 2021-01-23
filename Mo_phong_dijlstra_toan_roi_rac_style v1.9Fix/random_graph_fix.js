var createRandomGraph = function () {
    clearGraph();

    // Ask vertex count
    var vertexCount;
    while((
        vertexCount = prompt("Enter vertices count (Maximum is 10)")) > 10);
    if(!vertexCount) return;

    // Save vertices position to colibrate their
    var verticesPos = [];

    var getRandomValue = function (limit) {
        return Math.floor(Math.random()*1000) % limit;
    };

    var compareCoordinateForCompatibility = function (pos1, pos2, withWhat) {
        return Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2) > withWhat * withWhat;
    };

    var getRandomPos = function() {
        // For vertices don't touch the borders of canvas
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

    // Generate vertices
    for(var i = 0; i < vertexCount; i++){
        var pos = getRandomPos();
        while(!checkPosCompatibility(pos)){
            pos = getRandomPos();
        }
        verticesPos.push(pos);
        createVertex(pos);
    }

    // Create adjacency matrix to generate random edges
    var adjacencyMatrix = new Array(vertexCount);
    for(var i = 0; i < vertexCount; i++){
        adjacencyMatrix[i] = new Array(vertexCount);
    }

    // For all pair of different vertices generate edges (If random want it)
    for(var i = 0; i < vertexCount; i++){
        for(var j = i; j < vertexCount; j++){
            if(i !== j && getRandomValue(2)){
                addEdgeToGraph(i, j, getRandomValue(20));
            }
        }
    }
    render();
};



