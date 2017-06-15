var restify = require('restify');
var builder = require('botbuilder');
var http = require('http');
var request = require('request');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {
	if(session.message.text.length > 0)
	{

		var stockSymbol;
		request('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/748305f4-4a1d-4784-a182-ca3ecfa6ae09?subscription-key=ee68d589970542afae8ddf76b38afd4a&verbose=true&timezoneOffset=0&q='+encodeURI(session.message.text), function (error, response, body) {
		  if (!error && response.statusCode == 200) {
			var entities = JSON.parse(body);
			if(entities.entities[0])
			{
		    	stockSymbol = entities.entities[0].entity;

		    	var stock_options = {
							  host: "finance.google.com",
							  port: 80,
							  path: '/finance/info?client=ig&q=BSE:'+stockSymbol,
							  method: 'GET'
							};

							http.request(stock_options, function(res) {
							  console.log('STATUS: ' + res.statusCode);
							  console.log('HEADERS: ' + JSON.stringify(res.headers));
							  res.setEncoding('utf8');
							  res.on('data', function (chunk) {
								 if(res.statusCode!='400')
								{
								  	chunk = chunk.substr(2);
								  	chunk = chunk.substr(2);
								  	stockdetails = JSON.parse(chunk);
								  	if(stockdetails[0]!=null)
								  	{
							      		console.log('The current stock price of '+stockdetails[0].t+' is '+stockdetails[0].l_cur);
							      		session.send('The current stock price of '+stockdetails[0].t+' is '+stockdetails[0].l_cur);
								  	}
								}
								else
								{
									  session.send('Sorry, please check the stock code');
								}

							  });
							}).end();

			}
			else
			{
				session.send('Sorry, I am unable to understand.');
			}
		  }
		});





	}
	else
	{
		session.send("Please give some input");
	}
});