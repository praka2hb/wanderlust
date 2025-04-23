import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AuthenticatedRequest, authenticateToken } from "./middleware";
import { upload } from "./multer";
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import cors from "cors";
import logger from "./logger";
import { z } from "zod";

const app = express();
const prisma = new PrismaClient();

// Initialize Google Drive API
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS!),
  scopes: ["https://www.googleapis.com/auth/drive.file"],
});
const drive = google.drive({ version: "v3", auth });

app.use(
  cors({
    origin: ["http://localhost:5173", "https://your-frontend.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.options("*", cors());

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const storySchema = z.object({
  title: z.string().min(1),
  story: z.string().min(1),
  visitedLocation: z.string().min(1),
  imageUrl: z.string().url(),
  visitedDate: z.string().transform((val: string) => new Date(parseInt(val))),
});

// Register route
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    logger.warn("Invalid register input", { email });
    res.status(400).json({ message: "Invalid Input" });
    return;
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, username, password: hashedPassword },
    });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "secret");
    logger.info("User registered", { email, userId: user.id });
    res.json({ message: "User Created Successfully", token, id: user.id });
  } catch (e) {
    logger.error("Register error", { error: e, email });
    res.status(400).json({ message: "Unable to Create User" });
    return;
  }
});

// Login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    logger.warn("Invalid login input", { email });
    res.status(400).json({ message: "Invalid Input" });
    return;
  }
  try {
    const parsed = loginSchema.parse(req.body);
    const user = await prisma.user.findFirst({
      where: { email: parsed.email },
      select: { id: true, password: true },
    });
    if (!user || !(await bcrypt.compare(parsed.password, user.password))) {
      logger.warn("Incorrect login credentials", { email });
      res.status(401).json({ message: "Incorrect Credentials" });
      return;
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "secret");
    logger.info("Login successful", { email, userId: user.id });
    res.json({ message: "Login Successful", token });
  } catch (e) {
    logger.error("Login error", { error: e, email: req.body.email });
    res.status(400).json({ message: e instanceof z.ZodError ? "Invalid Input" : "Internal Server Error" });
    return;
  }
});

// Get users route
app.get("/get-users", authenticateToken, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    logger.warn("Unauthorized access to get-users");
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const { id } = req.user as JwtPayload;
  try {
    const user = await prisma.user.findFirst({ where: { id } });
    logger.info("User fetched", { userId: id });
    res.json({ message: "Access Granted", user });
  } catch (e) {
    logger.error("Get users error", { error: e });
    res.status(500).json({ message: "Unable to Fetch User" });
    return;
  }
});

// Add travel story route
app.post("/add-travelstory", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
  const { id } = req.user as JwtPayload;
  if (!title || !story || !visitedLocation || !visitedDate || !imageUrl) {
    logger.warn("Missing travel story fields", { userId: id });
    res.status(400).json({ message: "All Fields Are Required" });
    return;
  }
  const parseVisitedDate = new Date(parseInt(visitedDate));
  try {
    const travelstory = await prisma.story.create({
      data: {
        author: { connect: { id } },
        title,
        story,
        visitedDate: parseVisitedDate,
        visitedLocation,
        imageUrl,
      },
    });
    logger.info("Travel story created", { storyId: travelstory.id, userId: id });
    res.json({ message: "Travel Story Created Successfully", story: travelstory });
  } catch (e) {
    logger.error("Add travel story error", { error: e });
    res.status(400).json({ message: "Unable to Create Travel Story" });
    return;
  }
});

// Get all stories route
app.get("/get-allstory", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const travelStories = await prisma.story.findMany({
      include: {
        author: {
          select: { id: true, username: true },
        },
      },
      orderBy: { isFavourite: "desc" },
    });
    logger.info("Fetched all stories", { count: travelStories.length });
    res.json({ travelStories });
  } catch (e) {
    logger.error("Get all stories error", { error: e });
    res.status(500).json({ message: "Unable to Fetch the Stories" });
    return;
  }
});

// Image upload route (modified for Vercel)
app.post("/image-upload", upload.single("image"), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      logger.warn("No file uploaded");
      res.status(400).json({ message: "No File Uploaded" });
      return;
    }

    // upload to Drive
    const { data: createData } = await drive.files.create({
      requestBody: {
        name: req.file.filename,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
      },
      media: {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(req.file.path),
      },
      fields: "id",
    });

    // make it public
    await drive.permissions.create({
      fileId: createData.id!,
      requestBody: { role: "reader", type: "anyone" },
    });

    // fetch the direct download link
    const { data: fileData } = await drive.files.get({
      fileId: createData.id!,
      fields: "id, webContentLink",
    });
    if (!fileData.webContentLink) {
      throw new Error("Missing webContentLink");
    }

    const directImageUrl = fileData.webContentLink;
    logger.info("Image uploaded to Google Drive", { fileId: createData.id, imageUrl: directImageUrl });

    fs.unlinkSync(req.file.path);
    res.json({ imageUrl: directImageUrl });

  } catch (e) {
    logger.error("Image upload error", { error: e });
    res.status(500).json({ message: "Unable to Upload Image" });
  }
});


// …after your /image-upload handler, before the error‐handler…
app.get('/image/:fileId', authenticateToken, async (req, res) => {
  const { fileId } = req.params;
  try {
    // stream the raw file bytes from Drive
    const driveRes = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );
    // forward content type if present
    if (driveRes.headers['content-type']) {
      res.setHeader('Content-Type', driveRes.headers['content-type']);
    }
    driveRes.data.pipe(res);
  } catch (e) {
    logger.error('Image proxy error', { error: e, fileId });
    res.status(500).json({ message: 'Unable to fetch image' });
  }
});

// Edit story route
app.put("/edit-story/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
  const { id: userId } = req.user as JwtPayload;
  if (!title || !story || !visitedLocation || !visitedDate || !imageUrl) {
    logger.warn("Missing edit story fields", { storyId: id, userId });
    res.status(400).json({ message: "All Fields Are Required" });
    return;
  }
  const parseVisitedDate = new Date(parseInt(visitedDate));
  const defaultImageUrl = "https://wanderlust-vert-nu.vercel.app/assets/wanderlust.jpeg";
  try {
    const travelstory = await prisma.story.findFirst({
      where: { id, authorId: userId },
    });
    if (!travelstory) {
      logger.warn("Travel story not found", { storyId: id, userId });
      res.status(404).json({ message: "Travel Story Not Found" });
      return;
    }
    const updateStory = await prisma.story.update({
      where: { id },
      data: {
        title,
        story,
        visitedDate: parseVisitedDate,
        visitedLocation,
        imageUrl: imageUrl || defaultImageUrl,
      },
    });
    logger.info("Travel story updated", { storyId: id, userId });
    res.json({ message: "Travel Story Updated Successfully", story: updateStory });
  } catch (e) {
    logger.error("Edit story error", { error: e });
    res.status(400).json({ message: e instanceof z.ZodError ? "Invalid Input" : "Unable to Update Travel Story" });
    return;
  }
});

// Delete story route
app.delete("/delete-story/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { id: userId } = req.user as JwtPayload;
  try {
    const travelstory = await prisma.story.findFirst({
      where: { id, authorId: userId },
    });
    if (!travelstory) {
      logger.warn("Travel story not found", { storyId: id, userId });
      res.status(404).json({ message: "Travel Story Not Found" });
      return;
    }
    await prisma.story.delete({ where: { id } });
    logger.info("Travel story deleted", { storyId: id, userId });
    res.json({ message: "Travel Story Deleted Successfully" });
  } catch (e) {
    logger.error("Delete story error", { error: e });
    res.status(400).json({ message: "Unable to Delete Travel Story" });
    return;
  }
});

// Favourite story route
app.put("/favourite-story/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { isFavourite } = z.object({ isFavourite: z.boolean() }).parse(req.body);
  try {
    const story = await prisma.story.findUnique({ where: { id } });
    if (!story) {
      logger.warn("Story not found", { storyId: id });
      res.status(404).json({ message: "Story not found" });
      return;
    }
    const updatedStory = await prisma.story.update({
      where: { id },
      data: { isFavourite },
    });
    logger.info("Story favourite status updated", { storyId: id });
    res.json({ message: "Story favourite status updated successfully", story: updatedStory });
  } catch (e) {
    logger.error("Favourite story error", { error: e });
    res.status(500).json({ message: "Unable to update story favourite status" });
    return;
  }
});

// Search route
app.get("/search", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { query } = z.object({ query: z.string().min(1) }).parse(req.query);
  const { id: userId } = req.user as JwtPayload;
  if (!query) {
    logger.warn("Search query missing", { userId });
    res.status(400).json({ message: "Query is Required" });
    return;
  }
  try {
    const travelStories = await prisma.story.findMany({
      where: {
        authorId: userId,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { story: { contains: query, mode: "insensitive" } },
          { visitedLocation: { has:query } },
        ],
      },
      orderBy: { isFavourite: "desc" },
    });
    logger.info("Search executed", { query, userId, count: travelStories.length });
    if (travelStories.length === 0) {
      res.status(200).json({ message: "No Stories Found" });
      return;
    }
    res.json({ travelStories });
  } catch (e) {
    logger.error("Search error", { error: e });
    res.status(400).json({ message: e instanceof z.ZodError ? "Invalid Query" : "Unable to Search" });
    return;
  }
});

app.use((err: Error, req: Request, res: Response, next: Function) => {
  logger.error("Unhandled error", { error: err, path: req.path });
  res.status(500).json({ message: "Internal Server Error" });
  return;
});

export default app;