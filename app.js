
var express= require("express");
var app= express();

var bodyParser=require("body-parser");
app.use(bodyParser.urlencoded({extended:true}));

// takes care of CSS
app.use(express.static("public"));
// app.set("view engine","ejs");

var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/rateLimit",{ useNewUrlParser: true });

var userSchema = new mongoose.Schema({
	name: String,
	isBlocked: Number,
	priority: Number,

	mLimit: Number,
	hLimit: Number,
	dLimit: Number,

	rpm: Number,
	rph: Number,
	rpd: Number,

	minuteTimer: Number,
	hourTimer: Number,
	dayTimer: Number,

	imgCount: Number
});

var serverSchema = new mongoose.Schema({
	isSpike: Number, 

	mLimit: Number,
	hLimit: Number,
	dLimit: Number,

	rpm: Number,
	rph: Number,
	rpd: Number,

	minuteTimer: Number,
	hourTimer: Number,
	dayTimer: Number

});

var User = mongoose.model("User",userSchema);
var Server = mongoose.model("Server",serverSchema);

var factor= 6;	// limit is set to (priority*factor)/100 during Spike

/*
User.create({
	name: "kunal",
	isBlocked: 0,
	priority: 5,

	mLimit: 9,
	hLimit: 200,
	dLimit: 1500,

	rpm: 0,
	rph: 0,
	rpd: 0,

	minuteTimer: Date.now(),
	hourTimer: Date.now(),
	dayTimer: Date.now(),

	imgCount: 0

}, function(err,user){
	if(err)
		console.log(err);
	else
		console.log(user);
});

Server.create({
	isSpike: 0,

	mLimit: 100,
	hLimit: 3500,
	dLimit: 20000,

	rpm: 0,
	rph: 0,
	rpd: 0,

	minuteTimer: Date.now(),
	hourTimer: Date.now(),
	dayTimer: Date.now()

}, function(err,user){
	if(err)
		console.log(err);
	else
		console.log(user);
});
*/

// checks if a server has spike, evry 15 minutes
function checkTraffic(){	
	Server.findOne({},function(error,server){

		if(Date.now()-server.minuteTimer >= 1000*60){
			server.rpm = 0;
			server.minuteTimer= Date.now();
		}
		if(Date.now()-server.hourTimer >= 1000*60*60){
			server.rph = 0;
			server.hourTimer= Date.now();
		}
		if(Date.now()-server.dayTimer >= 1000*60*60*24){
			server.rpd = 0;
			server.dayTimer= Date.now();
		}

		if(error)
			console.log(error);
		else if(!server)
			console.log("No server entry in db exists");
		else{
			var currentRate = (server.rph*1000*60*60)/(Date.now()-server.hourTimer);	
			if(currentRate > server.hLimit*2.5) // 2.5 times more
				server.isSpike = 1;
			else
				server.isSpike= 0;
			server.save();
		}
	});
}

setInterval(checkTraffic,1000*60*15); // every 15 minutes


app.get("/validate/:name",function(req,res){
	
	var userName = req.params.name;
	var destination=1;	// tells to move to next or previous image

	if(req.query.dest){
		if(parseInt(req.query.dest)==1)
			destination=1;
		else
		 	destination=-1;	  
	}
	
	Server.findOne({},function(error,server){
		if(error)
			console.log(error);
		else if(!server)
			console.log("No server entry in db exists");
		else{

			User.findOne({name: userName}, function(error,user){
				if(error)
					console.log(error);
				else if(!user){
					console.log("Invalid User");
					res.send("No such user exists !");
				}
				else{	// user found		
												// LOGIC GOES HERE
					if(user.isBlocked)
						res.send("YOU ARE BLOCKED FOR SENDING EXCESSIVE REQUESTS. CONTACT ADMIN");

					else{
						var flag= 1; // assume allow

						if(Date.now()-server.minuteTimer >= 1000*60){
							server.rpm = 0;
							server.minuteTimer= Date.now();
						}
						if(Date.now()-server.hourTimer >= 1000*60*60){
							server.rph = 0;
							server.hourTimer= Date.now();
						}
						if(Date.now()-server.dayTimer >= 1000*60*60*24){
							server.rpd = 0;
							server.dayTimer= Date.now();
						}
						
						
						if(Date.now()-user.minuteTimer >= 1000*60){
							user.rpm = 0;
							user.minuteTimer= Date.now();
						}
						if(Date.now()-user.hourTimer >= 1000*60*60){
							user.rph = 0;
							user.hourTimer= Date.now();
						}
						if(Date.now()-user.dayTimer >= 1000*60*60*24){
							user.rpd = 0;
							user.dayTimer= Date.now();
						}

						server.rpm++;
						server.rph++;
						server.rpd++;

						user.rpm++;
						user.rph++;
						user.rpd++;

						var fix= 1.0;
						if(server.isSpike==1)
							fix= user.priority*factor/100;


						if(server.rpm>server.mLimit || server.rph>server.hLimit || server.rpd>server.dLimit){
							flag= 3; // request limit for server reached.. try later
						}
						
						else if(user.rpm>user.mLimit*fix || user.rph>user.hLimit*fix || user.rpd>user.dLimit*fix){

							if(user.rpm>10*user.mLimit*fix || user.rph>10*user.hLimit*fix || user.rpd>10*user.dLimit*fix){
								user.isBlocked = 1;
								flag= -1; 	// blocked
							}
							else{
								flag= 2;   // request limit for client reached.. try later
							}
						}

						else{ 
							// flag is 1
							// application specific code
							user.imgCount = (user.imgCount+destination+6)%6;
						}
		
						user.save();
						server.save();

						if(flag==1)
							res.redirect("/view/"+userName+"/home");
						else if(flag==2)
							res.send("Your Number of requests exceeded. Please try later ");
						else if(flag==3)
							res.send("Server is Busy! Please try after ");
						else if(flag==-1)																		
							res.send("YOU HAVE BEEN BLOCKED");
					}
				}	
			});
		}
	});
});


app.get("/view/:name/home",function(req,res){
	var userName = req.params.name;
	var i=0;
	User.findOne({name: userName}, function(error,user){
		if(error)
			console.log(error);
		else if(!user)
			res.send("INVALID USER");
		else{ // if(user)
			i= user["imgCount"];
			res.render("home.ejs",{i: i, name: userName});
	  	}
	});
});

app.get("/admin",function(req,res){
	res.redirect("/admin/home");
});

app.get("/admin/home",function(req,res){

	Server.findOne({},{_id:0,__v:0,minuteTimer:0,hourTimer:0,dayTimer:0},function(error,server){
		if(error)
			console.log(error);
		else if(!server)
			console.log("no server found in db");
		else{
			User.find({},function(error,users){
				if(error)
					console.log(error);
				else if(!users)
					console.log("no user found in db");
				else{
					res.render("admin.ejs",{server : server, users : users});
				}
			});
		}
	});

});

app.post("/user/add",function(req,res){

	User.findOne({"name":req.body.name},function(err,user){
		if(err)
			console.log(err);

		else if(!user){
			User.create({
			name: req.body.name,
			isBlocked: 0,
			priority: req.body.priority,

			mLimit: req.body.mLimit,
			hLimit: req.body.hLimit,
			dLimit: req.body.dLimit,

			rpm: 0,
			rph: 0,
			rpd: 0,

			minuteTimer: Date.now(),
			hourTimer: Date.now(),
			dayTimer: Date.now(),

			imgCount: 0

			}, function(err,user){
				if(err)
					console.log(err);
				else
					console.log(user);
			 	res.redirect("/admin/home");
			});
		}
	});
});

app.post("/user/block",function(req,res){

	User.findOne({name: req.body.name},function(err,user){
		if(err)
			console.log(err);
		else if(!user){
			res.send("No such user exists");
		}
		else{
			user.isBlocked = parseInt(user.isBlocked)^1;
			user.save();
			res.redirect("/admin/home");
		}
	});
});

app.post("/server/update",function(req,res){

	Server.findOne({},function(err,server){
		server.isSpike = req.body.isSpike;
		server.mLimit = req.body.mLimit;
		server.hlimit = req.body.hLimit;
		server.dLimit = req.body.dLimit;

		server.save();
		res.redirect("/admin/home");	
	});
});

app.get("*",function(req,res){
	res.send("WRONG URL !");
});

app.listen(3000,function(req,res){
	console.log("Server started at port no 3000.");
});
