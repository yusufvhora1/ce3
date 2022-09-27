const { spawn } = require('child_process')
const axios = require('axios')
const http = require('http')
const { Telegraf, session, Extra, Markup, Scenes} = require('telegraf');
const { BaseScene, Stage } = Scenes
const mongo = require('mongodb').MongoClient;
const {enter, leave} = Stage
const stage = new Stage();
const Web3 = require('web3');
var bodyParser = require('body-parser');
const Scene = BaseScene
const data = require('./data');
const { lutimes } = require('fs');
const { response } = require('express');

const privKey = data.pkey
 const addressFrom = data.pkeyadd
 

const  bot = new Telegraf(data.bot_token)
mongo.connect(data.mongoLink, {useUnifiedTopology: true}, (err, client) => {
  if (err) {
    console.log(err)
  }

  db = client.db(data.bot_name)
  bot.telegram.deleteWebhook().then(success => {
  success && console.log('Bot Is Started')
  bot.launch()
})
})

bot.use(session())
bot.use(stage.middleware())

const onCheck = new Scene('onCheck')
stage.register(onCheck)

const getWallet= new Scene('getWallet')
stage.register(getWallet)

const getMsg = new Scene('getMsg')
stage.register(getMsg)

const onWithdraw = new Scene('onWithdraw')
stage.register(onWithdraw)

const channels = data.channelsList
const admin = data.bot_admin
const bot_cur = "CELO"
const min_wd = data.min_wd
const ref_bonus = data.reffer_bonus
const daily_bonus = data.daily_bonus

const botStart = async (ctx) => {
try {

if(ctx.message.chat.type != 'private'){
  return
  }
   let dbData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()
 let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()

let q1 = rndInt(1,20)
let q2 = rndInt(1,20)
let ans = q1+q2
  
  if(bData.length===0){
  if(ctx.startPayload && ctx.startPayload != ctx.from.id){
let ref = ctx.startPayload * 1
  db.collection('pendUsers').insertOne({userId: ctx.from.id, inviter: ref})}else{
db.collection('pendUsers').insertOne({userId: ctx.from.id})
}
  
  db.collection('allUsers').insertOne({userId: ctx.from.id, virgin: true, paid: false })
   db.collection('balance').insertOne({userId: ctx.from.id, balance:0,withdraw:0})
  db.collection('checkUsers').insertOne({userId: ctx.from.id, answer:ans})
 await  ctx.replyWithMarkdown('➡️*Hi, before you start the bot, please prove you are human by answering the question below.*\nPlease answer: '+q1+' + '+q2+' =\n*Send your answer now*',  { reply_markup: { keyboard: [['⚪️ Try Again']], resize_keyboard: true } })
 ctx.scene.enter('onCheck')
 }else{
  let joinCheck = await findUser(ctx)
  if(joinCheck){
  let pData = await db.collection('pendUsers').find({userId: ctx.from.id}).toArray()
       if(('inviter' in pData[0]) && !('referred' in dbData[0])){
   let bal = await db.collection('balance').find({userId: pData[0].inviter}).toArray()

 var cal = bal[0].balance*1
 var sen = ref_bonus*1
 var see = cal+sen

   bot.telegram.sendMessage(pData[0].inviter, '*🧞‍♂ User - '+ctx.from.first_name+' has joined the bot from your referral link!\n➕ You have been rewarded - '+ref_bonus+' '+bot_cur+'*', {parse_mode:'markdown'})
    db.collection('allUsers').updateOne({userId: ctx.from.id}, {$set: {inviter: pData[0].inviter, referred: 'surenaa'}}, {upsert: true})
     db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true})
    db.collection('balance').updateOne({userId: pData[0].inviter}, {$set: {balance: see}}, {upsert: true})
ctx.replyWithMarkdown(
    '*✔️ Dashboard*',
    { reply_markup: { keyboard: [['💳 Balance'],['👫 Referral', '🎰 Bonus', 'Withdraw 💵'], ['📊 Stat', '🏧 Wallet']], resize_keyboard: true }})
      
      }else{
      db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true}) 

 
ctx.replyWithMarkdown(
    '*✔️ Dashboard*',
    { reply_markup: { keyboard: [['💳 Balance'],['👫 Referral', '🎰 Bonus', 'Withdraw 💵'], ['📊 Stat', '🏧 Wallet']], resize_keyboard: true }})
    }
      }else{
  mustJoin(ctx)
  }}


} catch(e){
sendError(e, ctx)
}
}

bot.start(botStart)

bot.hears(['⬅️ Back','🔙 back'], botStart)

bot.hears('⚪️ Try Again', async (ctx) => {
try {
let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()
 
if(bData.length===0){

let q1 = rndInt(1,20)
let q2 = rndInt(1,20)
let ans = q1+q2
db.collection('checkUsers').updateOne({userId: ctx.from.id}, {$set: {answer: ans}}, {upsert: true})
  
await ctx.replyWithMarkdown('➡️*Hi, before you start the bot, please prove you are human by answering the question below.*\nPlease answer: '+q1+' + '+q2+' =\nSend your answer now',  { reply_markup: { keyboard: [['⚪️ Try Again']], resize_keyboard: true } })
ctx.scene.enter('onCheck')
}else{
starter(ctx)
return
}

  } catch (err) {
    sendError(err, ctx)
  }
})

onCheck.hears(['⚪️ Try Again','/start'], async (ctx) => {
 try {
 
let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()
 
if(bData.length===0){
ctx.scene.leave('onCheck')


let q1 = rndInt(1,20)
let q2 = rndInt(1,20)
let ans = q1+q2
db.collection('checkUsers').updateOne({userId: ctx.from.id}, {$set: {answer: ans}}, {upsert: true})
  
await ctx.replyWithMarkdown('➡️*Hi, before you start the bot, please prove you are human by answering the question below.*\nPlease answer: '+q1+' + '+q2+' =\nSend your answer now',  { reply_markup: { keyboard: [['⚪️ Try Again']], resize_keyboard: true } })
ctx.scene.enter('onCheck')
}else{
return
}
 } catch (err) {
    sendError(err, ctx)
  }
})  

onCheck.on('text', async (ctx) => {
 try {
 let dbData = await db.collection('checkUsers').find({userId: ctx.from.id}).toArray()
 let bData = await db.collection('pendUsers').find({userId: ctx.from.id}).toArray()
 let dData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()
 let ans = dbData[0].answer*1
 
 
  if(ctx.from.last_name){
 valid = ctx.from.first_name+' '+ctx.from.last_name
 }else{
 valid = ctx.from.first_name
 }
 
 if(!isNumeric(ctx.message.text)){
 ctx.replyWithMarkdown('😑 _I thought you were smarter than this, try again_ ')
 }else{
if(ctx.message.text==ans){
 db.collection('vUsers').insertOne({userId: ctx.from.id, answer:ans,name:valid})
 ctx.deleteMessage()
 
 ctx.scene.leave('onCheck')
 let joinCheck = await findUser(ctx)
  if(joinCheck){
  let pData = await db.collection('pendUsers').find({userId: ctx.from.id}).toArray()
       if(('inviter' in pData[0]) && !('referred' in dData[0])){
   let bal = await db.collection('balance').find({userId: pData[0].inviter}).toArray()

 var cal = bal[0].balance*1
 var sen = ref_bonus*1
 var see = cal+sen

   bot.telegram.sendMessage(pData[0].inviter, '*🧞‍♂ User - '+ctx.from.first_name+' has joined the bot from your referral link!\n➕ You have been rewarded - '+ref_bonus+' '+bot_cur+'*', {parse_mode:'markdown'})
    db.collection('allUsers').updateOne({userId: ctx.from.id}, {$set: {inviter: pData[0].inviter, referred: 'surenaa'}}, {upsert: true})
     db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true})
    db.collection('balance').updateOne({userId: pData[0].inviter}, {$set: {balance: see}}, {upsert: true})
ctx.replyWithMarkdown(
    '*✔️ Dashboard*',
    { reply_markup: { keyboard: [['💳 Balance'],['👫 Referral', '🎰 Bonus', 'Withdraw 💵'], ['📊 Stat', '🏧 Wallet']], resize_keyboard: true }})
      
      }else{
      db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true}) 

 
ctx.replyWithMarkdown(
    '*✔️ Dashboard*',
    { reply_markup: { keyboard: [['💳 Balance'],['👫 Referral', '🎰 Bonus', 'Withdraw 💵'], ['📊 Stat', '🏧 Wallet']], resize_keyboard: true }})
    }
  }else{
  mustJoin(ctx)
  }}else{
 ctx.replyWithMarkdown('😑 _I thought you were smarter than this, ⚪️ Try Again to get another question_')
 }}
 } catch (err) {
    sendError(err, ctx)
  }
})  

bot.hears('👫 Referral', async (ctx) => {
try {
if(ctx.message.chat.type != 'private'){
  return
  }
  
  let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()
 
if(bData.length===0){
return}

let allRefs = await db.collection('allUsers').find({inviter: ctx.from.id}).toArray() // all invited users
ctx.reply(
'<b>🎉 Welcome To Referral Section!!!!</b>\n------------------------------------------------\n<b>🌟 User:-</b> <a href="tg://user?id='+ctx.from.id+'">'+ctx.from.first_name+'</a>\n<b>⛅️ Refer Link:-</b> <b>https://t.me/'+data.bot_name+'?start=' + ctx.from.id +'</b>\n------------------------------------------------\n<b>✔️ Get</b> <b>'+ref_bonus+' '+bot_cur+' For Every Referral.</b>',  {parse_mode: 'html'})
} catch (err) {
    sendError(err, ctx)
  }
})

bot.command('broadcast', (ctx) => {
if(ctx.from.id==admin){
ctx.scene.enter('getMsg')}
})

getMsg.enter((ctx) => {
  ctx.replyWithMarkdown(
    ' *Okay Admin 👮‍♂, Send your broadcast message*', 
    { reply_markup: { keyboard: [['⬅️ Back']], resize_keyboard: true } }
  )
})

getMsg.leave((ctx) => starter(ctx))

getMsg.hears('⬅️ Back', (ctx) => {ctx.scene.leave('getMsg')})

getMsg.on('text', (ctx) => {
ctx.scene.leave('getMsg')

let postMessage = ctx.message.text
if(postMessage.length>3000){
return ctx.reply('Type in the message you want to sent to your subscribers. It may not exceed 3000 characters.')
}else{
globalBroadCast(ctx,admin)
}
})

async function globalBroadCast(ctx,userId){
let perRound = 10000;
let totalBroadCast = 0;
let totalFail = 0;

let postMessage =ctx.message.text

let totalUsers = await db.collection('allUsers').find({}).toArray()

let noOfTotalUsers = totalUsers.length;
let lastUser = noOfTotalUsers - 1;

 for (let i = 0; i <= lastUser; i++) {
 setTimeout(function() {
      sendMessageToUser(userId, totalUsers[i].userId, postMessage, (i === lastUser), totalFail, totalUsers.length);
    }, (i * perRound));
  }
  return ctx.reply('Your message is queued and will be posted to all of your subscribers soon. Your total subscribers: '+noOfTotalUsers)
}

function sendMessageToUser(publisherId, subscriberId, message, last, totalFail, totalUser) {
  bot.telegram.sendMessage(subscriberId, message,{parse_mode:'html'}).catch((e) => {
if(e == 'Forbidden: bot was block by the user'){
totalFail++
}
})
let totalSent = totalUser - totalFail

  if (last) {
    bot.telegram.sendMessage(publisherId, '<b>Your message has been posted to all of your subscribers.</b>\n\n<b>Total User:</b> '+totalUser+'\n<b>Total Sent:</b> '+totalSent+'\n<b>Total Failed:</b> '+totalFail, {parse_mode:'html'});
  }
}

bot.hears('📊 Stat', async (ctx) => {
try {
if(ctx.message.chat.type != 'private'){
  return
  }
  
  let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()
 
if(bData.length===0){
return}
  
  let time;
time = new Date();
time = time.toLocaleString();

bot.telegram.sendChatAction(ctx.from.id,'typing').catch((err) => sendError(err, ctx))
let dbData = await db.collection('vUsers').find({stat:"stat"}).toArray()
let dData = await db.collection('vUsers').find({}).toArray()

if(dbData.length===0){
db.collection('vUsers').insertOne({stat:"stat", value:0})
ctx.replyWithMarkdown(
'😎 *Total members:* `'+dData.length+'`\n😇 *Total Payout:* `0.00000000 '+bot_cur+'`\n🧭 *Server Time:* `'+time+'`')
return
}else{
let val = dbData[0].value*1
ctx.replyWithMarkdown(
'📊 *Total Members*:- *'+dData.length+' User*\n*👥 Refer Bonus*:- *'+ref_bonus+'* *'+bot_cur+'*\n*🎁 Daily Bonus:- '+daily_bonus+' '+bot_cur+'*\n⛔️* Minimum Withdrawal:- '+min_wd+' '+bot_cur+'*\n📤 *Total Payout:-* *'+val.toFixed(4)+' '+bot_cur+'*\n⏰ *Server Time:-* *'+time+'*')
}}
  catch (err) {
    sendError(err, ctx)
  }
})

bot.hears('🎰 Bonus', async (ctx) => {
try {

if(ctx.message.chat.type != 'private'){
  return
  }
  
  let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()
 
if(bData.length===0){
return}

var duration_in_hours;

var tin = new Date().toISOString();
let dData = await db.collection('bonusforUsers').find({userId: ctx.from.id}).toArray()

if(dData.length===0){
db.collection('bonusforUsers').insertOne({userId: ctx.from.id, bonus: new Date()})
duration_in_hours = 99;
}else{
 duration_in_hours = ((new Date()) - new Date(dData[0].bonus))/1000/60/60;
}



if(duration_in_hours>=24){

let bal = await db.collection('balance').find({userId: ctx.from.id}).toArray()


let ran = daily_bonus
let rann = ran*1
var adm = bal[0].balance*1
var addo = adm+rann

db.collection('balance').updateOne({userId: ctx.from.id}, {$set: {balance: addo}}, {upsert: true})

db.collection('bonusforUsers').updateOne({userId: ctx.from.id}, {$set: {bonus: tin}}, {upsert: true})

ctx.replyWithMarkdown('*✅ You Received '+daily_bonus+' '+bot_cur+' As Daily Bonus*').catch((err) => sendError(err, ctx))
}else{
var duration_in_hour= Math.abs(duration_in_hours - 24);
var hours= Math.floor(duration_in_hour);
var minutes = Math.floor((duration_in_hour - hours)*60);
var seconds = Math.floor(((duration_in_hour - hours)*60-minutes)*60);
ctx.replyWithMarkdown('*⛔️ You Already Recieved Bonus In Last 24 Hours*').catch((err) => sendError(err, ctx))

}
}  catch (err) {
    sendError(err, ctx)
  }
})


bot.hears('💳 Balance', async (ctx) => {
try {
if(ctx.message.chat.type != 'private'){
  return
  }
  var valid;
 
 if(ctx.from.last_name){
 valid = ctx.from.first_name+' '+ctx.from.last_name
 }else{
 valid = ctx.from.first_name
 }
  
  let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()
 
if(bData.length===0){
return}
 
  
let notPaid = await db.collection('allUsers').find({inviter: ctx.from.id, paid: false}).toArray() // only not paid invited users
    let allRefs = await db.collection('allUsers').find({inviter: ctx.from.id}).toArray() // all invited users
    let thisUsersData = await db.collection('balance').find({userId: ctx.from.id}).toArray()
    let sum
    sum = thisUsersData[0].balance

   /* if (thisUsersData[0].virgin) {
      sum = notPaid.length * 0.00001000
    } else {
      sum = notPaid.length * 0.00001000
    }*/
    let sup
    let query = min_wd*200
    if(sum > query ){
    sup = sum/100
    db.collection('balance').updateOne({userId: ctx.from.id}, {$set: {balance: sup}}, {upsert: true})
    } else {
sup = sum*1
}
    ctx.reply('👤 *User:- '+ctx.from.first_name+'*\n\n🧰 *Balance:- '+sum.toFixed(4)+' '+bot_cur+'*',{parse_mode:'markdown'})
} catch (err) {
    sendError(err, ctx)
  }
})

const web3 = new Web3("https://forno.celo.org/");

bot.hears('🏧 Wallet', async (ctx) => {
try {
if(ctx.message.chat.type != 'private'){
  return
  }
  let dbData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()

    if ('coinmail' in dbData[0]) {
    ctx.replyWithMarkdown('💡 *Your '+bot_cur+' Wallet is:* `'+ dbData[0].coinmail +'`',
   Markup.inlineKeyboard([
      [Markup.button.callback('💼 Set or Change '+data.currency+' Wallet', 'iamsetemail')]
      ])
      )  
       .catch((err) => sendError(err, ctx))
    }else{
ctx.replyWithMarkdown('💡 *Your '+bot_cur+' Wallet is:* _not set_', 
    Markup.inlineKeyboard([
      [Markup.button.callback('💼 Set or Change '+data.currency+' Wallet', 'iamsetemail')]
      ])
      ) 
           .catch((err) => sendError(err, ctx))
    }
} catch (err) {
    sendError(err, ctx)
  }
  
})

bot.action('iamsetemail', async (ctx) => {
  try {
  ctx.deleteMessage();
    ctx.replyWithMarkdown(
      '✏️ *Send your '+bot_cur+'* Wallet Address to use it in future withdrawals!',{ reply_markup: { keyboard: [['🔙 back']], resize_keyboard: true }})
        .catch((err) => sendError(err, ctx))
        ctx.scene.enter('getWallet')
  } catch (err) {
    sendError(err, ctx)
  }
})

getWallet.hears('🔙 back', (ctx) => {
  starter(ctx)
  ctx.scene.leave('getWallet')
})

getWallet.on('text', async(ctx) => {
try {
let msg = ctx.message.text
if(msg == '/start'){
ctx.scene.leave('getWallet')
starter(ctx)
}

 let email_test = /[a-zA-Z0-9]/
 if(email_test.test(msg)){
 let check = await db.collection('allEmails').find({email:ctx.message.text}).toArray() // only not paid invited users
if(check.length===0){
ctx.replyWithMarkdown(
'🖊* Done:* Your '+bot_cur+' Wallet Has Been Saved as\n`'+ctx.message.text+'`',
{ reply_markup: { keyboard: [['🔙 back']], resize_keyboard: true } }
  )  
   .catch((err) => sendError(err, ctx))
   db.collection('allUsers').updateOne({userId: ctx.from.id}, {$set: {coinmail: ctx.message.text}}, {upsert: true})
   db.collection('allEmails').insertOne({email:ctx.message.text,user:ctx.from.id}) 
}else{
ctx.reply('Seems This '+bot_cur+' Wallet have been used in bot before by another user! Try Again')
}
}else{
 ctx.reply('🖊 Error: This is not a valid '+bot_cur+' Wallet Send /start to return to the menu, or send a correct one')
 }
} catch (err) {
    sendError(err, ctx)
  }
})

bot.hears('✔️ Check ✔️', async (ctx) => {
try {
let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()
 
if(bData.length===0){
return}

if(ctx.message.chat.type != 'private'){
  ctx.leaveChat()
  return
  }
let pData = await db.collection('pendUsers').find({userId: ctx.from.id}).toArray()

let dData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()

  let joinCheck = await findUser(ctx)
  if(joinCheck){
       if(('inviter' in pData[0]) && !('referred' in dData[0])){
   let bal = await db.collection('balance').find({userId: pData[0].inviter}).toArray()

 var cal = bal[0].balance*1
 var sen = ref_bonus*1
 var see = cal+sen

   bot.telegram.sendMessage(pData[0].inviter, '*🧞‍♂ User - '+ctx.from.first_name+' has joined the bot from your referral link!\n➕ You have been rewarded - '+ref_bonus+' '+bot_cur+'*', {parse_mode:'markdown'})
    db.collection('allUsers').updateOne({userId: ctx.from.id}, {$set: {inviter: pData[0].inviter, referred: 'surenaa'}}, {upsert: true})
     db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true})
    db.collection('balance').updateOne({userId: pData[0].inviter}, {$set: {balance: see}}, {upsert: true})
ctx.replyWithMarkdown(
    '*✔️ Dashboard*',
    { reply_markup: { keyboard: [['💳 Balance'],['👫 Referral', '🎰 Bonus', 'Withdraw 💵'], ['📊 Stat', '🏧 Wallet']], resize_keyboard: true }})
      
      }else{
      db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true}) 

 
ctx.replyWithMarkdown(
    '*✔️ Dashboard*',
    { reply_markup: { keyboard: [['💳 Balance'],['👫 Referral', '🎰 Bonus', 'Withdraw 💵'], ['📊 Stat', '🏧 Wallet']], resize_keyboard: true }})
    }
  }else{
  mustJoin(ctx)
  }
} catch (err) {
    sendError(err, ctx)
  }
  
})

bot.hears('Withdraw 💵', async (ctx) => {
try {
if(ctx.message.chat.type != 'private'){
  return
  }
  
  
let tgData = await bot.telegram.getChatMember(data.payment_channel, ctx.from.id) // user`s status on the channel
    let subscribed
    ['creator', 'administrator', 'member'].includes(tgData.status) ? subscribed = true : subscribed = false
if(subscribed){

let bData = await db.collection('balance').find({userId: ctx.from.id}).toArray().catch((err) => sendError(err, ctx))

let bal = bData[0].balance

let dbData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()

    if ('coinmail' in dbData[0]) {
if(bal>=min_wd){
var post="*🩸 Send the amount you want to withdraw*\n\n    *Minimum:* `"+min_wd.toFixed(4)+"` "+bot_cur+"\n    *Maximum:* `"+bal.toFixed(4)+"` "+bot_cur+"\n    _Maximum amount corresponds to your balance_\n\n    ☑️* Send now the amount of you want to withdraw*"

ctx.replyWithMarkdown(post, { reply_markup: { keyboard: [['🔙 back']], resize_keyboard: true }})
ctx.scene.enter('onWithdraw')
}else{
ctx.replyWithMarkdown("❌ *You have to own at least "+min_wd.toFixed(4)+" "+bot_cur+" in your balance to withdraw!*")
}
    }else{
    ctx.replyWithMarkdown('💡 *Your '+bot_cur+' wallet addres:* `not set`', 
    Markup.inlineKeyboard([
      [Markup.button.callback('💼 Set or Change Your '+data.currency+' Wallet', 'iamsetemail')]
      ])
      ) 
           .catch((err) => sendError(err, ctx))
    
}

}else{
mustJoin(ctx)
}

} catch (err) {
    sendError(err, ctx)
  }
})

onWithdraw.hears('🔙 back', (ctx) => {
  starter(ctx)
  ctx.scene.leave('onWithdraw')
})

onWithdraw.on('text', async (ctx) => {
try {
var valid,time
time = new Date();
time = time.toLocaleString();
 
 if(ctx.from.last_name){
 valid = ctx.from.first_name+' '+ctx.from.last_name
 }else{
 valid = ctx.from.first_name
 }
 
 const msg = ctx.message.text*1
 if(!isNumeric(ctx.message.text)){
 ctx.replyWithMarkdown("❌ _Send a value that is numeric or a number_")
 ctx.scene.leave('onWithdraw')
 return
 }
 let dbData = await db.collection('balance').find({userId: ctx.from.id}).toArray().catch((err) => sendError(err, ctx))
 
 let aData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()

 
 let bData = await db.collection('withdrawal').find({userId: ctx.from.id}).toArray()
 let dData = await db.collection('vUsers').find({stat: 'stat'}).toArray()
let vv = dData[0].value*1

 let ann = msg*1
 let bal = dbData[0].balance*1
let wd = dbData[0].withdraw
let rem = bal-ann
let ass = wd+ann
let sta = vv+ann
const wallet = aData[0].coinmail
if((msg>bal) | ( msg<min_wd)){
ctx.replyWithMarkdown("😐 Send a value over *"+min_wd.toFixed(3)+" "+bot_cur+"* but not greater than *"+bal.toFixed(3)+" "+bot_cur+"* ")
return
 }
 
 if (bal >= min_wd && msg >= min_wd && msg <= bal) {
      
db.collection('balance').updateOne({userId: ctx.from.id}, {$set: {balance: rem, withdraw: ass}}, {upsert: true})
db.collection('vUsers').updateOne({stat: 'stat'}, {$set: {value: sta}}, {upsert: true})


console.log(
  `Attempting to make transaction from ${addressFrom} to ${wallet}`
);

const createTransaction = await web3.eth.accounts.signTransaction(
  {
     from: addressFrom,
     to: wallet,
     value: web3.utils.toWei(`${msg}`, 'ether'),
     gas: '21000',
  },
  privKey
);

// Deploy transaction
const createReceipt = await web3.eth.sendSignedTransaction(
  createTransaction.rawTransaction
);
console.log(
  `Transaction successful with hash: ${createReceipt.transactionHash}`
)
     
ctx.replyWithHTML('<code>$'+bot_cur+' Wɪᴛʜᴅʀᴀᴡᴀʟ Pʀᴏᴄᴄᴇᴅᴇᴅ!!!!</code>\n<code>Amount --> '+msg+' '+bot_cur+'</code>\n<code>Payment Status --> </code><b><a href="https://explorer.gochain.io/tx/'+createReceipt.transactionHash+'">Successfully Paid✓</a></b>')
bot.telegram.sendMessage(data.payment_channel,
'<code>New $'+bot_cur+' Withdrawal Paid!!!!</code>\n<code>User --> </code><b><a href="tg://user?id='+ctx.from.id+'">'+ctx.from.first_name+'</a></b>\n<code>Amount --> '+msg+' '+bot_cur+'</code>\n<code>Payment Status --> </code><b><a href="https://explorer.gochain.io/tx/'+createReceipt.transactionHash+'">Successfully Paid✓</a></b>',{parse_mode: 'html',disable_web_page_preview:true , reply_markup: { inline_keyboard:[[{ text: "✓ Join "+bot_cur+" Airdrop Now!", url: "https://t.me/"+data.bot_name+"?start="+ctx.from.id+"" }]]}})

  
 

  .catch(error => {
    console.error(error)
    ctx.replyWithMarkdown('The Bot Has Encountred An problem While Complating Your Withdraw Request\nYour Problem Is Sended AUtomatically To Bot Admin Youll Recieve Your Withdraw In 24 hours')
  })
  
  
}else{
 ctx.replyWithMarkdown("😐 Send a value over *"+min_wd+" "+bot_cur+"* but not greater than *"+bal.toFixed(8)+" "+bot_cur+"* ")
ctx.scene.leave('onWithdraw')
return
 }

} catch (err) {
    sendError(err, ctx)
  }
})



function rndFloat(min, max){
  return (Math.random() * (max - min + 1)) + min
}
function rndInt(min, max){
  return Math.floor(rndFloat(min, max))
}
  
function mustJoin(ctx){
  let msg = '<b>✨ Subscribe Our Channels</b>\n-------------------------------------------<b>'
  for(var ind in channels){
  var cha = channels[ind]
  msg+='\n---> '+cha
  }
  msg+='</b>\n-------------------------------------------\n<b>--> Payout:- '+data.payment_channel+'</b>\n-------------------------------------------\n🔵 <b>Before Using This Bot!</b>'
  ctx.replyWithHTML(msg, {
   reply_markup:{
   keyboard: [['✔️ Check ✔️']],disable_web_page_preview : true,
   resize_keyboard: true
   
  }
  })
  }
 


function starter (ctx) {
 ctx.replyWithMarkdown(
    '*✔️ Dashboard*',
    { reply_markup: { keyboard: [['💳 Balance'],['👫 Referral', '🎰 Bonus', 'Withdraw 💵'], ['📊 Stat', '🏧 Wallet']], resize_keyboard: true }})

   }

function sendError (err, ctx) {
  ctx.reply('An Error Happened ☹️: '+err.message)
 bot.telegram.sendMessage(admin, `Error From [${ctx.from.first_name}](tg://user?id=${ctx.from.id}) \n\nError: ${err}`, { parse_mode: 'markdown' })
}


function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

async function findUser(ctx){
let isInChannel= true;
let cha = data.channelscheck
for (let i = 0; i < cha.length; i++) {
const chat = cha[i];
let tgData = await bot.telegram.getChatMember(chat, ctx.from.id)
  
  const sub = ['creator','adminstrator','member'].includes(tgData.status)
  if (!sub) {
    isInChannel = false;
    break;
  }
}
return isInChannel
}

/*

var findUser = (ctx) => {
var user = {user: ctx.from.id }
channels.every(isUser, user)
}


var isUser = (chat) => {
console.log(this)
console.log(chat)
/*l

let sub = 

return sub == true;
}
*/

