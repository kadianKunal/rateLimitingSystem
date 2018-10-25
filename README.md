# Rate Limiting System

- This is a rate limiting system in node.js which helps in managing system load spikes and prioritizing clients. 
- It limits the number of GET requests a client can make and total number of request the server can process at per minute, per hour, per day level.
- Different rate limits are supported for different clients.
- In case of load spikes on machine, rate limits of each client decreases by an amount which is a function of client's priority. Thus high priority clients are given preference over low priority clients.
- Bad clients, sending > 10x traffic of actual limits should be suspended until resumed manually.

Currently it is implemented on a dummy image gallery website.

### Database details:-

	Database name:- rateLimit
	collections:-
		1. users
			schema:- {
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
					}
					
		2. servers
		
			schema:- {
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
					}
	
		here
			mLimit is number of requests permitted per minute
			hLimit is number of requests permitted per hour
			dLimit is number of requests permitted per day
			rpm is the current number/rate of requests per minute
			rph is the current number/rate of requests per hour
			rpd is the current number/rate of requests per day
			minuteTimer is the timestamp which updates every minute
			hourTimer is the timestamp which updates every hour
			dayTimer is the timestamp which updates every day		
			priority is a number from 1-10. 10 indicating highest priority

			
			, 
### Route details:- 
	
	"/validate/:name" - One should start from here. It performs rate limiting and redirects or blocks clients accordingly.
	"/view/:name/home" - Displays application specific response to permitted users. (Here it displays images on a dummy image gallery website)
	"/admin/home" - Provides interface for admin to monitor and update server and clients parameters. eg. blocking/unblocking a client, changing servers hLimit, adding a new client
	"/user/add" -   called internally by admin page. Adds a new client to database.
	"/user/block" - called internally by admin page. Blocks a user.
	"/server/update" - called internally by admin page. Updates server details.
  