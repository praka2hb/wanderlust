import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AuthenticatedRequest, authenticateToken } from "./middleware";
import { upload } from "./multer";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
const prisma = new PrismaClient();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://your-frontend.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

// Explicitly handle OPTIONS for all routes
app.options("*", cors());

// Register route
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
     res.status(400).json({ message: "Invalid Input" });
     return
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "secret");
    res.json({
      message: "User Created Successfully",
      token,
      id: user.id,
    });
  } catch (e) {
    res.status(400).json({ message: "Unable to Create User" });
  }
});

// Login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
     res.status(400).json({ message: "Invalid Input" });
     return
  }
  try {
    const user = await prisma.user.findFirst({
      where: { email },
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
       res.status(401).json({ message: "Incorrect Credentials" });
       return
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "secret");
    res.json({
      message: "Login Successful",
      token,
    });
  } catch (e) {
    res.status(400).json({ message: "Unable to login" });
  }
});

// Get users route
app.get("/get-users", authenticateToken, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
     res.status(401).json({ message: "Unauthorized" });
     return
  }
  const { id } = req.user as JwtPayload;
  const user = await prisma.user.findFirst({ where: { id } });
  res.json({
    message: "Access Granted",
    user,
  });
});

// Add travel story route
app.post("/add-travelstory", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
  const { id } = req.user as JwtPayload;
  if (!title || !story || !visitedLocation || !visitedDate || !imageUrl) {
     res.status(400).json({ message: "All Fields Are Required" });
     return
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
    res.json({
      message: "Travel Story Created Successfully",
      story: travelstory,
    });
  } catch (e) {
    res.status(400).json({ message: "Unable to Create Travel Story" });
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
    res.json({ travelStories });
  } catch (e) {
    res.status(500).json({ message: "Unable to Fetch the Stories" });
  }
});

// Image upload route (modified for Vercel)
app.post("/image-upload", upload.single("image"), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
       res.status(400).json({ message: "No File Uploaded" });
       return
    }
    // Use /tmp for Vercel
    const imageUrl = `/tmp/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (e) {
    res.status(400).json({ message: "Unable to Upload Image" });
  }
});

// Delete image route (modified for Vercel)
app.delete("/delete-image", async (req, res) => {
  try {
    const { imageUrl } = req.query;
    if (!imageUrl) {
       res.status(400).json({ message: "Invalid Input" });
       return
    }
    const filename = path.basename(imageUrl as string);
    const filepath = path.join("/tmp/uploads", filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.status(200).json({ message: "Image Deleted Successfully" });
    } else {
      res.status(404).json({ message: "Image Not Found" });
    }
  } catch (e) {
    res.status(400).json({ message: "Unable to Delete Image" });
  }
});

// Serve static files (modified for Vercel)
app.use("/uploads", express.static("/tmp/uploads"));

// Edit story route
app.put("/edit-story/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
  const { id: userId } = req.user as JwtPayload;
  if (!title || !story || !visitedLocation || !visitedDate || !imageUrl) {
     res.status(400).json({ message: "All Fields Are Required" });
     return
  }
  const parseVisitedDate = new Date(parseInt(visitedDate));
  const defaultImageUrl = "https://your-vercel-domain.vercel.app/assets/wanderlust.jpeg";
  try {
    const travelstory = await prisma.story.findFirst({
      where: { id, authorId: userId },
    });
    if (!travelstory) {
       res.status(404).json({ message: "Travel Story Not Found" });
       return
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
    res.json({
      message: "Travel Story Updated Successfully",
      story: updateStory,
    });
  } catch (e) {
    res.status(400).json({ message: "Unable to Update Travel Story" });
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
       res.status(404).json({ message: "Travel Story Not Found" });
       return
    }
    await prisma.story.delete({ where: { id } });
    res.json({ message: "Travel Story Deleted Successfully" });
  } catch (e) {
    res.status(400).json({ message: "Unable to Delete Travel Story" });
  }
});

// Favourite story route
app.put("/favourite-story/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { isFavourite } = req.body;
  try {
    const story = await prisma.story.findUnique({ where: { id } });
    if (!story) {
       res.status(404).json({ message: "Story not found" });
       return
    }
    const updatedStory = await prisma.story.update({
      where: { id },
      data: { isFavourite },
    });
    res.json({
      message: "Story favourite status updated successfully",
      story: updatedStory,
    });
  } catch (e) {
    res.status(500).json({ message: "Unable to update story favourite status" });
  }
});

// Search route
app.get("/search", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { query } = req.query;
  const { id: userId } = req.user as JwtPayload;
  if (!query) {
     res.status(400).json({ message: "Query is Required" });
     return
  }
  try {
    const travelStories = await prisma.story.findMany({
      where: {
        authorId: userId,
        OR: [
          { title: { contains: query as string, mode: "insensitive" } },
          { story: { contains: query as string, mode: "insensitive" } },
          { visitedLocation: { has: query as string } },
        ],
      },
      orderBy: { isFavourite: "desc" },
    });
    if (travelStories.length === 0) {
       res.status(200).json({ message: "No Stories Found" });
       return
    }
    res.json({ travelStories });
  } catch (e) {
    res.status(400).json({ message: "Unable to Search" });
  }
});

// Remove app.listen and export for Vercel
export default app;