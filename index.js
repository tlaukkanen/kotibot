"use strict";

var TelegramBot = require('node-telegram-bot-api');
const Wreck = require('wreck');

var token = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';

var bot = new TelegramBot(token, { polling: true });
bot.getMe().then(function (me) {
  console.log('Hi my name is %s!', me.username);
});

bot.onText(/\/echo (.+)/, function (msg, match) {
  var chatId = msg.chat.id;
  var resp = match[1];
  bot.sendMessage(chatId, resp);
});

bot.onText(/.*what.*lunch.*\?/, function (msg, match) {
  var chatId = msg.chat.id;
  var now = new Date();
  var year = now.getFullYear();
  var month = (now.getMonth() + 1) < 10 ? "0" + (now.getMonth() + 1) : "" + (now.getMonth() + 1);
  var day = now.getDate() < 10 ? "0" + now.getDate() : "" + now.getDate();
  request.get("http://www.sodexo.fi/ruokalistat/output/daily_json/134/" + year + "/" + month + "/" + day + "/fi",
    function (err, resp, body) {
      console.log("response: " + JSON.stringify(body));
      var list = "";
      var courses = JSON.parse(body).courses;
      for (var i in courses) {
        list += "- " + courses[i].title_fi + "\n";
      }
      respond(msg, "Downstairs menu:\n" + list, chatId);
    }
  );
});

bot.onText(/\/shutdown/, function (msg, match) {
  var chatId = msg.chat.id;
  respond(msg, "Shutting down", chatId);
  setTimeout(function () {
    process.exit();
  }, 1000);
})

bot.onText(/.*status.*/, function (msg, match) {
  var chatId = msg.chat.id;
  respond(msg, "Just a second, I'll check the current status..", chatId);

  setTimeout(function(){
    Wreck.get(process.env.KOTIBOT_SERVER_URL + 'current', (err, resp, payload)=>{
      var rsp = '';
      if(err) {
        rsp = 'Something funky happened when I tried to talk to my server. Please try later';
        console.log('Server error: ', err);
      } else {
        var current = JSON.parse(payload);
        rsp = 'Current status indoors:\n' + 
          '🌡️ *' + (parseFloat(current.temperature).toFixed(1)) + ' °C*\n' +
          '💧 *' + parseInt(current.humidity) + ' %*\n' + 
          '🎈 *' + parseInt(current.pressure) + ' hPa*';
      }
      respond(msg, rsp, chatId);
      if(parseInt(current.humidity)<20) {
        setTimeout(function(){
          respond(msg, `🤔 Hmm.. That humidity is rather low (${parseInt(current.humidity)}%). ` +
          `Recommended humidity this time of year is 20-40%. You could try turning heating down 1°C as that should increase humidity.`, chatId);
        }, 2000);
      }
    });
  }, 500);

});

function respond(original, message, chatId) {
  bot.sendMessage(chatId, message, {parse_mode: 'Markdown'});
}