const mongoose = require('mongoose');
const common = require('../../helpers/common');
const express = require('express');

let router = express.Router();

const level = require('../../model/level');
var bankdata = require('../../model/bankdata');
const userPoints = require('../../model/userPoints');
const dailyReward = require('../../model/dailyReward');
const multiTap = require('../../model/multiTap');
const video = require('../../model/videomanage');
const dailycombo = require('../../model/dailyCombo');
const energyLevel = require('../../model/energyLevel');
const dailyword = require('../../model/dailyWords');
const cipherMatch = require('../../model/cipherMatch');
const rewards = require('../../model/reward');
const manageRewards = require('../../model/reward');
const skins = require('../../model/skins');
const miniGame = require('../../model/miniGame');
const userSkins = require('../../model/user_skins');
const userCards = require('../../model/user_cards');
const userWallet = require('../../model/userWallets');
const selectedCombo = require('../../model/selectedCombo');

const { updateSkin } = require('./skin.js');

router.post('/managelist', async (req, res) => {
    try {
        const info = req.body;
        const resData = await rewards.find().exec();
        if (!resData) {
            return res.json({ success: 2, msg: "No data", data: resData });
        }
        res.json({success: 1, data: {levelData: resData,}});
    } catch (error) {
        console.error("Error fetching list!", error);
        res.json({ success: 0, msg: "Error fetching list!" });
    }
});


router.post('/updateDailyRewards', common.originMiddle, async (req,res) => {
	try{
    let info = req.body;
   	let currentDate = new Date();

		let userSearch = {$and:[{username:info.username, chatId:info.chatId}]};

		let user = await userPoints.findOne(userSearch).exec();
		let levels = await level.find({}).exec();

		if(user) {
			if(info.checkStatus){
				const lastClaimedDate = new Date(user.last_claimed_date);

				const startOfToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);
    			const endOfToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59, 999);

				const startOfYesterday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1, 0, 0, 0);
				const endOfYesterday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1, 23, 59, 59, 999);

				if(lastClaimedDate >= startOfToday && lastClaimedDate <= endOfToday){
				  	res.json({status: 1, msg: 'Come back Tomorrow'});
				}else if(lastClaimedDate >= startOfYesterday && lastClaimedDate <= endOfYesterday) {
				  	let reward_start_date = new Date(user.reward_start_date);

			        const dateOnly1 = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
			        const dateOnly2 = new Date(reward_start_date.getFullYear(), reward_start_date.getMonth(), reward_start_date.getDate());

			        const diffInMilliseconds = dateOnly1 - dateOnly2;
			        const diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);
					let project = {_id : 0, created_at : 0, updated_at : 0};

					let dailyRewardCount = await dailyReward.aggregate([{$project:{NumberOfItems:{$size:"$rewards"}}}]).exec();

					dailyRewardCount = dailyRewardCount[0].NumberOfItems;
			        if(diffInDays != dailyRewardCount){
					    let updation = {
				    		prev_day : diffInDays,
					    };
					    let dailyRewards = await userPoints.updateOne(userSearch, updation).exec();
						if(dailyRewards) {
							res.json({status : 1, msg:'Streak Status Updated'});
						} else {
							res.json({status : 0, msg:'Something went wrong'});	
						}
			        }else{
			        	let updation = {
					        prev_day : 0,
				    			next_day : 0, 
					        last_claimed_date: "",
					        reward_start_date : "",
					  	};
					  	let dailyRewards = await userPoints.updateOne(userSearch, updation).exec();
						if(dailyRewards) {
							res.json({status : 1, msg:'Streak Status Restarted'});
						} else {
							res.json({status : 0, msg:'Something went wrong'});	
						}
			        }
				} else {
					let updation = {
				        prev_day : 0,
			    			next_day : 0, 
				        last_claimed_date: "",
				        reward_start_date : "",
				  	};
				  	let dailyRewards = await userPoints.updateOne(userSearch, updation).exec();
					if(dailyRewards) {
						res.json({status : 1, msg:'Streak Breaked'});
					} else {
						res.json({status : 0, msg:'Something went wrong'});	
					}
				}
			} else{
				let currentPoints = user.points || 0; 
		    	let newPoints = info.points || 0; 
		    	let totalPoints = currentPoints + newPoints;

				let project = {_id : 0};

				let userLevel = await level.aggregate([
                    { '$match': { '$expr': { '$and': [{ '$gte': [totalPoints, '$points_from'] }, { '$lte': [totalPoints, '$points_upto'] }] } } },
                    { '$project': { _id: 0 } }
                ]).exec();

                if (userLevel.length > 0) {
                    let newLevel = userLevel[0];                	
			    	let multi_tap = await multiTap.find({},project).exec();
					let energy_level = await energyLevel.find({},project).exec();
			    	let data = {};
					data.level = newLevel?.level_name;
					// data.tap_energy_level = newLevel?.energy_level;
					// data.current_energy = newLevel?.energy_level;
					// data.tap_energy = newLevel?.tap_level;
					data.prev_day = info.prev_day;
					data.next_day = info.next_day;

					if(user.tap_energy < newLevel?.tap_level ) {
						data.tap_energy = newLevel?.tap_level;
					} else if(user.tap_energy >= newLevel?.tap_level){
						data.tap_energy = user.tap_energy;
					} else {
						data.tap_energy = user.tap_energy + 1;
					}

					if(user.tap_energy_level < newLevel?.energy_level ) {
						data.tap_energy_level = newLevel?.energy_level;
						data.current_energy = newLevel?.energy_level;
					} else if(user.tap_energy_level >= newLevel?.energy_level){
						data.tap_energy_level = user.tap_energy_level;
						data.current_energy = user.tap_energy_level;
					}else {
						data.tap_energy_level = user.tap_energy_level + 500;
						data.current_energy = user.tap_energy_level + 500;
					}

					let matchedMultiTap = multi_tap.find(mt => mt.level > 1 && mt.level == user.multitap_level);
				    if (matchedMultiTap) {
				        data.tap_energy += matchedMultiTap.tap_level;
				    }

				    let matchedEnergyLevel = energy_level.find(el => el.level > 1 && el.level == user.multienergy_level);
				    if (matchedEnergyLevel) {
				        data.tap_energy_level += matchedEnergyLevel.energy_level;
				        data.current_energy += matchedEnergyLevel.energy_level;
				    }

	    			await updateSkin(user, userLevel[0]);
										
					if(!user.reward_start_date && !user.last_claimed_date){
					    let updation = {
					        ...data, 
					        reward_start_date: currentDate,
					        last_claimed_date: currentDate,
					        points: totalPoints
					    };

					    let dailyRewards = await userPoints.updateOne(userSearch, updation).exec();
						if(dailyRewards) {
							res.json({status : 1, msg:'Daily Rewards Credited', reward : 1});
						} else {
							res.json({status : 0, msg:'Something went wrong'});	
						}
					} else{
					    let updation = {
					        ...data, 
					        last_claimed_date: currentDate,
					        points: totalPoints
					    };
					    let dailyRewards = await userPoints.updateOne(userSearch, updation).exec();
						if(dailyRewards) {
							res.json({status : 1, msg:'Daily Rewards Credited' , reward : 1});
						} else {
							res.json({status : 0, msg:'Something went wrong'});	
						}
					}
				}
			}	
		} else {
				res.json({status : 0, msg:'User Not Exists'});	
		}
	} catch(error) {
		console.log(error);
		res.json({status:0, msg:error.message});
	}
})


// router.post('/updateDailyRewards', common.originMiddle, async (req,res) => {
// 	try{
//     let info = req.body;
//    	let currentDate = new Date();

// 		let userSearch = {$and:[{ chatId:info.chatId}]};

// 		let user = await userPoints.findOne(userSearch).exec();
// 		let levels = await level.find({}).exec();

// 		if(user) {
//       let previousLevel = user.level;

//       console.log("checkStatus",info.checkStatus);
// 			if(info.checkStatus){
// 				const lastClaimedDate = new Date(user.last_claimed_date);

// 				const startOfToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);
//     			const endOfToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59, 999);

// 				const startOfYesterday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1, 0, 0, 0);
// 				const endOfYesterday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1, 23, 59, 59, 999);

// 				if(lastClaimedDate >= startOfToday && lastClaimedDate <= endOfToday){
// 				  	res.json({status: 1, msg: 'Come back Tomorrow'});
// 				}else if(lastClaimedDate >= startOfYesterday && lastClaimedDate <= endOfYesterday) {
// 				  	let reward_start_date = new Date(user.reward_start_date);

// 			        const dateOnly1 = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
// 			        const dateOnly2 = new Date(reward_start_date.getFullYear(), reward_start_date.getMonth(), reward_start_date.getDate());

// 			        const diffInMilliseconds = dateOnly1 - dateOnly2;
// 			        const diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);
// 					let project = {_id : 0, created_at : 0, updated_at : 0};

// 					let dailyRewardCount = await dailyReward.aggregate([{$project:{NumberOfItems:{$size:"$rewards"}}}]).exec();

// 					dailyRewardCount = dailyRewardCount[0].NumberOfItems;
// 			        if(diffInDays != dailyRewardCount){
// 					    let updation = {
// 				    		prev_day : diffInDays,
// 					    };
// 					    let dailyRewards = await userPoints.updateOne(userSearch, updation).exec();
// 						if(dailyRewards) {
// 							res.json({status : 1, msg:'Streak Status Updated'});
// 						} else {
// 							res.json({status : 0, msg:'Something went wrong'});	
// 						}
// 			        }else{
// 			        	let updation = {
// 					        prev_day : 0,
// 				    		next_day : 0, 
// 					        last_claimed_date: "",
// 					        reward_start_date : "",
// 					  	};
// 					  	let dailyRewards = await userPoints.updateOne(userSearch, updation).exec();
// 						if(dailyRewards) {
// 							res.json({status : 1, msg:'Streak Status Restarted'});
// 						} else {
// 							res.json({status : 0, msg:'Something went wrong'});	
// 						}
// 			        }
// 				} else {
// 					let updation = {
// 				        prev_day : 0,
// 			    		next_day : 0, 
// 				        last_claimed_date: "",
// 				        reward_start_date : "",
// 				  	};
// 				  	let dailyRewards = await userPoints.updateOne(userSearch, updation).exec();
// 				  	console.log(dailyRewards)
// 					if(dailyRewards) {
// 						console.log(dailyRewards)
// 						res.json({status : 1, msg:'Streak Breaked'});
// 					} else {
// 						res.json({status : 0, msg:'Something went wrong'});	
// 					}
// 				}
// 			} else{
// 					let currentPoints = user.points || 0; 
// 		    	let newPoints = info.points || 0; 
// 		    	let totalPoints = currentPoints + newPoints;

// 				let project = {_id : 0};

// 				let userLevel = await level.aggregate([
//                     { '$match': { '$expr': { '$and': [{ '$gte': [totalPoints, '$points_from'] }, { '$lte': [totalPoints, '$points_upto'] }] } } },
//                     { '$project': { _id: 0 } }
//                 ]).exec();

//         if (userLevel.length > 0) {
//           let newLevel = userLevel[0];
// 				  let data = {};
          
//           if (previousLevel !== newLevel?.level_name) {        

// 				    let multi_tap = await multiTap.find({},project).exec();
// 						let energy_level = await energyLevel.find({},project).exec();
// 						data.level = newLevel?.level_name;
// 						// data.tap_energy_level = newLevel?.energy_level;
// 						// data.current_energy = newLevel?.energy_level;
// 						// data.tap_energy = newLevel?.tap_level;
// 						data.prev_day = info.prev_day;
// 						data.next_day = info.next_day;

// 						// if(user.tap_energy < newLevel?.tap_level ) {
// 							data.tap_energy = newLevel?.tap_level;
// 						// } else if(user.tap_energy >= newLevel?.tap_level){
// 						// 	data.tap_energy = user.tap_energy;
// 						// } else {
// 						// 	data.tap_energy = user.tap_energy + 1;
// 						// }

// 						// if(user.tap_energy_level < newLevel?.energy_level ) {
// 							data.tap_energy_level = newLevel?.energy_level;
// 							data.current_energy = newLevel?.energy_level;
// 						// } else if(user.tap_energy_level >= newLevel?.energy_level){
// 						// 	data.tap_energy_level = user.tap_energy_level;
// 						// 	data.current_energy = user.tap_energy_level;
// 						// }else {
// 						// 	data.tap_energy_level = user.tap_energy_level + 500;
// 						// 	data.current_energy = user.tap_energy_level + 500;
// 						// }

// 	          for (let i = 2; i <= user.multitap_level; i++) {
// 	            let matchedMultiTap = multi_tap.find(mt => mt.level === i);
// 	            if (matchedMultiTap) {
// 	              data.tap_energy += matchedMultiTap.tap_level; 
// 	            } else {
// 	              data.tap_energy += 1;  
// 	            }
// 	          }

// 	          for (let i = 2; i <= user.multienergy_level; i++) {
// 	            let matchedEnergyLevel = energy_level.find(el => el.level === i);
// 	            if (matchedEnergyLevel) {
// 	              data.tap_energy_level += matchedEnergyLevel.energy_level; 
// 	              data.current_energy += matchedEnergyLevel.energy_level; 
// 	            } else {
// 	              data.tap_energy_level += 500;  
// 	              data.current_energy += 500;  
// 	            }
// 	          }

// 		    		await updateSkin(user, userLevel[0]);
// 					}			
// 						console.log("reward_start_date",user.reward_start_date);
// 						console.log("last_claimed_date",user.last_claimed_date);

// 						if(!user.reward_start_date && !user.last_claimed_date){
// 					    let updation = {
// 					        ...data, 
// 					        reward_start_date: currentDate,
// 					        last_claimed_date: currentDate,
// 					        points: totalPoints
// 					    };

// 					    let dailyRewards = await userPoints.updateOne(userSearch, updation).exec();
// 							if(dailyRewards) {
// 								res.json({status : 1, msg:'Daily Rewards Credited for Day 1', reward : 1});
// 							} else {
// 								res.json({status : 0, msg:'Something went wrong'});	
// 							}
// 						} else{
// 						    let updation = {
// 						        ...data, 
// 						        last_claimed_date: currentDate,
// 						        points: totalPoints
// 						    };
// 						    let dailyRewards = await userPoints.updateOne(userSearch, updation).exec();
// 							if(dailyRewards) {
// 								res.json({status : 1, msg:'Daily Rewards Credited' , reward : 1});
// 							} else {
// 								res.json({status : 0, msg:'Something went wrong'});	
// 							}
// 						}
// 				}
// 			}	
// 		} else {
// 				res.json({status : 0, msg:'User Not Exists'});	
// 		}
// 	} catch(error) {
// 		console.log("Error Updating Daily Rewards",error);
// 		res.json({status:0, msg:error.message});
// 	}
// });



// router.post('/updateDailyRewards', common.originMiddle, async (req, res) => {
//     try {
//         let info = req.body;
//         console.log(req.body);
//         let currentDate = new Date();

//         let userSearch = { $and: [{ chatId: info.chatId }] };

//         let user = await userPoints.findOne(userSearch).exec();
//         let levels = await level.find({}).exec();

//         if (user) {
//             let previousLevel = user.level;

//             // Check for claim status
//             if (info.claim === 1) {
//                 console.log("called");

//                 // If it's the first claim (both dates are null)
//                 if (user.reward_start_date === null && user.last_claimed_date === null) {
//                     let updation = {
//                         prev_day: 0,
//                         next_day: 0,
//                         last_claimed_date: currentDate,
//                         reward_start_date: currentDate,
//                     };

//                     // Add points to user
//                     let pointsToAdd = info.points || 0; // Assuming points are sent in the request body
//                     let totalPoints = user.points + pointsToAdd; // Update total points

//                     // Update user points and daily rewards
//                     updation.points = totalPoints; // Update points in the user document

//                     let dailyRewards = await userPoints.updateOne(userSearch, updation).exec();
//                     if (dailyRewards) {
//                         // Update user's points in the userPoints collection
//                         await userPoints.updateOne(userSearch, { $set: { points: totalPoints } }).exec();
//                         res.json({ status: 1, msg: 'Streak Started with claim', reward: 1 });
//                     } else {
//                         res.json({ status: 0, msg: 'Something went wrong' });
//                     }
//                 } else {
//                     // If they have claimed before, reset to start a new streak
//                     let updation = {
//                         prev_day: 0,
//                         next_day: 0,
//                         last_claimed_date: currentDate,
//                         reward_start_date: currentDate,
//                     };

//                     // Add points to user
//                     let pointsToAdd = info.points || 0; // Assuming points are sent in the request body
//                     let totalPoints = user.points + pointsToAdd; // Update total points

//                     // Update user points and daily rewards
//                     updation.points = totalPoints; // Update points in the user document

//                     let dailyRewards = await userPoints.updateOne(userSearch, updation).exec();
//                     if (dailyRewards) {
//                         // Update user's points in the userPoints collection
//                         await userPoints.updateOne(userSearch, { $set: { points: totalPoints } }).exec();
//                         res.json({ status: 1, msg: 'Streak Restarted due to claim', reward: 1 });
//                     } else {
//                         res.json({ status: 0, msg: 'Something went wrong' });
//                     }
//                 }
//             } 
//             // Check streak status logic
//             if (info.checkStatus) {
//                 const lastClaimedDate = new Date(user.last_claimed_date);
//                 const startOfToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);
//                 const endOfToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59, 999);
//                 const startOfYesterday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1, 0, 0, 0);
//                 const endOfYesterday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1, 23, 59, 59, 999);

//                 if (lastClaimedDate >= startOfToday && lastClaimedDate <= endOfToday) {
//                     res.json({ status: 1, msg: 'Come back Tomorrow' });
//                 } else if (lastClaimedDate >= startOfYesterday && lastClaimedDate <= endOfYesterday) {
//                     let reward_start_date = new Date(user.reward_start_date);
//                     const dateOnly1 = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
//                     const dateOnly2 = new Date(reward_start_date.getFullYear(), reward_start_date.getMonth(), reward_start_date.getDate());

//                     const diffInMilliseconds = dateOnly1 - dateOnly2;
//                     const diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);
//                     let project = { _id: 0, created_at: 0, updated_at: 0 };

//                     let dailyRewardCount = await dailyReward.aggregate([{ $project: { NumberOfItems: { $size: "$rewards" } } }]).exec();
//                     dailyRewardCount = dailyRewardCount[0].NumberOfItems;

//                     if (diffInDays != dailyRewardCount) {
//                         let updation = {
//                             prev_day: diffInDays,
//                         };
//                         let dailyRewards = await userPoints.updateOne(userSearch, updation).exec();
//                         if (dailyRewards) {
//                             res.json({ status: 1, msg: 'Streak Status Updated' });
//                         } else {
//                             res.json({ status: 0, msg: 'Something went wrong' });
//                         }
//                     } else {
//                         // If claim is 1, handle as before
//                         if (info.claim === 1) {
//                             if (user.reward_start_date === null && user.last_claimed_date === null) {
//                                 let updation = {
//                                     prev_day: 0,
//                                     next_day: 0,
//                                     last_claimed_date: currentDate,
//                                     reward_start_date: currentDate,
//                                 };

//                                 let pointsToAdd = info.points || 0;
//                                 let totalPoints = user.points + pointsToAdd;
//                                 updation.points = totalPoints; 

//                                 let dailyRewards = await userPoints.updateOne(userSearch, updation).exec();
//                                 if (dailyRewards) {
//                                     await userPoints.updateOne(userSearch, { $set: { points: totalPoints } }).exec();
//                                     res.json({ status: 1, msg: 'Streak Started with claim', reward: 1 });
//                                 } else {
//                                     res.json({ status: 0, msg: 'Something went wrong' });
//                                 }
//                             } else {
//                                 let updation = {
//                                     prev_day: 0,
//                                     next_day: 0,
//                                     last_claimed_date: currentDate,
//                                     reward_start_date: currentDate,
//                                 };

//                                 let pointsToAdd = info.points || 0;
//                                 let totalPoints = user.points + pointsToAdd;
//                                 updation.points = totalPoints; 

//                                 let dailyRewards = await userPoints.updateOne(userSearch, updation).exec();
//                                 if (dailyRewards) {
//                                     await userPoints.updateOne(userSearch, { $set: { points: totalPoints } }).exec();
//                                     res.json({ status: 1, msg: 'Streak Restarted due to claim', reward: 1 });
//                                 } else {
//                                     res.json({ status: 0, msg: 'Something went wrong' });
//                                 }
//                             }
//                         } else {
//                             let updation = {
//                                 prev_day: 0,
//                                 next_day: 0,
//                                 last_claimed_date: "",
//                                 reward_start_date: "",
//                             };
//                             let dailyRewards = await userPoints.updateOne(userSearch, updation).exec();
//                             if (dailyRewards) {
//                                 res.json({ status: 1, msg: 'Streak Validated' });
//                             } else {
//                                 res.json({ status: 0, msg: 'Something went wrong' });
//                             }
//                         }
//                     }
//                 } else {
//                     console.log("recieved")
//                     if (info.claim === 1) {
//                         let updation = {
//                             prev_day: 0,
//                             next_day: 0,
//                             last_claimed_date: currentDate,
//                             reward_start_date: currentDate,
//                         };

//                         let pointsToAdd = info.points || 0;
//                         let totalPoints = user.points + pointsToAdd;
//                         updation.points = totalPoints; 

//                         let dailyRewards = await userPoints.updateOne(userSearch, updation).exec();
//                         if (dailyRewards) {
//                             await userPoints.updateOne(userSearch, { $set: { points: totalPoints } }).exec();
//                             res.json({ status: 1, msg: 'Streak Restarted due to claim', reward: 1 });
//                         } else {
//                             res.json({ status: 0, msg: 'Something went wrong' });
//                         }
//                     } else {
//                         let updation = {
//                             prev_day: 0,
//                             next_day: 0,
//                             last_claimed_date: "",
//                             reward_start_date: "",
//                         };
//                         let dailyRewards = await userPoints.updateOne(userSearch, updation).exec();
//                         if (dailyRewards) {
//                             res.json({ status: 1, msg: 'Streak Broken' });
//                         } else {
//                             res.json({ status: 0, msg: 'Something went wrong' });
//                         }
//                     }
//                 }
//             } else {
//                 // Points credited when the claim status is not checked
//                 let currentPoints = user.points || 0;
//                 let newPoints = info.points || 0;
//                 let totalPoints = currentPoints + newPoints;

//                 let project = { _id: 0 };

//                 let userLevel = await level.aggregate([
//                     { '$match': { '$expr': { '$and': [{ '$gte': [totalPoints, '$points_from'] }, { '$lte': [totalPoints, '$points_upto'] }] } } },
//                     { '$project': { _id: 0 } }
//                 ]).exec();

//                 if (userLevel.length > 0) {
//                     let newLevel = userLevel[0];
//                     if (previousLevel !== newLevel?.level_name) {
//                         let multi_tap = await multiTap.find({}, project).exec();
//                         let energy_level = await energyLevel.find({}, project).exec();
//                         let data = {};
//                         data.level = newLevel?.level_name;

//                         data.prev_day = info.prev_day;
//                         data.next_day = info.next_day;

//                         data.tap_energy = newLevel?.tap_level;
//                         data.tap_energy_level = newLevel?.energy_level;
//                         data.current_energy = newLevel?.energy_level;

//                         for (let i = 2; i <= user.multitap_level; i++) {
//                             let matchedMultiTap = multi_tap.find(mt => mt.level === i);
//                             if (matchedMultiTap) {
//                                 data.tap_energy += matchedMultiTap.tap_level;
//                             } else {
//                                 data.tap_energy += 1;
//                             }
//                         }

//                         for (let i = 2; i <= user.multienergy_level; i++) {
//                             let matchedEnergyLevel = energy_level.find(el => el.level === i);
//                             if (matchedEnergyLevel) {
//                                 data.tap_energy_level += matchedEnergyLevel.energy_level;
//                                 data.current_energy += matchedEnergyLevel.energy_level;
//                             } else {
//                                 data.tap_energy_level += 500;
//                                 data.current_energy += 500;
//                             }
//                         }

//                         await updateSkin(user, userLevel[0]);

//                         if (!user.reward_start_date && !user.last_claimed_date) {
//                             let updation = {
//                                 ...data,
//                                 reward_start_date: currentDate,
//                                 last_claimed_date: currentDate,
//                                 points: totalPoints // Set the total points here
//                             };

//                             let dailyRewards = await userPoints.updateOne(userSearch, updation).exec();
//                             if (dailyRewards) {
//                                 await userPoints.updateOne(userSearch, { $set: { points: totalPoints } }).exec();
//                                 res.json({ status: 1, msg: 'Daily Rewards Credited for Day 1', reward: 1 });
//                             } else {
//                                 res.json({ status: 0, msg: 'Something went wrong' });
//                             }
//                         } else {
//                             let updation = {
//                                 ...data,
//                                 last_claimed_date: currentDate,
//                                 points: totalPoints // Set the total points here
//                             };
//                             let dailyRewards = await userPoints.updateOne(userSearch, updation).exec();
//                             if (dailyRewards) {
//                                 await userPoints.updateOne(userSearch, { $set: { points: totalPoints } }).exec();
//                                 res.json({ status: 1, msg: 'Daily Rewards Credited', reward: 1 });
//                             } else {
//                                 res.json({ status: 0, msg: 'Something went wrong' });
//                             }
//                         }
//                     }
//                 }
//             }
//         } else {
//             res.json({ status: 0, msg: 'User Not Exists' });
//         }
//     } catch (err) {
//         console.log(err);
//         res.status(500).json({ status: 0, msg: 'Server Error' });
//     }
// });


router.post('/updateSts', common.originMiddle, async (req, res) => {
  try {
    const { chatId, username } = req.body;

    const user = await miniGame.findOne({ chatId }).exec();

    if (!user) {
      return res.json({ success: 0, msg: 'User not found' });
    }

    user.game_status = 0;
    await user.save(); 

    res.json({ success: 1, msg: 'Game status updated successfully' });
  } catch (err) {
    console.error("Error Updating Game Status", err);
    res.json({ success: 0, msg: err.message });
  }
});


router.post('/bonus', async (req, res) => {
  const { chatId, username, bonusPoint } = req.body;

  if (!chatId || !username || !bonusPoint) {
    return res.status(400).json({ status: 0, msg: "Invalid request data." });
  }

  try {
    let user = await userPoints.findOne({  chatId }).exec();

    if (!user) {
      return res.status(404).json({ status: 0, msg: "User not found." });
    }

    let previousLevel = user.level;

    let newPoints = user.points + bonusPoint;

	  let userLevel = await level.aggregate([
	      { '$match': { '$expr': { '$and': [{ '$gte': [newPoints, '$points_from'] }, { '$lte': [newPoints, '$points_upto'] }] } } },
	      { '$project': { _id: 0 } }
	  ]).exec();

	  let updateObject = {points : newPoints};
		if (userLevel.length > 0) {
			let project = {_id : 0};
			let multi_tap = await multiTap.find({},project).exec();
			let energy_level = await energyLevel.find({},project).exec();

		  let newLevel = userLevel[0];
		  if (previousLevel !== newLevel?.level_name) {
		    // if(user.tap_energy < newLevel?.tap_level ) {
					updateObject.tap_energy = newLevel?.tap_level;
				// } else if(user.tap_energy >= newLevel?.tap_level){
				// 	user.tap_energy = user.tap_energy;
				// } else {
				// 	user.tap_energy = user.tap_energy + 1;
				// }

				// if(user.tap_energy_level < newLevel?.energy_level ) {
					updateObject.tap_energy_level = newLevel?.energy_level;
					updateObject.current_energy = newLevel?.energy_level;
				// } else if(user.tap_energy_level >= newLevel?.energy_level){
				// 	user.tap_energy_level = user.tap_energy_level;
				// 	user.current_energy = user.tap_energy_level;
				// }else {
				// 	user.tap_energy_level = user.tap_energy_level + 500;
				// 	user.current_energy = user.tap_energy_level + 500;
				// }

		    for (let i = 2; i <= user.multitap_level; i++) {
		      let matchedMultiTap = multi_tap.find(mt => mt.level === i);
		      if (matchedMultiTap) {
		        updateObject.tap_energy += matchedMultiTap.tap_level; 
		      } else {
		        updateObject.tap_energy += 1;  
		      }
		    }

		    for (let i = 2; i <= user.multienergy_level; i++) {
		      let matchedEnergyLevel = energy_level.find(el => el.level === i);
		      if (matchedEnergyLevel) {
		        updateObject.tap_energy_level += matchedEnergyLevel.energy_level; 
		        updateObject.current_energy += matchedEnergyLevel.energy_level; 
		      } else {
		        updateObject.tap_energy_level += 500;  
		        updateObject.current_energy += 500;  
		      }
		    }

				await updateSkin(user, userLevel[0]);
		    updateObject.level = newLevel?.level_name;
		  }
		}

    let updateResult = await userPoints.updateOne(
      {  chatId },
      { $set: updateObject }
    ).exec();

    if (updateResult.modifiedCount > 0) {
      return res.json({ status: 1, msg: "Bonus points claimed successfully.", points: newPoints });
    } else {
      return res.status(500).json({ status: 0, msg: "Failed to claim bonus points." });
    }
  } catch (error) {
  	console.log("Error Updating The Reward",error);
    return res.status(500).json({ status: 0, msg: error.message });
  }
});


router.post('/updateComboSts', async (req, res) => {
    try {
        const { username, chatId } = req.body;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const user = await userPoints.findOne({ chatId: chatId });

        if (!user) {
            return res.json({ success: 0, msg: "User not found" });
        }

        if (user.combo_reward_date) {
            const rewardDate = new Date(user.combo_reward_date);
            rewardDate.setHours(0, 0, 0, 0);
            if (rewardDate.getTime() !== today.getTime()) {

                user.combo_rwd_sts = 0;
                user.selected_cards = [];
                user.combo_reward_date = null;

                await user.save();
                
                return res.json({ success: 1, msg: "Fields cleared due to date mismatch" });
            } else {
                return res.json({ success: 0, msg: "Reward status already updated today" });
            }
        } else {
            return res.json({ success: 0, msg: "No reward date found" });
        }

    } catch (error) {
        console.error("Error updating combo status!", error);
        res.json({ success: 0, msg: "Error updating status" });
    }
});


router.post("/getMiniGameSts", common.originMiddle, async (req, res) => {
  try {
    const info = req.body;
    let project = { _id: 0, chatId: 0, username: 0, created_at: 0, updated_at: 0 };
    let miniGames = await miniGame.findOne({ chatId: info.chatId }, project).exec();
    if (miniGames) {
      let existingDate = new Date(miniGames.game_start_time);
      let currDate = new Date();
      currDate = new Date(currDate.getFullYear(), currDate.getMonth(), currDate.getDate());
      existingDate = new Date(existingDate.getFullYear(), existingDate.getMonth(), existingDate.getDate());

      // Compare the time values of the dates
      if (currDate.getTime() !== existingDate.getTime()) {
        let updation = { game_start_time: "", game_end_time: "", game_status: 0 };
        let updateSts = await miniGame.updateOne({  chatId: info.chatId }, updation).exec();
        if (updateSts) {
          // Fetch the updated miniGames document
          let updatedMiniGames = await miniGame.findOne({  chatId: info.chatId }, project).exec();
          res.json({ status: 1, data: updatedMiniGames });
        } else {
          res.json({ status: 0, msg: "Something went wrong" });
        }
      } else {
        res.json({ status: 1, data: miniGames });
      }
    } else {
      res.json({ status: 0, msg: "Something went wrong" });
    }
  } catch (error) {
    console.error('Error getting mini game', error);
    res.json({ status: 0, msg: error.message });
  }
});


router.post('/getMiniGameData', common.originMiddle, async(req,res) => {
	try{
		let project = {_id : 0, created_at :0, exchangeAccount : 0, invite : 0, telegramAccount : 0, xAccount : 0};
		let reward = await rewards.findOne({}, project).exec();
		if(reward){
          res.json({ status: 1, data: reward });
		}else{
      		res.json({ status: 0, msg: "Something went wrong" });
		}
	} catch (error) {
    	console.error('Error getting rewards data', error);
    	res.json({ status: 0, msg: "Something Went Wrong" });
  }
})


router.post('/reward', async (req, res) => {
  const { reward, chatId, ref, refCount } = req.body.data;

  try {
    const user = await userPoints.findOne({ chatId }).exec();
    let referralReward = await manageRewards.findOne({}).exec();

    if (!referralReward) {
      return res.status(404).json({ status: 0, msg: 'Referral reward not found' });
    }

    let invites = referralReward.invite;
    if (user) {
    	const previousLevel = user.level; 

      const referredCount = await userPoints.countDocuments({ refferer_id: ref }).exec();
      let rewardAdded = false;

	    for (let i = 0; i < invites.length; i++) {
	  		const invite = invites[i];
	        if (refCount == invite.referCount && referredCount >= invite.referCount) {
	        	if (user.claim_status >= i + 1) {
	            	return res.status(200).json({ status: 0, msg: 'Reward already credited for this referral count' });
	        	}

          	user.points += invite.points;
          	user.claim_status = i + 1;

          	let userLevel = await level.aggregate([
                  { '$match': { '$expr': { '$and': [{ '$gte': [user.points, '$points_from'] }, { '$lte': [user.points, '$points_upto'] }] } } },
                  { '$project': { _id: 0 } }
              ]).exec();

            if (userLevel.length > 0) {
							let project = {_id : 0};
			    		let multi_tap = await multiTap.find({},project).exec();
							let energy_level = await energyLevel.find({},project).exec();

              let newLevel = userLevel[0];
              if (previousLevel !== newLevel?.level_name) {
                // if(user.tap_energy < newLevel?.tap_level ) {
									user.tap_energy = newLevel?.tap_level;
								// } else if(user.tap_energy >= newLevel?.tap_level){
								// 	user.tap_energy = user.tap_energy;
								// } else {
								// 	user.tap_energy = user.tap_energy + 1;
								// }

								// if(user.tap_energy_level < newLevel?.energy_level ) {
									user.tap_energy_level = newLevel?.energy_level;
									user.current_energy = newLevel?.energy_level;
								// } else if(user.tap_energy_level >= newLevel?.energy_level){
								// 	user.tap_energy_level = user.tap_energy_level;
								// 	user.current_energy = user.tap_energy_level;
								// }else {
								// 	user.tap_energy_level = user.tap_energy_level + 500;
								// 	user.current_energy = user.tap_energy_level + 500;
								// }

			          for (let i = 2; i <= user.multitap_level; i++) {
			            let matchedMultiTap = multi_tap.find(mt => mt.level === i);
			            if (matchedMultiTap) {
			              user.tap_energy += matchedMultiTap.tap_level; 
			            } else {
			              user.tap_energy += 1;  
			            }
			          }

			          for (let i = 2; i <= user.multienergy_level; i++) {
			            let matchedEnergyLevel = energy_level.find(el => el.level === i);
			            if (matchedEnergyLevel) {
			              user.tap_energy_level += matchedEnergyLevel.energy_level; 
			              user.current_energy += matchedEnergyLevel.energy_level; 
			            } else {
			              user.tap_energy_level += 500;  
			              user.current_energy += 500;  
			            }
			          }

    						await updateSkin(user, userLevel[0]);
                user.level = newLevel?.level_name;
              }
            }

        		await user.save();
        		rewardAdded = true;
        		return res.status(200).json({ status: 1, msg: 'Reward added successfully', user });
	      	}
	    	}

      	if(!rewardAdded){
      	    return res.json({ status: 0, msg: 'You have not invited enough friend yet!' });
      	}      
    } else {
      return res.json({ status: 0, msg: 'User not found' });
    }
  } catch (error) {
    console.error('Error rewarding user:', error);
    return res.status(500).json({ status: 0, msg: 'Server error' });
  }
});


router.post('/updateOrGetUserSkin', common.originMiddle, async (req,res) => {
	try{
    let info = req.body;
    	let skinProject = { _id: 0, chatId: 0, username: 0, created_at: 0 };
    	let userProject = { _id: 0, points : 1, username : 1, chatId : 1, level : 1 };
			if(info.chatId && info.username){
				let existingUserSkin = await userSkins.findOne({chatId : info.chatId},skinProject).exec();

				let userData = await userPoints.findOne({ chatId : info.chatId},userProject).exec();
 				let userLevel = await level.aggregate([{'$match': {'$expr': {'$and': [ { '$gte': [userData.points, '$points_from'] }, { '$lte': [userData.points, '$points_upto']}]}}}, { '$project': { _id: 0 } }]).exec();
				// await updateSkin(userData, userLevel[0]);
 				let newLevel = userLevel[0];
				    let userLevelName = await level.find({}, { image_name: 1, formatted_name :1, _id: 0 });

		    let user_skins = await userSkins.aggregate([
		        {
		            $match: {
		                chatId: userData.chatId,
		            }
		        },
		        {
		            $project: {
		                user_skins: {
		                    $filter: {
		                        input: "$user_skins",
		                        as: "skin",
		                        cond: {
		                            $and: [
		                                { $eq: ["$$skin.is_selected", 1] },
		                                { $eq: ["$$skin.is_acquired", 1] }
		                            ]
		                        }
		                    }
		                }
		            }
		        }
		    ]).exec();

		    let matchFound = user_skins[0].user_skins.some(skin =>
		        userLevelName.some(level => level.formatted_name === skin.name)
		    );

		    let currentUserSkin = user_skins[0].user_skins[0]?.name;

		    let prevLevel = convertTitle(userData.level);
		    let newLevelImageName = newLevel?.image_name.toLowerCase();
		    let newLevelName = newLevel?.formatted_name;

		    let updateQuery ;
		    let updateData ;

		    let condCheck = currentUserSkin != prevLevel;
		    if(matchFound ){
		    	if(condCheck){
			    	updateQuery = {
			        username: userData.username,
			        chatId: userData.chatId,
			        "user_skins.name": currentUserSkin
			    	};

			    	updateData = {
			    		$set : {
		            "user_skins.$.image": newLevelImageName,
		            "user_skins.$.name": newLevelName,
		            "user_skins.$.is_selected": 1,
		            "user_skins.$.is_acquired": 1 
			    		}
			    	}

			    	let updatedSkin = await userSkins.findOneAndUpdate(updateQuery, updateData, { new: true }).exec();
			    	if(updatedSkin){
			    		return res.json({status : 1, msg : "Wrong Skin Level Updated to Valid Skin"});
			    	}else{
			    		return res.json({status : 0, msg : "Error Updating to Valid Skin"});
			    	}
		    	}else{
			    	return res.json({status : 0, msg : "Already in the Valid Skin"});
		    	}
		    }else{

		    	let userSkinData = await userSkins.findOne(
		    	{	chatId: userData.chatId,},
		        {user_skins : 1, _id : 0}
		      ).exec();

		    	let nonValidSkin = userSkinData?.user_skins.find(skin => 
	    			userLevelName.find(level => level.formatted_name === skin.name)
	    		)

		    	let nonValidSkinName = nonValidSkin?.name;

		    	let condCheck = nonValidSkinName != prevLevel;
		    	if(condCheck){
		    		updateQuery = {
			        username: userData.username,
			        chatId: userData.chatId,
			        "user_skins.name": nonValidSkinName
			    	};

			    	updateData = {
			    		$set : {
		            "user_skins.$.image": newLevelImageName,
		            "user_skins.$.name": newLevelName,
		            "user_skins.$.is_selected": 0,
		            "user_skins.$.is_acquired": 1 
			    		}
			    	}

			    let updatedSkin = await userSkins.findOneAndUpdate(updateQuery, updateData, { new: true }).exec();
			    	if(updatedSkin){
			    		return res.json({status : 1, msg : "Wrong Skin Level Updated to Valid Non Active Skin"});
			    	}else{
			    		return res.json({status : 0, msg : "Error Updating to Valid Non Active Skin"});
			    	}
		    	}else{
			    	return res.json({status : 0, msg : "Already in the Valid Skin"});
		    	}
		    }
			} else{
				return res.json({status : 0, msg: "Please provide Chat ID and User Name"});
			}
	} catch(error) {
		console.log("Error Updating the user Skin",error);
		res.json({status:0, msg:error.message});
	}
});


function convertTitle(input) {
  return input.replace(/\s+/g, '').toLowerCase();
}


module.exports = router;
