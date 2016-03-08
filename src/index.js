var app = require("http").createServer(handler);
var io = require("socket.io")(app);
var fs = require("fs");
var PORT = process.env.PORT || process.env.NODE_PORT || 3000;

app.listen(PORT);

var squares = {};

var flag = 
{
	x: Math.random()*400,
    y: Math.random()*400,
	radius: 10,
	color: "purple"
};

function handler(req, res)
{
	fs.readFile(__dirname + "/../client/client.html", function(err, data)
	{
		if(err)
		{
			throw err;
		}
		
		res.writeHead(200);
		res.end(data);
	});
}

function checkCollision(id)
{
	//if(Math.abs(squares[id].x - flag.x) > flag.radius + squares[id].width/2)
	//{
	//	return;
	//}
	
	if(Math.abs(squares[id].x + squares[id].width/2 - flag.x) > flag.radius + squares[id].width/2)
	{
		return;
	}
	
	//if(Math.abs(squares[id].y - flag.y) > flag.radius + squares[id].height/2)
	//{
	//	return;
	//}
	
	if(Math.abs(squares[id].y + squares[id].height/2 - flag.y) > flag.radius + squares[id].height/2)
	{
		return;
	}
	
	squares[id].points += 1;
	
	var message = 
	{
		message: "",
		data: squares,
		flag: flag
	};
	
	moveFlag();
	
	io.sockets.in("room1").emit("updatePoints", message);
}

function moveFlag()
{
	flag.x = Math.random()*400;
	flag.y = Math.random()*400;
}

io.on("connection", function(socket)
{
	socket.join("room1");
	
	socket.on("init", function(data)
	{
		console.log(flag);
		squares[data.id] = data.data;
		var message = 
		{
			message: "",
			data: squares,
			flag: flag
		};
		
		io.sockets.in("room1").emit("allSquares", message);
	});
	
	socket.on("updatePos", function(data)
	{
		if(squares[data.id].time < data.time)
		{
			squares[data.id] = data.data;
			
			checkCollision(data.id);
			
			var message = 
			{
				message: "",
				data: squares,
				flag: flag
			};
		
			io.sockets.in("room1").emit("allSquares", message);
		}
	});
	
	socket.on("updateScore", function(data)
	{
		if( data.score > points)
		{
			points = data.score;
		}
	});
	
	socket.on("leaving", function(data)
	{
		delete squares[data.id];
		
		var message = 
		{
			message: "",
			data: squares,
			flag: flag
		};
		
		io.sockets.in("room1").emit("allSquares", message);
	});
	
	socket.on("disconnect", function(data)
	{
		console.log(data);
		socket.leave("room1");
	});
});

console.log("Listening on port "+PORT);