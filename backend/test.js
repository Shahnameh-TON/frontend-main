const TelegramBot = require('node-telegram-bot-api');
const CryptoJS = require('crypto-js');

const token = '7376053615:AAH6pDfMYJZ7J6FkYxcPaf2Cu3FHX7PS0zs';
const bot = new TelegramBot(token, {polling: true});
let userStates = {};

let Key = 'N4^rU@lOs%#Y@eW!7Fc9S>';
let iv  = "DkJdYdPIQxsEgMcbGkaJr";
Key = CryptoJS.enc.Base64.parse(Key);
iv = CryptoJS.enc.Base64.parse(iv);

let web_url;
let menuButtonUrl;

let encryptParams = (param) => {
  let ciphertext = CryptoJS.AES.encrypt(param, Key, {iv : iv}).toString();
  let encodedCipherText = encodeURIComponent(ciphertext);
  return encodedCipherText;
}

async function getChatMember(channelUsername, chatId) {
  try {
    const member = await bot.getChatMember(channelUsername, chatId);
    console.log("member true",member);
    return member;
  }catch (error) { 
    console.log("error checking chat member",error);
    return null;
  }
}

async function getUserProfile(chatId) {
  try {
    const userProfilePhotos = await bot.getUserProfilePhotos(chatId);

    console.log("userProfilePhotos",userProfilePhotos);

    if (userProfilePhotos.total_count > 0) {
      const photo = userProfilePhotos.photos[0][0]; 
      console.log("photo",photo);
      const fileId = photo.file_id;

      const file = await bot.getFile(fileId);

      console.log("file",file);
      const photoUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

      console.log(`User's profile photo URL: ${photoUrl}`);
      return photoUrl;
    } else {
      console.log("User has no profile photo.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile photos:", error);

    if (error.response) {
      // Specific handling for known error types
      console.log(`Response status: ${error.response.status}`);
    }

    return null;
  }
}


bot.on('message', async (msg) => {
  let chatId = msg.chat.id.toString();
  console.log("chatId",chatId);
  let encChatId = encryptParams(chatId);
  let userName = msg.from.first_name.toString();
  let encUserName = encryptParams(userName);

  let userId = msg.from.id;

  let message = msg.text ? msg.text.toString().trim() : "";

  // let gameUrl = 'https://khabat.hivelancetech.com/';
  let gameUrl = 'https://game.shahnameh-bot.io/';
    // let gameUrl = 'https://khabatprod.hivelancetech.com/';

  const startCommandRegex = /\/start (.+)/;
  const match = message.match(startCommandRegex);

  if (match) {
    let refId = match[1]; 

    if (refId) {
      // refId = encryptParams(refId); 
      web_url = `${gameUrl}?chatId=${encChatId}&userName=${encUserName}&ref=${refId}&theme=dark`;
      menuButtonUrl = `${gameUrl}?chatId=${encChatId}&userName=${encUserName}&ref=${refId}&theme=dark`;
    }
  } else {
    web_url = `${gameUrl}?chatId=${encChatId}&userName=${encUserName}&theme=dark`;
    menuButtonUrl = `${gameUrl}?chatId=${encChatId}&userName=${encUserName}&theme=dark`;
  }

    bot.setChatMenuButton({
      chat_id: chatId,
      menu_button: JSON.stringify({ type: 'web_app', text: 'Play game', web_app: { url: menuButtonUrl } }),
    });
    
    const introMessage = `Hello! Welcome to Shahnameh Bot Game 👑 You are now the director of a crypto exchange. Which one? You choose. Tap the screen, collect coins, pump up your passive income, develop your own income strategy. We’ll definitely appreciate your efforts once the token is listed (the dates are coming soon). Don't forget about your friends — bring them to the game and get even more coins together!     


    
     سلام! به بازی بات شاهنامه خوش آمدید 👑 شما اکنون مدیر یک صرافی ارز دیجیتال هستید. کدام صرافی؟ خودتان انتخاب کنید. صفحه را لمس کنید، سکه‌ها را جمع کنید، درآمد غیرفعال خود را افزایش دهید و استراتژی درآمدی خود را توسعه دهید. به زودی بعد از لیست شدن توکن، تلاش‌های شما مورد قدردانی قرار خواهد گرفت (تاریخ‌ها نزدیک است). دوستانتان را فراموش نکنید — آن‌ها را به بازی دعوت کنید و با هم سکه‌های بیشتری به دست آورید!`;

    const options = {
      reply_markup: { 
        inline_keyboard: [
          [
            {
                text: 'Play in 1 click 👑',
                web_app: { url: web_url }
            }
          ],
          [
            {
                text: 'Subscribe to the channel',
                url: 'https://t.me/Shahnameh_news'
            }
          ],
          [
            {
              text: 'How to earn from the game',
              callback_data: 'instruction'
            }
          ],
        ]
      }
    };

    bot.sendMessage(chatId, introMessage, options);

    // const menuButtonUrl = `${gameUrl}?chatId=${chatId}&userName=${userName}&refId=${refId}`;
    
  })

bot.on('callback_query', (callbackQuery) => {
    const message = callbackQuery.message;

    if (callbackQuery.data === 'instruction') {
      const options = {
        reply_markup: { 
          inline_keyboard: [
            [
              {
                  text: 'Play in 1 click 👑',
                  web_app: { url: web_url }
              }
            ],
            [
              {
                  text: 'Subscribe to the channel',
                  url: 'https://t.me/Shahnameh_news'
              }
            ],
          ]
        }
      };

      const helpMessage = `
  How to play Shahnameh T2E 📜

  💰 Tap to Earn  
  Tap the screen and collect ancient coins.

  ⛏️ Mine  
  Upgrade your hero's abilities and collect powerful artifacts from the epic tales of Shahnameh.

  ⏰ Profit per Hour  
  Your hero will continue to gather resources even when you’re not in the game. Return after 3 hours to see your progress.

  📊 LVL  
  The more coins you collect, the higher your hero's level. Advance through the legendary chapters of Shahnameh.

  👥 Friends  
  Invite friends to join the adventure and earn bonuses. Help your friends complete their quests to unlock even greater rewards.

  🪙 Token Listing  
  At the end of the season, a special token will be released and distributed among the top players. Stay tuned for the announcement!


  چگونه در بازی شاهنامه T2E بازی کنیم 📜

  💰 لمس برای درآمد  
  صفحه را لمس کنید و سکه‌های باستانی جمع‌آوری کنید.

  ⛏️ معدن‌کاری  
  توانایی‌های قهرمان خود را ارتقا دهید و آثار قدرتمند را از داستان‌های حماسی شاهنامه به دست آورید.

  ⏰ درآمد در هر ساعت  
  قهرمان شما حتی زمانی که در بازی نیستید، به جمع‌آوری منابع ادامه می‌دهد. بعد از ۳ ساعت به بازی برگردید تا پیشرفت خود را مشاهده کنید.

  📊 سطح  
  هرچه سکه‌های بیشتری جمع‌آوری کنید، سطح قهرمان شما بالاتر می‌رود. از فصل‌های افسانه‌ای شاهنامه عبور کنید.

  👥 دوستان  
  دوستان خود را به ماجراجویی دعوت کنید و پاداش‌های اضافی کسب کنید. به دوستانتان کمک کنید تا مأموریت‌های خود را به پایان برسانند و پاداش‌های بزرگ‌تری را باز کنید.

  🪙 لیستینگ توکن  
  در پایان فصل، یک توکن ویژه منتشر خواهد شد و بین بازیکنان برتر توزیع می‌شود. منتظر اعلامیه باشید!
      `; 

        bot.sendMessage(message.chat.id, helpMessage, options);
    } 

    bot.answerCallbackQuery(callbackQuery.id);
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});


console.log("code running");

module.exports = { getChatMember, getUserProfile };