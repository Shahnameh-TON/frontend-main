const mongoose = require('mongoose');
const common = require('./common');
const userPoints = require('../model/userPoints');
const level = require('../model/level');
const dailyword = require('../model/dailyWords');
const cipherMatch = require('../model/cipherMatch');
const multi_tap = require('../model/multiTap');
const energy_level = require('../model/energyLevel');
const skins = require('../model/skins');
const userSkins = require('../model/user_skins');
// const { updateSkin } = require('../routes/api/userApi');
const { updateSkin } = require('../routes/api/skin.js');

let socket = 0;

exports.SocketInit = function(socketIO) {
  common.SocketInit(socketIO);
  socket = socketIO;
}

let getCurrentDate = () => {
	let currentDate = new Date();
	return currentDate;
}

exports.updateUserScore = async function(data, socket) {
	let resp = {};
  try {
		let userCount = await userPoints.findOne({chatId:data.chatId}).exec();
		let project = {_id : 0};
		let levels = await level.find({},project).exec();
		if(userCount) {
			let user = await userPoints.findOne({chatId:data.chatId}).exec();

			if(data.levelReached){
			  let userLevel = await level.aggregate([
				    { '$match': { '$expr': { '$and': [{ '$gte': [data.points, '$points_from'] }, { '$lte': [data.points, '$points_upto'] }] } } },
				    { '$project': { _id: 0 } }
				]).exec();

				if (userLevel.length > 0) {
					let multiTap = await multi_tap.find({},project).exec();
					let energyLevel = await energy_level.find({},project).exec();

	        let newLevel = userLevel[0];

					// if(user.tap_energy < newLevel?.tap_level ) {
							data.tap_energy = newLevel?.tap_level;
					// } else if(user.tap_energy >= newLevel?.tap_level){
					// 		data.tap_energy = user.tap_energy;
					// } else {
					// 		data.tap_energy = user.tap_energy + 1;
					// }

					// if(user.tap_energy_level < newLevel?.energy_level ) {
							data.tap_energy_level = newLevel?.energy_level;
    					data.current_energy = newLevel?.energy_level;
					// } else if(user.tap_energy_level >= newLevel?.energy_level){
					// 		data.tap_energy_level = user.tap_energy_level;
					// }else {
					// 		data.tap_energy_level = user.tap_energy_level + 500;
					// }

					data.level = newLevel?.level_name;
					
	        for (let i = 2; i <= userCount.multitap_level; i++) {
	          let matchedMultiTap = multi_tap.find(mt => mt.level === i);
	          if (matchedMultiTap) {
	            data.tap_energy += matchedMultiTap.tap_level; 
	          } else {
	            data.tap_energy += 1;  
	          }
	        }

	        for (let i = 2; i <= userCount.multienergy_level; i++) {
	          let matchedEnergyLevel = energy_level.find(el => el.level === i);
	          if (matchedEnergyLevel) {
	            data.tap_energy_level += matchedEnergyLevel.energy_level; 
	            data.current_energy += matchedEnergyLevel.energy_level; 
	          } else {
	            data.tap_energy_level += 500;  
	            data.current_energy += 500;  
	          }
	        }	    

	    		await updateSkin(userCount, userLevel[0]);
				}
			}
			
			let updation = {
				...data
			};
			
			let updateScore = await userPoints.updateOne({chatId : data.chatId},updation).exec();

			if(data.levelReached){
				let updatedLevel = {};
				updatedLevel.userLevel = await level.aggregate([{'$match': {'$expr': { '$and': [ { '$gte': [data.points, '$points_from'] }, {'$lte': [ data.points, '$points_upto' ] }]}}},{'$project' : {_id : 0}}]).exec();
				let project = {_id : 0, created_at : 0,updated_at : 0,reward_start_date : 0,last_claimed_date : 0 , next_day : 0, prev_day : 0};
				let user = await userPoints.findOne({chatId:data.chatId},project).exec();
				user.username = await common.decryptParams(user.username);
        user.chatId = await common.decryptParams(user.chatId);
        updatedLevel.user = user;
    		let skinProject = { _id: 0, chatId: 0, username: 0, created_at: 0 };
        let user_skins = await userSkins.findOne({chatId: data.chatId }, skinProject).exec();
 				let userSkinsData = user_skins.user_skins;

 				updatedLevel.userSkin = userSkinsData;

				socket.emit("updatedScoreAndLevel",updatedLevel);
			}
			resp['status'] = 1;
			resp['msg'] = "Score Updated Successfully";
		}else {
			let insertScore = await userPoints.create(data);
			if(insertScore){
				resp['status'] = 1;
				resp['msg'] = "Score Inserted Successfully";
			}else {
				resp['status'] = 0;
				resp['msg'] = "Failed to create an user.";
			}
		}
  } catch(error){
  	console.log(error);
			resp['msg'] = error.message;
  }

}


exports.updateEnergy = async function(data, socket) {
	let resp = {};
  try {
			let user = await userPoints.findOne({chatId:data.chatId}).countDocuments().exec();
			if(user) {
				let updation = { current_energy: data.energy_level };
				let updateScore = await userPoints.updateOne({chatId : data.chatId},updation).exec();
				resp['status'] = 1;
				resp['msg'] = "Score Updated Successfully";
			}
  } catch(error){
			resp['msg'] = error.message;
  }
}


let getDateRange = () => {
		let currentDate = new Date();	
    let start = new Date(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate());
    let end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
};

let currentIndex = 0; 
let currentResult = ""; 

exports.checkCipher = async function(data, socket) {
let cipherClaim = false;
	let info = data.data;

	let inputCipher = info.cipher;

	let resp = {};
	try{

		let {start , end} = getDateRange();

		let query = {createdAt : {'$gte' : start , '$lt' : end }}
		let project = {_id  : 0 ,createdAt : 0};
		let project1 = {'_id': 0, 'created_at': 0, 'updated_at': 0, 'match._id': 0};
	  	let word = await dailyword.findOne(query,project).exec();
	  	let ciphers = await cipherMatch.findOne({},project1).exec();
	  	if(word && ciphers) {
	  		let todayWord = word.word.toUpperCase();

	  		const cipherMap = {};
				ciphers.match.forEach(item => {
				  cipherMap[item.letter] = item.cipher;
				});

				let result = {};
				// let currLetter ;

				if(cipherMap[todayWord[currentIndex]] == inputCipher){
					currentResult += todayWord[currentIndex];
					// currLetter = todayWord[currentIndex];
			    currentIndex++;
				}else{
					currentIndex = 0;
					currentResult = "";
					// currLetter = "";
			  }

			  if(currentResult != "" && currentResult == todayWord){
			  	let updation = {cipher_claimed_date : getCurrentDate()};
			  	let updateUserSts = await userPoints.updateOne({chatId : info.chatId},updation);
			  	if(updateUserSts){
			  		cipherClaim = true;
			  	} else{
			  		cipherClaim = false;
			  	}
			  }

			  result.currentResult = currentResult;
			  result.cipherClaim = cipherClaim;

			  socket.emit("cipherResult", result);

	  	} else {
	  		// console.log("word",word); 
	   	}
	} catch(error) {
		console.log(error);
		// res.json({status:0, msg:"Something went wrong"});
	}
}



// exports.awardOnePoint = async function (data, socket) {
//   let resp = {};
//   let levelUpgraded = false;
//   try {
//     let user = await userPoints.findOne({chatId: data.chatId }).exec();
// 	  let userLevel = await level.aggregate([{'$match': {'$expr': {'$and': [{ '$gte': [user.points, '$points_from'] },{ '$lte': [user.points, '$points_upto']}]}}}, { '$project': { _id: 0 } }]).exec();
//     let points_upto = userLevel[0]?.points_upto;
//     if (user) {
//       let now = new Date();
//       let updateScore;
//       let bonusPoints = 0; 
//     	const userpoint= await userPoints.findOne({ chatId: data.chatId}).exec();
//       let oldpoint = userpoint.points;
//       if (user.combo_profit > 0) {
//         let timeSinceLastReward = (now - new Date(user.lastRewardTime)) / 1000;
//         timeSinceLastReward = Math.ceil(timeSinceLastReward);   
//         let pointsToAward = 0;
//         if (timeSinceLastReward >= 10) {
//           let pointsPeriod = Math.floor(timeSinceLastReward / 3);
//           let rewardRatio = user.combo_profit / 3600;

//           bonusPoints = Math.round(rewardRatio * pointsPeriod) * 3;
//         } else if (timeSinceLastReward >= 3) {
//           let rewardRatio = user.combo_profit / 3600;
//           // pointsToAward = Math.ceil(rewardRatio) * 3;

// 			    if (rewardRatio < 1) {
// 			        let intervalSeconds = Math.round(1 / rewardRatio);

// 			        pointsToAward = Math.floor(timeSinceLastReward / intervalSeconds);
// 			    } else {
// 			        pointsToAward = Math.ceil(rewardRatio) * 3;
// 			    }
//         }

//         let totalPointsToAward = pointsToAward + bonusPoints;
//         let mulTotal = totalPointsToAward ;

//         if (mulTotal > 0) {
//           let newPoints = user.points + mulTotal;
//           user.points = newPoints;
//           user.lastRewardTime = now;
//           // const userpoint= await userPoints.findOne({ chatId: data.chatId}).exec();
//           // console.log('userpoint',userpoint.points);
//           // let oldpoint =userpoint.points;

//           if(newPoints >= points_upto ){
// 		        let userLevel = await level.aggregate([
// 						    { '$match': { '$expr': { '$and': [{ '$gte': [newPoints, '$points_from'] }, { '$lte': [newPoints, '$points_upto'] }] } } },
// 						    { '$project': { _id: 0 } }
// 						]).exec();

// 						if (userLevel.length > 0) {
// 							let project = {_id : 0};
// 							let multiTap = await multi_tap.find({},project).exec();
// 							let energyLevel = await energy_level.find({},project).exec();

// 			        let newLevel = userLevel[0];

// 							if(user.tap_energy < newLevel?.tap_level ) {
// 									user.tap_energy = newLevel?.tap_level;
// 							} else if(user.tap_energy >= newLevel?.tap_level){
// 									user.tap_energy = user.tap_energy;
// 							} else {
// 									user.tap_energy = user.tap_energy + 1;
// 							}

// 							if(user.tap_energy_level < newLevel?.energy_level ) {
// 									user.tap_energy_level = newLevel?.energy_level;
// 							} else if(user.tap_energy_level >= newLevel?.energy_level){
// 									user.tap_energy_level = user.tap_energy_level;
// 							}else {
// 									user.tap_energy_level = user.tap_energy_level + 500;
// 							}

							
// 					    let matchedMultiTap = multiTap.find(mt => mt.level > 1 && mt.level == user.multitap_level);
// 					    if (matchedMultiTap) {
// 					        user.tap_energy += matchedMultiTap.tap_level;
// 					    }

// 					    let matchedEnergyLevel = energyLevel.find(el => el.level > 1 && el.level == user.multienergy_level);
// 					    if (matchedEnergyLevel) {
// 					        user.tap_energy_level += matchedEnergyLevel.energy_level;
// 					    }		    

// 			    		await updateSkin(user, userLevel[0]);
// 							user.level = newLevel?.level_name;
// 							levelUpgraded = true;
// 						}

//           }

// 				const savedUser = await user.save();

//           // updateScore = await userPoints.updateOne(
//           //   { chatId: data.chatId },
//           //   { points: newPoints, lastRewardTime: now }
//           // ).exec();

//           if (savedUser) {
//             resp['status'] = 1;
//             resp['msg'] = `Awarded ${mulTotal} points successfully.`;
//             resp['bonusPoints'] = bonusPoints > 0 ? bonusPoints : null; 
//             resp['points'] = mulTotal;
//             resp['newPoints'] = newPoints;
//             resp['oldpoint'] = oldpoint;
//             resp['levelUpgraded'] = levelUpgraded;
//           } else {
//             resp['status'] = 0;
//             resp['msg'] = "Failed to update points.";
//             resp['bonusPoints'] = null; 
//             resp['points'] = null;
//             resp['newPoints'] = newPoints;
//             resp['oldpoint'] = oldpoint;
//             resp['levelUpgraded'] = levelUpgraded;
//           }
//         } else {
//           resp['status'] = 1;
//           resp['msg'] = "Not enough time has passed since the last reward.";
//           resp['bonusPoints'] = null; 
//           resp['points'] = null; 
//           resp['oldpoint'] = oldpoint;
//         }
//       } else {
//         resp['status'] = 0;
//         resp['msg'] = "User does not have combo points.";
//         resp['bonusPoints'] = null; 
//         resp['points'] = null; 
//       }
//     } else {
//       resp['status'] = 0;
//       resp['msg'] = "User not found.";
//       resp['bonusPoints'] = null; 
//       resp['points'] = null; 
//     }
//   } catch (error) {
//     resp['status'] = 0;
//     resp['msg'] = error.message;
//     resp['bonusPoints'] = null; 
//     resp['points'] = null; 
//   }
//   socket.emit('awardOnePointResponse', resp);
// };


// exports.awardOnePoint = async function (data, socket) {
//   let resp = {};
//   let levelUpgraded = false;
//   const THREE_HOURS_IN_SECONDS = 3 * 60 * 60;
//     const ONE_MINUTES_IN_SECONDS = 1 * 60;
//   try {
//     let user = await userPoints.findOne({chatId: data.chatId }).exec();

//     if (user) {
//       // console.log('lastrwdtine', user.lastRewardTime);
//       let now = new Date();
//       let bonusPoints = 0;
//       let pointsToAward = 0;

//       let timeSinceLastReward = (now - new Date(user.lastRewardTime)) / 1000; 

//       if (timeSinceLastReward >= THREE_HOURS_IN_SECONDS) {
//         let fullPeriods = Math.floor(timeSinceLastReward / THREE_HOURS_IN_SECONDS); 

//         // let rewardRatio = user.combo_profit / 3600; 
//         let rewardRatio = user.combo_profit ; 

//         pointsToAward = Math.round(rewardRatio * 3); 

//         // user.points += pointsToAward;
//         user.lastRewardTime = now; 
//         bonusPoints += pointsToAward;
//         console.log('1',pointsToAward)

//         // console.log(`Awarded ${pointsToAward} points for exceeding 3 hours.`);
//       }
//   else if (timeSinceLastReward >= ONE_MINUTES_IN_SECONDS) {
//     // Calculate how many full 3-minute periods have passed
//     let fullThreeMinutePeriods = Math.floor(timeSinceLastReward / ONE_MINUTES_IN_SECONDS);

//     // Adjust the reward ratio to reflect 3-minute periods (if combo_profit is per hour)
//     let rewardRatio = user.combo_profit / 20; // Divide by 20 to scale down for 3 minutes

//     // Calculate points to award for full 3-minute periods
//     pointsToAward = Math.round(rewardRatio * fullThreeMinutePeriods);

//     // Update the user's points and last reward time
//     // user.points += pointsToAward;
//     user.lastRewardTime = now; 
//     bonusPoints += pointsToAward;
//         console.log('2',pointsToAward)
//   console.log(new Date(user.lastRewardTime))
//     // Log awarded points for 3-minute condition (optional)
//     // console.log(`Awarded ${pointsToAward} points for exceeding 3 minutes.`);
// }

//       else {
//         let rewardRatio = user.combo_profit / 3600;
//         let pointsPeriod = Math.floor(timeSinceLastReward / 3);
//         pointsToAward = Math.round(rewardRatio * pointsPeriod * 3);
//         console.log('3',pointsToAward)
//         if (pointsToAward > 0) {
//           user.points += pointsToAward;
//           user.lastRewardTime = now; 
//           // console.log(`Awarded ${pointsToAward} points for normal flow.`);
//         } else {
//           // console.log('Not enough time has passed to award points.');
//         }
//       }

//       let userLevel = await level.aggregate([
//         {
//           '$match': {
//             '$expr': {
//               '$and': [
//                 { '$gte': [user.points, '$points_from'] },
//                 { '$lte': [user.points, '$points_upto'] }
//               ]
//             }
//           }
//         },
//         { '$project': { _id: 0 } }
//       ]).exec();

//       let points_upto = userLevel[0]?.points_upto;

//       if (user.points >= points_upto) {
//         let newLevel = userLevel[0];

//         if (user.tap_energy < newLevel?.tap_level) {
//           user.tap_energy = newLevel?.tap_level;
//         }

//         if (user.tap_energy_level < newLevel?.energy_level) {
//           user.tap_energy_level = newLevel?.energy_level;
//         }

//         user.level = newLevel?.level_name;
//         levelUpgraded = true;
//       }

//       const savedUser = await user.save();

//       if (savedUser) {
//         resp['status'] = 1;
//         resp['msg'] = `Awarded ${pointsToAward} points successfully`;
//         resp['bonusPoints'] = bonusPoints > 0 ? bonusPoints : null;
//         resp['points'] = pointsToAward;
//         resp['newPoints'] = user.points;
//         resp['levelUpgraded'] = levelUpgraded;
//       } else {
//         resp['status'] = 0;
//         resp['msg'] = "Failed to update points.";
//         resp['bonusPoints'] = null;
//         resp['points'] = null;
//         resp['newPoints'] = user.points;
//         resp['levelUpgraded'] = levelUpgraded;
//       }
//     } else {
//       resp['status'] = 0;
//       resp['msg'] = "User not found.";
//       resp['bonusPoints'] = null;
//       resp['points'] = null;
//     }
//   } catch (error) {
//     resp['status'] = 0;
//     resp['msg'] = error.message;
//     resp['bonusPoints'] = null;
//     resp['points'] = null;
//   }

//   socket.emit('awardOnePointResponse', resp);
// };


// exports.awardOnePoint = async function (data, socket) {
//   let resp = {};
//   let levelUpgraded = false;
//   const THREE_HOURS_IN_SECONDS = 3 * 60 * 60; // 10800 seconds
//   const THREE_MINUTES_IN_SECONDS = 3 * 60; // 180 seconds
//   const ONE_MINUTES_IN_SECONDS = 1 * 60; // 60 seconds

//   try {
//     // Fetch the user from the database
//     let user = await userPoints.findOne({ chatId: data.chatId }).exec();

//     if (user) {
//       let now = new Date(); // Current time
//       let bonusPoints = 0;
//       let pointsToAward = 0;

//       // Calculate the time since the last reward
//       let timeSinceLastReward = (now - new Date(user.lastRewardTime)) / 1000; 

//       // Check if the time since the last reward is greater than or equal to 3 hours
//       if (timeSinceLastReward >= THREE_HOURS_IN_SECONDS) {
//         let fullPeriods = Math.floor(timeSinceLastReward / THREE_HOURS_IN_SECONDS); 

//         // Use the combo profit as is since this condition applies for every 3 hours
//         let rewardRatio = user.combo_profit; 
//         pointsToAward = Math.round(rewardRatio * fullPeriods); // Full periods of 3 hours
        
//         // Update user properties
//         user.lastRewardTime = now; 
//         bonusPoints += pointsToAward;
//         console.log('Awarded points for exceeding 3 hours:', pointsToAward);

//       } else if (timeSinceLastReward >= ONE_MINUTES_IN_SECONDS) {
//         // Calculate how many full 3-minute periods have passed
//         let fullThreeMinutePeriods = Math.floor(timeSinceLastReward / THREE_MINUTES_IN_SECONDS); // Correctly use 180 seconds
        
//         // Adjust the reward ratio for 3-minute periods (assuming combo_profit is for an hour)
//         let rewardRatio = user.combo_profit / 20; // Divide by 20 to scale down for 3 minutes

//         // Calculate points to award for full 3-minute periods
//         pointsToAward = Math.round(rewardRatio * fullThreeMinutePeriods);

//         // Update user properties
//         user.lastRewardTime = now; 
//         bonusPoints += pointsToAward;
//         console.log('Awarded points for exceeding 1 minute:', pointsToAward);

//       } else {
//         // Normal flow for when less than 1 minute has passed
//         let rewardRatio = user.combo_profit / 3600; // Points per hour
//         let pointsPeriod = Math.floor(timeSinceLastReward / 3); // Points for every 3 seconds
//         pointsToAward = Math.round(rewardRatio * pointsPeriod * 3); // Total points for elapsed time

//         if (pointsToAward > 0) {
//           user.points += pointsToAward; // Update user's points
//           user.lastRewardTime = now; // Update last reward time
//           console.log('Awarded points for normal flow:', pointsToAward);
//         } else {
//           console.log('Not enough time has passed to award points.');
//         }
//       }

//       // Check user level
//       let userLevel = await level.aggregate([
//         {
//           '$match': {
//             '$expr': {
//               '$and': [
//                 { '$gte': [user.points, '$points_from'] },
//                 { '$lte': [user.points, '$points_upto'] }
//               ]
//             }
//           }
//         },
//         { '$project': { _id: 0 } }
//       ]).exec();

//       let points_upto = userLevel[0]?.points_upto;

//       // Level upgrade logic
//       if (user.points >= points_upto) {
//         let newLevel = userLevel[0];

//         if (user.tap_energy < newLevel?.tap_level) {
//           user.tap_energy = newLevel?.tap_level;
//         }

//         if (user.tap_energy_level < newLevel?.energy_level) {
//           user.tap_energy_level = newLevel?.energy_level;
//         }

//         user.level = newLevel?.level_name;
//         levelUpgraded = true;
//       }

//       // Save the user data to the database
//       const savedUser = await user.save();

//       // Respond back to the socket
//       if (savedUser) {
//         resp['status'] = 1;
//         resp['msg'] = `Awarded ${pointsToAward} points successfully`;
//         resp['bonusPoints'] = bonusPoints > 0 ? bonusPoints : null;
//         resp['points'] = pointsToAward;
//         resp['newPoints'] = user.points;
//         resp['levelUpgraded'] = levelUpgraded;
//       } else {
//         resp['status'] = 0;
//         resp['msg'] = "Failed to update points.";
//         resp['bonusPoints'] = null;
//         resp['points'] = null;
//         resp['newPoints'] = user.points;
//         resp['levelUpgraded'] = levelUpgraded;
//       }
//     } else {
//       resp['status'] = 0;
//       resp['msg'] = "User not found.";
//       resp['bonusPoints'] = null;
//       resp['points'] = null;
//     }
//   } catch (error) {
//     resp['status'] = 0;
//     resp['msg'] = error.message;
//     resp['bonusPoints'] = null;
//     resp['points'] = null;
//   }

//   // Emit the response back to the client
//   socket.emit('awardOnePointResponse', resp);
// };


exports.awardOnePoint = async function (data, socket) {
  let resp = {};
  let levelUpgraded = false;
  const THREE_HOURS_IN_SECONDS = 3 * 60 * 60; // 10800 seconds
  const THREE_MINUTES_IN_SECONDS = 3 * 60; // 180 seconds
  const ONE_MINUTES_IN_SECONDS = 1 * 60; // 60 seconds

  try {
    // Fetch the user from the database
    let user = await userPoints.findOne({ chatId: data.chatId }).exec();

    if (user) {
      let now = new Date(); // Current time
      let bonusPoints = 0;
      let pointsToAward = 0;

      // Calculate the time since the last reward
      let timeSinceLastReward = (now - new Date(user.lastRewardTime)) / 1000; 

			if (timeSinceLastReward >= THREE_HOURS_IN_SECONDS) {
			  // Directly award points based on the combo profit for 3 hours only
			  pointsToAward = Math.round(user.combo_profit * 3); // Award points for the last 3 hours
			  
			  // Update user properties
			  user.lastRewardTime = now; 
			  bonusPoints += pointsToAward;
			  console.log('Awarded points for coming back after 3 hours or more:', pointsToAward);
			}

      else if (timeSinceLastReward >= ONE_MINUTES_IN_SECONDS) {
        // Calculate how many full 3-minute periods have passed
        let fullThreeMinutePeriods = Math.floor(timeSinceLastReward / THREE_MINUTES_IN_SECONDS);
        
        // Adjust the reward ratio for 3-minute periods (assuming combo_profit is for an hour)
        let rewardRatio = user.combo_profit / 20; // Divide by 20 to scale down for 3 minutes

        // Calculate points to award for full 3-minute periods
        pointsToAward = Math.round(rewardRatio * fullThreeMinutePeriods);

        // Update user properties
        user.lastRewardTime = now; 
        bonusPoints += pointsToAward;
        console.log('Awarded points for exceeding 1 minute:', pointsToAward);
      } else {
        // Normal flow for when less than 1 minute has passed
        let rewardRatio = user.combo_profit / 3600; // Points per hour
        let pointsPeriod = Math.floor(timeSinceLastReward / 3); // Points for every 3 seconds
        pointsToAward = Math.round(rewardRatio * pointsPeriod * 3); // Total points for elapsed time

        if (pointsToAward > 0) {
          user.points += pointsToAward; // Update user's points
          user.lastRewardTime = now; // Update last reward time
          console.log('Awarded points for normal flow:', pointsToAward);
        } else {
          console.log('Not enough time has passed to award points.');
        }
      }

      // Check user level
      let userLevel = await level.aggregate([
        {
          '$match': {
            '$expr': {
              '$and': [
                { '$gte': [user.points, '$points_from'] },
                { '$lte': [user.points, '$points_upto'] }
              ]
            }
          }
        },
        { '$project': { _id: 0 } }
      ]).exec();

      let points_upto = userLevel[0]?.points_upto;

      // Level upgrade logic
      if (user.points >= points_upto) {
        let newLevel = userLevel[0];

        if (user.tap_energy < newLevel?.tap_level) {
          user.tap_energy = newLevel?.tap_level;
        }

        if (user.tap_energy_level < newLevel?.energy_level) {
          user.tap_energy_level = newLevel?.energy_level;
        }

        user.level = newLevel?.level_name;
        levelUpgraded = true;
      }

      // Save the user data to the database
      const savedUser = await user.save();

      // Respond back to the socket
      if (savedUser) {
        resp['status'] = 1;
        resp['msg'] = `Awarded ${pointsToAward} points successfully`;
        resp['bonusPoints'] = bonusPoints > 0 ? bonusPoints : null;
        resp['points'] = pointsToAward;
        resp['newPoints'] = user.points;
        resp['levelUpgraded'] = levelUpgraded;
      } else {
        resp['status'] = 0;
        resp['msg'] = "Failed to update points.";
        resp['bonusPoints'] = null;
        resp['points'] = null;
        resp['newPoints'] = user.points;
        resp['levelUpgraded'] = levelUpgraded;
      }
    } else {
      resp['status'] = 0;
      resp['msg'] = "User not found.";
      resp['bonusPoints'] = null;
      resp['points'] = null;
    }
  } catch (error) {
    resp['status'] = 0;
    resp['msg'] = error.message;
    resp['bonusPoints'] = null;
    resp['points'] = null;
  }

  // Emit the response back to the client
  socket.emit('awardOnePointResponse', resp);
};

