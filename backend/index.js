
























  
//                 callback_data: 'play'
//                 text: 'Play in 1 click 🐹',
//                 text: 'Subscribe to the channel',
//                 web_app: { url: web_url }
//             inline_keyboard: [[webAppButton]]
//             {
//             {
//             },
//             },
//           [
//           ]
//           reply_markup: {
//           text: 'Open Web App',
//           web_app: { url: 'https://rollbitgame.hivelancetech.com/limbo' }
//           }
//         ]
//         bot.sendMessage(message.chat.id, 'Click the button below to open the web app:', replyMarkup);
//         const replyMarkup = {
//         const webAppButton = {
//         inline_keyboard: [
//         };
//         };
//       reply_markup: { 
//       }
//     // const web_url = gameUrl+'?chatId='+chatId+'&userName='+userName;
//     // var gameUrl   = 'https://rollbitgame.hivelancetech.com/limbo';
//     bot.answerCallbackQuery(callbackQuery.id);
//     bot.sendMessage(chatId, `Hello ${userName}, Welcome to ${botName}!`)
//     bot.sendMessage(chatId, message, options);
//     console.log(callbackQuery.data);
//     console.log(refId);
//     const gameUrl = 'https://rollbitgame.hivelancetech.com/limbo'; // Replace with your game URL
//     const message = `Hello! Welcome to DC Labs Bot Game 🐹 <br> You are now the director of a crypto exchange. Which one? You choose. Tap the screen, collect coins, pump up your passive income, develop your own income strategy. We’ll definitely appreciate your efforts once the token is listed (the dates are coming soon). Don't forget about your friends — bring them to the game and get even more coins together!`;
//     const message = callbackQuery.message;
//     const options = {
//     if (callbackQuery.data === 'play_game') {
//     return;
//     web_url = `${gameUrl}?chatId=${chatId}&userName=${userName}&refId=${refId}`;
//     web_url = `${gameUrl}?chatId=${chatId}&userName=${userName}`;
//     }
//     };
//   // if(regex.test(message)){
//   bot.sendMessage(chatId, `Hello ${userName}, Welcome to DC Labs Bot Game!`);
//   chat_id: chatId,
//   console.error('Polling error:', error);
//   const introMessage = `Hello! Welcome to DC Labs Bot Game 🐹 <br> You are now the director of a crypto exchange. Which one? You choose. Tap the screen, collect coins, pump up your passive income, develop your own income strategy. We’ll definitely appreciate your efforts once the token is listed (the dates are coming soon). Don't forget about your friends — bring them to the game and get even more coins together!`;
//   const match = message.match(startCommandRegex);
//   const refId = match[1]; 
//   const regex = /\/start/;
//   const startCommandRegex = /\/start(?: (.+))?/;
//   if (match) {
//   if (refId) {
//   let chatId = msg.chat.id;
//   let message = msg.text ? msg.text.toString().trim() : "";
//   let userId = msg.from.id;
//   let userName = msg.from.first_name;
//   let web_url;
//   menu_button: JSON.stringify({ type: 'web_app', text: 'Hello', web_app: { url: 'https://webappcontent.telegram.org/cafe' } }),
//   var gameUrl = 'https://rollbitgame.hivelancetech.com/limbo';
//   }
//   }
//   } else {
// /*const chatId = "XXXX"; 
// bot.on('callback_query', (callbackQuery) => {
// bot.on('message', async (msg) => {
// bot.on('polling_error', (error) => {
// bot.setChatMenuButton({
// console.log("code running");
// const bot = new TelegramBot(token, {polling: true});
// const TelegramBot = require('node-telegram-bot-api');
// const token = '7106558674:AAFEoj4kQVGNg-Q_cwWUFE5G5t7r2FVKzik';
// let botName = "DC Labs Bot";
// let userStates = {};
// })
// })*/
// });
// });