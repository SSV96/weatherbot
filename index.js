const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const { user } = require("./models/user");
const mongoose = require("mongoose");
const TelegramBot = require("node-telegram-bot-api");
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHER_API_KEY;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {});

app.use(express.json());
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  let uuser = await user.findOne({ chatId });
  console.log(uuser || "USER NOT FOUND");
  if (!uuser) {
    const newUser = new user({
      username: msg.chat.username,
      chatId: msg.chat.id,
    });
    uuser = await newUser.save();
  }
  console.log(uuser);
  if (uuser) {
    bot.sendMessage(
      chatId,
      `Hello! ${uuser.username}  This bot can show you the weather and time for any city. To use it, please choose an option below:`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Get Weather", callback_data: "get_weather" }],
            [{ text: "Get Time", callback_data: "get_time" }],
          ],
        },
      }
    );
  } else {
  }
});

bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const uuser = await user.findOne({ chatId });

  switch (data) {
    case "get_weather":
      if (uuser.city === null) {
        bot.sendMessage(
          chatId,
          "Please enter the name of the city or send /stop to cancel:"
        );
      }
      console.log("\n", uuser);
      const weather = await getWeatherData(uuser.city);

      console.log("\n ----------------------------------------", weather);
      bot.sendMessage(chatId, `${weather}`);
      break;
    case "get_time":
      // const userDataTime = getUserData(chatId);
      // userDataTime.waitingForCity = true;
      // userDataTime.waitingForTime = true;
      bot.sendMessage(
        chatId,
        "Please enter the name of the city or send /stop to cancel:"
      );
      break;
    default:
      break;
  }
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const name = msg.chat.first_name;
  await user.updateOne({ chatId }, { $set: { city: text } });
  bot.sendMessage(chatId, `City Updated please choose an option below:`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Get Weather", callback_data: "get_weather" }],
        [{ text: "Get Time", callback_data: "get_time" }],
      ],
    },
  });
});

bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "You have stopped the current operation.");
  resetUserData(chatId);
});

async function getWeatherData(city) {
  // https://api.openweathermap.org/data/2.5/weather?q={city name}&appid={API key}
  const response = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHERMAP_API_KEY}`
  );
  const weatherData = response.data;
  // console.log(weatherData);
  const temperature = Math.round(weatherData.main.temp - 273.15);
  const messageText = `The weather in ${city} is currently ${weatherData.weather[0].description} with a temperature of ${temperature}°C.`;
  return messageText;
}

async function getTimeData(city) {
  const response = await axios.get(
    `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHERMAP_API_KEY}`
  );
  const timezone = response.data.timezone;
  const time = moment()
    .utcOffset(timezone / 60)
    .format("h:mm A");
  const messageText = `The current time in ${city} is ${time}.`;
  return messageText;
}

function resetUserData(chatId) {
  const userData = getUserData(chatId);
  userData.waitingForCity = false;
  userData.waitingForWeather = false;
  userData.waitingForTime = false;
}
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
