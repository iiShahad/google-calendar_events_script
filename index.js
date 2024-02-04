import dotenv from "dotenv";
import express from "express";
import { google } from "googleapis";
import dayjs from "dayjs";

const app = express();

const port = process.env.PORT || 8000;

dotenv.config();

const oauth2client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const scopes = ["https://www.googleapis.com/auth/calendar"];

app.get("/google", (req, res) => {
  const url = oauth2client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });
  res.redirect(url);
});

app.get("/google/redirect", async (req, res) => {
  const token = req.query.code;
  const { tokens } = await oauth2client.getToken(token);
  oauth2client.setCredentials(tokens);

  res.send("yay");
});

app.get("/events", async (req, res) => {
  const calendar = google.calendar({ version: "v3", auth: oauth2client });

  await calendar.events.insert({
    conferenceDataVersion: 1,
    calendarId: "primary",
    requestBody: {
      summary: "Test Event",
      description: "This is a test event",
      start: {
        dateTime: dayjs().add(1, "day").toISOString(),
        timeZone: "Asia/Riyadh",
      },
      end: {
        dateTime: dayjs().add(1, "day").add(2, "hour").toISOString(),
        timeZone: "Asia/Riyadh",
      },
      conferenceData: {
        createRequest: {
          requestId: `meeting-${Date.now()}-${1}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      attendees: [],
      reminders: {
        useDefault: true,
      },
    },
  });

  res.send("Event created");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
