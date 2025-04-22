"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const middleware_1 = require("./middleware");
const multer_1 = require("./multer");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
app.use((0, cors_1.default)({
    origin: ["http://localhost:5173", "https://your-frontend.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
app.use(express_1.default.json());
// Explicitly handle OPTIONS for all routes
app.options("*", (0, cors_1.default)());
// Register route
app.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        res.status(400).json({ message: "Invalid Input" });
        return;
    }
    try {
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const user = yield prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
            },
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET || "secret");
        res.json({
            message: "User Created Successfully",
            token,
            id: user.id,
        });
    }
    catch (e) {
        res.status(400).json({ message: "Unable to Create User" });
    }
}));
// Login route
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ message: "Invalid Input" });
        return;
    }
    try {
        const user = yield prisma.user.findFirst({
            where: { email },
        });
        if (!user || !(yield bcrypt_1.default.compare(password, user.password))) {
            res.status(401).json({ message: "Incorrect Credentials" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET || "secret");
        res.json({
            message: "Login Successful",
            token,
        });
    }
    catch (e) {
        res.status(400).json({ message: "Unable to login" });
    }
}));
// Get users route
app.get("/get-users", middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const { id } = req.user;
    const user = yield prisma.user.findFirst({ where: { id } });
    res.json({
        message: "Access Granted",
        user,
    });
}));
// Add travel story route
app.post("/add-travelstory", middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
    const { id } = req.user;
    if (!title || !story || !visitedLocation || !visitedDate || !imageUrl) {
        res.status(400).json({ message: "All Fields Are Required" });
        return;
    }
    const parseVisitedDate = new Date(parseInt(visitedDate));
    try {
        const travelstory = yield prisma.story.create({
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
    }
    catch (e) {
        res.status(400).json({ message: "Unable to Create Travel Story" });
    }
}));
// Get all stories route
app.get("/get-allstory", middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const travelStories = yield prisma.story.findMany({
            include: {
                author: {
                    select: { id: true, username: true },
                },
            },
            orderBy: { isFavourite: "desc" },
        });
        res.json({ travelStories });
    }
    catch (e) {
        res.status(500).json({ message: "Unable to Fetch the Stories" });
    }
}));
// Image upload route (modified for Vercel)
app.post("/image-upload", multer_1.upload.single("image"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ message: "No File Uploaded" });
            return;
        }
        // Use /tmp for Vercel
        const imageUrl = `/tmp/uploads/${req.file.filename}`;
        res.json({ imageUrl });
    }
    catch (e) {
        res.status(400).json({ message: "Unable to Upload Image" });
    }
}));
// Delete image route (modified for Vercel)
app.delete("/delete-image", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { imageUrl } = req.query;
        if (!imageUrl) {
            res.status(400).json({ message: "Invalid Input" });
            return;
        }
        const filename = path_1.default.basename(imageUrl);
        const filepath = path_1.default.join("/tmp/uploads", filename);
        if (fs_1.default.existsSync(filepath)) {
            fs_1.default.unlinkSync(filepath);
            res.status(200).json({ message: "Image Deleted Successfully" });
        }
        else {
            res.status(404).json({ message: "Image Not Found" });
        }
    }
    catch (e) {
        res.status(400).json({ message: "Unable to Delete Image" });
    }
}));
// Serve static files (modified for Vercel)
app.use("/uploads", express_1.default.static("/tmp/uploads"));
// Edit story route
app.put("/edit-story/:id", middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
    const { id: userId } = req.user;
    if (!title || !story || !visitedLocation || !visitedDate || !imageUrl) {
        res.status(400).json({ message: "All Fields Are Required" });
        return;
    }
    const parseVisitedDate = new Date(parseInt(visitedDate));
    const defaultImageUrl = "https://your-vercel-domain.vercel.app/assets/wanderlust.jpeg";
    try {
        const travelstory = yield prisma.story.findFirst({
            where: { id, authorId: userId },
        });
        if (!travelstory) {
            res.status(404).json({ message: "Travel Story Not Found" });
            return;
        }
        const updateStory = yield prisma.story.update({
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
    }
    catch (e) {
        res.status(400).json({ message: "Unable to Update Travel Story" });
    }
}));
// Delete story route
app.delete("/delete-story/:id", middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { id: userId } = req.user;
    try {
        const travelstory = yield prisma.story.findFirst({
            where: { id, authorId: userId },
        });
        if (!travelstory) {
            res.status(404).json({ message: "Travel Story Not Found" });
            return;
        }
        yield prisma.story.delete({ where: { id } });
        res.json({ message: "Travel Story Deleted Successfully" });
    }
    catch (e) {
        res.status(400).json({ message: "Unable to Delete Travel Story" });
    }
}));
// Favourite story route
app.put("/favourite-story/:id", middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { isFavourite } = req.body;
    try {
        const story = yield prisma.story.findUnique({ where: { id } });
        if (!story) {
            res.status(404).json({ message: "Story not found" });
            return;
        }
        const updatedStory = yield prisma.story.update({
            where: { id },
            data: { isFavourite },
        });
        res.json({
            message: "Story favourite status updated successfully",
            story: updatedStory,
        });
    }
    catch (e) {
        res.status(500).json({ message: "Unable to update story favourite status" });
    }
}));
// Search route
app.get("/search", middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query } = req.query;
    const { id: userId } = req.user;
    if (!query) {
        res.status(400).json({ message: "Query is Required" });
        return;
    }
    try {
        const travelStories = yield prisma.story.findMany({
            where: {
                authorId: userId,
                OR: [
                    { title: { contains: query, mode: "insensitive" } },
                    { story: { contains: query, mode: "insensitive" } },
                    { visitedLocation: { has: query } },
                ],
            },
            orderBy: { isFavourite: "desc" },
        });
        if (travelStories.length === 0) {
            res.status(200).json({ message: "No Stories Found" });
            return;
        }
        res.json({ travelStories });
    }
    catch (e) {
        res.status(400).json({ message: "Unable to Search" });
    }
}));
// Remove app.listen and export for Vercel
exports.default = app;
//# sourceMappingURL=index.js.map