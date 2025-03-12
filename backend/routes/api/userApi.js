const mongoose = require('mongoose');
const level = require('../../model/level');
const common = require('../../helpers/common');
const express = require('express');

const moment = require('moment');
const { getChatMember, getUserProfile } = require('../../test');
const moment1= require('moment-timezone');
const cron = require('node-cron');
const { updateSkin } = require('./skin.js');

let router = express.Router();

const userPoints = require('../../model/userPoints');
const dailyReward = require('../../model/dailyReward');
const multiTap = require('../../model/multiTap');
const video = require('../../model/videomanage');
const dailycombo = require('../../model/dailyCombo');

const energyLevel = require('../../model/energyLevel');
const dailyword = require('../../model/dailyWords');
const cipherMatch = require('../../model/cipherMatch');
const rewards = require('../../model/reward');
const miniGame = require('../../model/miniGame');
const manageRewards = require('../../model/reward');
const skins = require('../../model/skins');
const userSkins = require('../../model/user_skins');
const selectedCombo = require('../../model/selectedCombo');
const userCards = require('../../model/user_cards');
var bankdata = require('../../model/bankdata');
const userWallet = require('../../model/userWallets');


let getCurrentDate = () => {
	let currentDate = new Date();
	return currentDate;
}


//"*/10 * * * * *",
//0 12 * * *

// Schedule the cron job to run at 2:00 AM every day
cron.schedule('0 2 * * *', async () => {
  console.log('Running a job at 2:00 AM every day');
  try {
    const words = common.getFiveLetterWordsFromMnemonic();
    if (words.length > 0) {
      const word = words[Math.floor(Math.random() * words.length)];
      const newWord = new dailyword({ word });
      await newWord.save();
      console.log('Word saved to the database:', newWord);
    } else {
      console.log('No 5-letter words generated.');
    }

    const randomCombos = await getRandomDailyCombos();
    if (randomCombos.length > 0) {
      console.log('Random daily combos:', randomCombos);
      const newComboEntry = new selectedCombo({ combos: randomCombos });
      await newComboEntry.save();
      console.log('Random daily combos saved to the database:', newComboEntry);
    } else {
      console.log('No daily combos found.');
    }
  } catch (error) {
    console.error('Error saving word to the database:', error);
  }
});



// cron.schedule('0 0 * * *', async () => {
//   const tehranTime = moment1().tz('Asia/Tehran');

//   if (tehranTime.hour() === 0) { // Check if it's midnight in Tehran
//     console.log('Running a job at 12:00 AM Tehran time');
//     try {
//       const words = common.getFiveLetterWordsFromMnemonic();
//       if (words.length > 0) {
//         const word = words[Math.floor(Math.random() * words.length)];
//         const newWord = new dailyword({ word });
//         await newWord.save();
//         console.log('Word saved to the database:', newWord);
//       } else {
//         console.log('No 5-letter words generated.');
//       }

//       const randomCombos = await getRandomDailyCombos();
//       if (randomCombos.length > 0) {
//         console.log('Random daily combos:', randomCombos);
//         const newComboEntry = new selectedCombo({ combos: randomCombos });
//         await newComboEntry.save();
//         console.log('Random daily combos saved to the database:', newComboEntry);
//       } else {
//         console.log('No daily combos found.');
//       }
//     } catch (error) {
//       console.error('Error saving word to the database:', error);
//     }
//   }
// });

// cron.schedule('*/10 * * * * *', async () => {
//   console.log('Running cron job at 12 AM');
//   try {
//     const randomCombos = await getRandomDailyCombos();
//     console.log('Random daily combos:', randomCombos);
//     const newComboEntry = new selectedCombo({ combos: randomCombos });
//     await newComboEntry.save();
//     console.log('Stored selected combos in new collection as an array.');
//   } catch (err) {
//     console.error('Error running cron job:', err);
//   }
// });

async function getRandomDailyCombos() {
  const count = await dailycombo.countDocuments();
  if (count === 0) return [];

  const randomIndexes = new Set();
  while (randomIndexes.size < 3 && randomIndexes.size < count) {
    const randomIndex = Math.floor(Math.random() * count);
    randomIndexes.add(randomIndex);
  }

  const randomCombos = await Promise.all(
    [...randomIndexes].map((index) =>
      dailycombo.findOne().skip(index).exec()
    )
  );

  return randomCombos;
}

router.post('/getUserScore', common.originMiddle, async (req, res) => {
 	try {
 		let info = req.body;
 		let miniGameData = {};
    let userSkinData = {};
    let userCardData = {};
    let userWalletData = {};

 		let project = { _id: 0, created_at: 0, updated_at: 0 , user_id : 0, first_name : 0};
 		let user = await userPoints.findOne({chatId: info.chatId }, project).exec();
 		let miniGames = await miniGame.findOne({ chatId: info.chatId}).exec();
 		if (user) {
 			let decodedChatId = await common.decodeParams(info.chatId);
        	let decodedUsername = await common.decodeParams(info.username);

    		let skinProject = { _id: 0, chatId: 0, username: 0, created_at: 0 };

 			let user_skins = await userSkins.findOne({chatId: info.chatId}, skinProject).exec();
 			let userSkinsData = user_skins.user_skins;

      let oldUserName = await common.decryptParams(user.username); 
      let newUserName = await common.decryptParams(info.username); 

      if(oldUserName != newUserName){
        let updateNewUserName = await userPoints.updateOne({chatId : info.chatId}
            ,{first_name : newUserName, username : decodedUsername})
            .exec();
      }
 			user.username = await common.decryptParams(info.username);
 			user.chatId = await common.decryptParams(user.chatId);
 			user.profile_pic = user.chatId ? await getUserProfile(user.chatId.trim()) : '';

 			let userLevel = await level.aggregate([{'$match': {'$expr': {'$and': [ { '$gte': [user.points, '$points_from'] }, { '$lte': [user.points, '$points_upto']}]}}}, { '$project': { _id: 0 } }]).exec();
 			// if(user.level != userLevel[0].level_name){
		  //  	let updation = { level :  userLevel[0].level_name };
			// 	let user = await userPoints.updateOne({chatId:info.chatId},updation).exec();
 			// }
 			let walletProject = { _id: 0, chatId: 0, username: 0, created_at: 0 };
 			let user_wallet = await userWallet.findOne({chatId: info.chatId }, walletProject).exec();

 			if(!user_wallet){
 				userWalletData.chatId = decodedChatId;
        userWalletData.username = decodedUsername;
        user_wallet = await userWallet.create(userWalletData);
 			}
 			res.json({ status: 1, userScore: user, userLevel: userLevel , userSkin : userSkinsData, userWalletData : user_wallet});
 		} else {
      	let firstLevel = await level.findOne({level : 1},{_id : 0}).exec();

 			let decodedChatId = await common.decodeParams(info.chatId);
        	let decodedUsername = await common.decodeParams(info.username);

			info.refferal_id = generateRandomNumber(10); 
			info.user_id = await common.decryptParams(info.chatId) || ''; 
			info.first_name = await common.decryptParams(info.username) || '';
			info.chatId = decodedChatId || '';
			info.username = decodedUsername || '';
			info.profile_pic = await getUserProfile(info.user_id.trim()); 

			info.level = firstLevel.level_name;
			let refId = info.refId;
			if (refId) {
				const referredUser = await userPoints.findOne({ refferal_id: refId }).exec();
				if (referredUser) {
					info.refferer_id = referredUser.refferal_id;
				}
			}

 			let insertUser = await userPoints.create(info);
      let userLevel = await level.aggregate([{'$match': {'$expr': {'$and': [{ '$gte': [insertUser.points, '$points_from'] },{ '$lte': [insertUser.points, '$points_upto']}]}}}, { '$project': { _id: 0 } }]).exec();

 			miniGameData.chatId = decodedChatId || ''; 
 			miniGameData.username = decodedUsername || '';
 			let insertMinigame = await miniGame.create(miniGameData);

 			userSkinData.chatId = decodedChatId;
			userSkinData.username = decodedUsername;

			userSkinData.user_skins = [{image : userLevel[0]?.image_name, name : userLevel[0]?.formatted_name, is_selected : 1, is_acquired : 1}];
      let insertUserSkin = await userSkins.create(userSkinData);

      userCardData.chatId = decodedChatId;
      userCardData.username = decodedUsername;
      let insertUserCard = await userCards.create(userCardData);

      userWalletData.chatId = decodedChatId;
      userWalletData.username = decodedUsername;
      let insertUserWallet = await userWallet.create(userWalletData);

 			if (insertUser && insertMinigame && insertUserSkin && insertUserCard && insertUserWallet) {	
 				let user = {
					points: insertUser.points,
					level: insertUser.level,
					current_energy: insertUser.current_energy,
					refferal_id: insertUser.refferal_id ,
					tap_energy: insertUser.tap_energy ,
					tap_energy_level: insertUser.tap_energy_level ,
					cipher_claimed_date : insertUser.cipher_claimed_date,
					reward_status : insertUser.reward_status,
					key : insertUser.key,
					profile_pic : insertUser.profile_pic
				};

		 		user.username = await common.decryptParams(insertUser.username);
		 		user.chatId = await common.decryptParams(insertUser.chatId);

		 		let userSkindata = insertUserSkin?.user_skins;

	 			let userLevel = await level.aggregate([{'$match': {'$expr': {'$and': [{ '$gte': [insertUser.points, '$points_from'] },{ '$lte': [insertUser.points, '$points_upto']}]}}}, { '$project': { _id: 0 } }]).exec();
	 			res.json({ status: 1, userScore: user, userLevel: userLevel, userSkin : userSkindata, userWalletData : insertUserWallet  });
	 		} else {
 				res.json({ status: 0, msg: "Something went wrong" });
 			}
 		}
 	} catch (error) {
 		console.error("error inserting user", error);
 		res.json({ status: 0, msg: "Something went wrong" });
 	}
});


function generateRandomNumber(length) {
    let text = "";
    const possible = "0123456789";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * possible.length);
        text += possible.charAt(randomIndex);
    }
    return text;
}


router.post('/validUser', common.originMiddle, async (req,res) => {
	try{
    let info = req.body;
		let user = await userPoints.findOne({chatId:info.chatId}).countDocuments().exec();
		if(user) {
			res.json({status : 1 , msg:'User Exists'});
		} else {
			res.json({status : 0, msg:'User Not Exists'});	
		}
	} catch(error) {
		res.json({status:0, msg:"Something went wrong"});
	}
})


router.get('/testing1', async (req,res) => {
	res.json({status:0, msg:"Hi Testing1 api"});
});


router.post('/rewardPoints', async (req, res) => {
  const { reward, chatId, ref } = req.body;

  try {
    const user = await userPoints.findOne({ chatId }).exec();
	user.username = await common.decryptParams(user.username)
	user.chatId = await common.decryptParams(user.chatId)
    if (user) {
      const referredCount = await userPoints.countDocuments({ refferer_id: ref }).exec();
      
      if (referredCount === 3) {
        return res.status(200).json({ status: 1, msg: 'Reward Already Credited', user });
      }
      else {
        return res.json({ status: 0, msg: 'Referred count does not meet the criteria' });
      }
    } else {
      return res.json({ status: 0, msg: 'User not found' });
    }
  } catch (error) {
    console.error('Error rewarding user:', error);
    return res.status(500).json({ status: 0, msg: 'Server error' });
  }
});


router.post('/watchedVideo',async (req, res) => {
  try {
    const { chatId, username } = req.body;

    const updatedUser = await userPoints.findOneAndUpdate(
      { chatId:chatId },
      { you_video_sts1: 1 },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ status: 0, message: 'User not found' });
    }

    return res.status(200).json({ status: 1, message: 'Userpoints updated successfully', user: updatedUser });
  } catch (err) {
    console.error('Error updating userpoints:', err);
    return res.status(500).json({ status: 0, message: 'Internal server error' });
  }
});


router.post('/getUserSkinsData', common.originMiddle, async(req,res) => {
	try{
    	const info = req.body;
    	let project = { _id: 0, chatId: 0, username: 0, created_at: 0 };
		let user_skins = await userSkins.findOne({chatId: info.chatId },project).exec();
		if(skin){
          res.json({ status: 1, data: user_skins });
		}else{
      		res.json({ status: 0, msg: "Something went wrong" });
		}
	} catch (error) {
    	console.error('Error getting skins data', error);
    	res.json({ status: 0, msg: error.message });
  }
})


module.exports = router;
