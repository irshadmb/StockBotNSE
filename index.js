var restify = require('restify');
var builder = require('botbuilder');
var http = require('http');
var request = require('request');

// Setup Restify Server
var server = restify.createServer();
var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0'
server.listen(port,ip, function () {
   console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});



server.get('/index.html', function (req, res) {
	res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.send('<html><head></head><body>	<h1>Hello World</h1></body></html>');
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

				request('http://finance.google.com/finance/info?q='+stockSymbol, function (error, res, body) {

                            if (!error && res.statusCode == 200) {
								 console.log('STATUS: ' + res.statusCode);
							     console.log('HEADERS: ' + JSON.stringify(res.headers));
							     var chunk = body;
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
                                  console.log('Sorry, please check the stock code');
                                  session.send('Sorry, please check the stock code');
                            }
                   });
                }
                else
                {
                                session.send('Sorry, I am unable to understand.');
                }
          }
          else
          {
                session.send('Sorry, I am unable to understand.');
          }
        });

    }
	else
	{
		session.send("Please give some input");
	}
});

module.exports = server ;