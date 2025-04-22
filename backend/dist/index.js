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
const googleapis_1 = require("googleapis");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const logger_1 = __importDefault(require("./logger"));
const zod_1 = require("zod");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
// Initialize Google Drive API
const auth = new googleapis_1.google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS),
    scopes: ["https://www.googleapis.com/auth/drive.file"],
});
const drive = googleapis_1.google.drive({ version: "v3", auth });
app.use((0, cors_1.default)({
    origin: ["http://localhost:5173", "https://your-frontend.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
app.use(express_1.default.json());
app.options("*", (0, cors_1.default)());
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
const storySchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    story: zod_1.z.string().min(1),
    visitedLocation: zod_1.z.string().min(1),
    imageUrl: zod_1.z.string().url(),
    visitedDate: zod_1.z.string().transform((val) => new Date(parseInt(val))),
});
// Register route
app.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        logger_1.default.warn("Invalid register input", { email });
        res.status(400).json({ message: "Invalid Input" });
        return;
    }
    try {
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const user = yield prisma.user.create({
            data: { email, username, password: hashedPassword },
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET || "secret");
        logger_1.default.info("User registered", { email, userId: user.id });
        res.json({ message: "User Created Successfully", token, id: user.id });
    }
    catch (e) {
        logger_1.default.error("Register error", { error: e, email });
        res.status(400).json({ message: "Unable to Create User" });
        return;
    }
}));
// Login route
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        logger_1.default.warn("Invalid login input", { email });
        res.status(400).json({ message: "Invalid Input" });
        return;
    }
    try {
        const parsed = loginSchema.parse(req.body);
        const user = yield prisma.user.findFirst({
            where: { email: parsed.email },
            select: { id: true, password: true },
        });
        if (!user || !(yield bcrypt_1.default.compare(parsed.password, user.password))) {
            logger_1.default.warn("Incorrect login credentials", { email });
            res.status(401).json({ message: "Incorrect Credentials" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET || "secret");
        logger_1.default.info("Login successful", { email, userId: user.id });
        res.json({ message: "Login Successful", token });
    }
    catch (e) {
        logger_1.default.error("Login error", { error: e, email: req.body.email });
        res.status(400).json({ message: e instanceof zod_1.z.ZodError ? "Invalid Input" : "Internal Server Error" });
        return;
    }
}));
// Get users route
app.get("/get-users", middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        logger_1.default.warn("Unauthorized access to get-users");
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const { id } = req.user;
    try {
        const user = yield prisma.user.findFirst({ where: { id } });
        logger_1.default.info("User fetched", { userId: id });
        res.json({ message: "Access Granted", user });
    }
    catch (e) {
        logger_1.default.error("Get users error", { error: e });
        res.status(500).json({ message: "Unable to Fetch User" });
        return;
    }
}));
// Add travel story route
app.post("/add-travelstory", middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
    const { id } = req.user;
    if (!title || !story || !visitedLocation || !visitedDate || !imageUrl) {
        logger_1.default.warn("Missing travel story fields", { userId: id });
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
        logger_1.default.info("Travel story created", { storyId: travelstory.id, userId: id });
        res.json({ message: "Travel Story Created Successfully", story: travelstory });
    }
    catch (e) {
        logger_1.default.error("Add travel story error", { error: e });
        res.status(400).json({ message: "Unable to Create Travel Story" });
        return;
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
        logger_1.default.info("Fetched all stories", { count: travelStories.length });
        res.json({ travelStories });
    }
    catch (e) {
        logger_1.default.error("Get all stories error", { error: e });
        res.status(500).json({ message: "Unable to Fetch the Stories" });
        return;
    }
}));
// Image upload route (modified for Vercel)
app.post("/image-upload", multer_1.upload.single("image"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        logger_1.default.warn("No file uploaded");
        res.status(400).json({ message: "No File Uploaded" });
        return;
    }
    try {
        const fileMetadata = {
            name: req.file.filename,
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
        };
        const media = {
            mimeType: req.file.mimetype,
            body: fs_1.default.createReadStream(req.file.path),
        };
        const { data } = yield drive.files.create({
            requestBody: fileMetadata,
            media,
            fields: "id",
        });
        yield drive.permissions.create({
            fileId: data.id,
            requestBody: { role: "reader", type: "anyone" },
        });
        const { data: fileData } = yield drive.files.get({
            fileId: data.id,
            fields: "webViewLink",
        });
        fs_1.default.unlinkSync(req.file.path); // Clean up /tmp
        logger_1.default.info("Image uploaded to Google Drive", { imageUrl: fileData.webViewLink });
        res.json({ imageUrl: fileData.webViewLink });
    }
    catch (e) {
        logger_1.default.error("Image upload error", { error: e });
        res.status(500).json({ message: "Unable to Upload Image" });
        return;
    }
}));
// Delete image route (modified for Vercel)
app.delete("/delete-image", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { imageUrl } = req.query;
    if (!imageUrl) {
        logger_1.default.warn("Invalid delete image input");
        res.status(400).json({ message: "Invalid Input" });
        return;
    }
    try {
        const filename = path_1.default.basename(imageUrl);
        const filepath = path_1.default.join("/tmp/uploads", filename);
        if (fs_1.default.existsSync(filepath)) {
            fs_1.default.unlinkSync(filepath);
            res.status(200).json({ message: "Image Deleted Successfully" });
            return;
        }
        else {
            res.status(404).json({ message: "Image Not Found" });
            return;
        }
    }
    catch (e) {
        logger_1.default.error("Delete image error", { error: e });
        res.status(400).json({ message: "Unable to Delete Image" });
        return;
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
        logger_1.default.warn("Missing edit story fields", { storyId: id, userId });
        res.status(400).json({ message: "All Fields Are Required" });
        return;
    }
    const parseVisitedDate = new Date(parseInt(visitedDate));
    const defaultImageUrl = "https://wanderlust-vert-nu.vercel.app/assets/wanderlust.jpeg";
    try {
        const travelstory = yield prisma.story.findFirst({
            where: { id, authorId: userId },
        });
        if (!travelstory) {
            logger_1.default.warn("Travel story not found", { storyId: id, userId });
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
        logger_1.default.info("Travel story updated", { storyId: id, userId });
        res.json({ message: "Travel Story Updated Successfully", story: updateStory });
    }
    catch (e) {
        logger_1.default.error("Edit story error", { error: e });
        res.status(400).json({ message: e instanceof zod_1.z.ZodError ? "Invalid Input" : "Unable to Update Travel Story" });
        return;
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
            logger_1.default.warn("Travel story not found", { storyId: id, userId });
            res.status(404).json({ message: "Travel Story Not Found" });
            return;
        }
        yield prisma.story.delete({ where: { id } });
        logger_1.default.info("Travel story deleted", { storyId: id, userId });
        res.json({ message: "Travel Story Deleted Successfully" });
    }
    catch (e) {
        logger_1.default.error("Delete story error", { error: e });
        res.status(400).json({ message: "Unable to Delete Travel Story" });
        return;
    }
}));
// Favourite story route
app.put("/favourite-story/:id", middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { isFavourite } = zod_1.z.object({ isFavourite: zod_1.z.boolean() }).parse(req.body);
    try {
        const story = yield prisma.story.findUnique({ where: { id } });
        if (!story) {
            logger_1.default.warn("Story not found", { storyId: id });
            res.status(404).json({ message: "Story not found" });
            return;
        }
        const updatedStory = yield prisma.story.update({
            where: { id },
            data: { isFavourite },
        });
        logger_1.default.info("Story favourite status updated", { storyId: id });
        res.json({ message: "Story favourite status updated successfully", story: updatedStory });
    }
    catch (e) {
        logger_1.default.error("Favourite story error", { error: e });
        res.status(500).json({ message: "Unable to update story favourite status" });
        return;
    }
}));
// Search route
app.get("/search", middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query } = zod_1.z.object({ query: zod_1.z.string().min(1) }).parse(req.query);
    const { id: userId } = req.user;
    if (!query) {
        logger_1.default.warn("Search query missing", { userId });
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
        logger_1.default.info("Search executed", { query, userId, count: travelStories.length });
        if (travelStories.length === 0) {
            res.status(200).json({ message: "No Stories Found" });
            return;
        }
        res.json({ travelStories });
    }
    catch (e) {
        logger_1.default.error("Search error", { error: e });
        res.status(400).json({ message: e instanceof zod_1.z.ZodError ? "Invalid Query" : "Unable to Search" });
        return;
    }
}));
app.use((err, req, res, next) => {
    logger_1.default.error("Unhandled error", { error: err, path: req.path });
    res.status(500).json({ message: "Internal Server Error" });
    return;
});
exports.default = app;
//# sourceMappingURL=index.js.map