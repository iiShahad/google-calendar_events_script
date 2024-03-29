import dotenv from "dotenv";
import express from "express";
import { google } from "googleapis";
import fs from "fs";
import moment from "moment-timezone";

//server configuration
const app = express();
const port = process.env.PORT || 8000;
dotenv.config();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Google API configuration
const scopes = ["https://www.googleapis.com/auth/calendar"];
const oauth2client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Function to insert event in google calendar
const insertEvent = async (data) => {
  const calendar = google.calendar({ version: "v3", auth: oauth2client });
  const startTime = moment.tz(
    `${data["start_date"]} ${data["start_time"]}}`,
    "DD MMM YYYY HH:mm:ss",
    "Asia/Riyadh"
  );
  const endTime = moment.tz(
    `${data["end_date"]} ${data["end_time"]}}`,
    "DD MMM YYYY HH:mm:ss",
    "Asia/Riyadh"
  );

  const result = await calendar.events.insert({
    conferenceDataVersion: 1,
    calendarId: "primary",
    sendUpdates: "all",
    requestBody: {
      summary: data["title"],
      description: data["description"],
      start: {
        dateTime: startTime.toISOString(),
        timeZone: "Asia/Riyadh",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "Asia/Riyadh",
      },
      conferenceData: {
        createRequest: {
          requestId: `meeting-${Date.now()}-${data["id"]}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      attendees: data["attendees"].map((val) => {
        return { email: val };
      }),

      reminders: {
        useDefault: true,
      },
    },
  });
  return result.data;
};

// middlewares
app.get("/login", (req, res) => {
  const url = oauth2client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });
  res.redirect(url);
});

app.get("/login/redirect", async (req, res) => {
  const token = req.query.code;
  const { tokens } = await oauth2client.getToken(token);
  oauth2client.setCredentials(tokens);

  res.redirect("/events");
});

app.get("/events", async (req, res) => {
  try {
    fs.readFile("./data.json", "utf-8", (err, data) => {
      if (err) {
        res.send("cant read file");
        return;
      }
      // Parse the JSON data
      const dataArray = JSON.parse(data);
      dataArray.forEach(async (element) => {
        const result = await insertEvent(element);
      });
    });
    res.send("Events created");
  } catch (err) {
    res.send(err.message);
  }
});
