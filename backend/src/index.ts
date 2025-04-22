import { PrismaClient } from "@prisma/client"
import express from "express"
import  bcrypt from "bcrypt"
import jwt, { JwtPayload } from "jsonwebtoken"
import { AuthenticatedRequest, authenticateToken } from "./middleware"
import { upload } from "./multer"
import fs from "fs"
import path from "path"
import cors  from "cors"

const app = express()

const PORT = 3000

const prisma = new PrismaClient()

app.use(cors({
    origin: ['http://localhost:5173', 'https://your-frontend.vercel.app'], // Replace with your deployed frontend URL
    methods: ['GET', 'POST', 'OPTIONS'], // Include OPTIONS for preflight
    allowedHeaders: ['Content-Type', 'Authorization'], // Match frontend headers
}));

app.use(express.json())

app.post('/register', async (req, res)=>{
    const { username, email, password } = req.body
        if(!username || !email || !password){
            res.status(401).json({
                message: "Invalid Input"
        })
        return
    }
    try{
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
        data:{
            email:email,
            username:username,
            password: hashedPassword
        }
    })

        const token = await jwt.sign({id: user.id},"secret")

        res.json({
            message: "User Created Successfully",
            token: token,
            id: user.id
        })
    }
    catch(e){
        res.status(401).json({
            message: "Unable to Create User"
        })
    }
})


app.post('/login',async (req, res)=>{
    const { email, password } = req.body
    if( !email || !password){
        res.status(401).json({
            message: "Invalid Input"
        })
        return
    }
    try {
        const user = await prisma.user.findFirst({
            where:{
                email:email
            }
        })

        if(!user || !(await bcrypt.compare(password, user.password))){
            res.status(401).json({
                message:"Incorrect Credentials"
            })
            return
        }
        else{
            const token = await jwt.sign({id : user?.id},"secret")

            res.json({
                message: "Login Successfull",
                token: token
            })
        }
    }
    catch(e){
        res.status(400).json({
            message:"Unable to login"
        })
    }

})

app.get('/get-users',authenticateToken,async (req: AuthenticatedRequest,res)=>{

    if(!req.user){
        res.status(401).json({
            message:'Unauthorized'
        })
        return
    }

    const { id }:any | JwtPayload = await req.user

    const user = await prisma.user.findFirst({ where:{
        id: id
    }})

    res.json({
        message:"Access Granted",
        user: user
    })
})

app.post('/add-travelstory',authenticateToken,async (req: AuthenticatedRequest,res)=>{
    const { title, story, visitedLocation, imageUrl, visitedDate} = req.body
    const { id }: any = await req.user

    if(!title || !story || !visitedLocation || !visitedDate || !imageUrl){
        res.status(401).json({
            message: "All Field Are required"
        })
        return
    }

    const parseVisitedDate = new Date(parseInt(visitedDate))

    try{
        const travelstory = await prisma.story.create({
            data:{
                author: {
                    connect: {id}
                }, 
                title,
                story,
                visitedDate: parseVisitedDate,
                visitedLocation,
                imageUrl
            }
        })

        res.json({
            message:"Travel Story Created Successfully",
            story: travelstory
        }) 
    }
    catch(e){
        res.status(401).json({
            message: "Unable to Create Travel Story"
        })
    }
})

app.get('/get-allstory', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Get all stories without filtering by author
      const travelStories = await prisma.story.findMany({
        // Include author information so we can show the author's name
        include: {
          author: {
            select: {
              id: true,
              username: true
            }
          }
        },
        orderBy: {
          isFavourite: 'desc' // Show newest stories first
        }
      })
  
      res.json({
        travelStories
      })
    } catch (e) {
      res.status(500).json({
        message: "Unable to Fetch the Stories"
      })
    }
  })

app.post('/image-upload', upload.single('image') ,async (req:AuthenticatedRequest,res) =>{
    try{
        if(!req.file){
            res.status(401).json({
                message: "No File Uploaded"
            })
            return
        }
    
        const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`
    
        res.json({
            imageUrl
        })
    }
    catch(e){
        res.status(401).json({
            message: "Unable to Upload Image"
        })
    }
})

app.delete('/delete-image', async (req, res)=>{
    
    try {
        const { imageUrl } = req.query 

        if(!imageUrl){
            res.status(401).json({
                message: "Invalid Input"
            })
            return
        }
        const filename = path.basename(imageUrl as string)
        console.log(filename);
        
        const filepath = path.join(__dirname,"../uploads", filename)

        if(fs.existsSync(filepath)){
            fs.unlinkSync(filepath)
            res.status(200).json({
                message: "Image Deleted Successfully"
            })
        }
        else {
            res.status(200).json({
                message: "Image Not Founnd"
            })
        }
    }
    catch(e){
        res.status(401).json({
            message: "Unable to Delete Image"
        })
    }
})

app.use('/uploads',express.static(path.join(__dirname,'../uploads')))
app.use('/assets',express.static(path.join(__dirname,'../assets')))

app.put('/edit-story/:id',authenticateToken, async (req:AuthenticatedRequest,res)=>{
    const { id }: any = req.params
    const { title, story, visitedLocation, imageUrl, visitedDate} = req.body
    const { id: userId }: any = req.user

    if(!title || !story || !visitedLocation || !visitedDate || !imageUrl){
        res.status(401).json({
            message: "All Field Are required"
        })
        return
    }

    const parseVisitedDate = new Date(parseInt(visitedDate))
    const defaultImageUrl = "http://localhost:3000/assets/wanderlust.jpeg"

    try{
        const travelstory = await prisma.story.findFirst({
            where:{
                id: id ,
                authorId: userId
            }
        })
        if(!travelstory){
            res.status(401).json({
                message: "Travel Story Not Found"
            })
            return
        }
        const updateStory  = await prisma.story.update({
            where:{
                id: id
            },
            data:{
                title,
                story,
                visitedDate: parseVisitedDate,
                visitedLocation,
                imageUrl: imageUrl || defaultImageUrl
            }
        })
        res.json({
            message: "Travel Story Updated Successfully",
            story: updateStory
        })
    }
        catch(e){
            res.status(401).json({
                message: "Unable to Update Travel Story"
            })
        }
})

app.delete('/delete-story/:id',authenticateToken,async (req:AuthenticatedRequest, res)=>{
    const { id } = req.params
    const { id: userId }:any = req.user

    try{
        const travelstory = await prisma.story.findFirst({
            where:{
                id: id,
                authorId: userId
            }
        })
        if(!travelstory){
            res.status(401).json({
                message: "Travel Story Not Found"
            })
            return
        }
        await prisma.story.delete({
            where:{
                id: id
            }
        })
        res.json({
            message: "Travel Story Deleted Successfully"
        })
    }
    catch(e){
          res.status(401).json({
            message: "Unable to Delete Travel Story"
        })  
    }
})

app.put('/favourite-story/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params
    const { isFavourite } = req.body
    const { id: userId }: any = req.user
    
    try {
      // First find the story to make sure it exists
      const story = await prisma.story.findUnique({
        where: {
          id: id
        }
      })
      
      if (!story) {
        res.status(404).json({
          message: "Story not found"
        })
        return
      }
      
      // Update the story favorite status without checking if the user is the author
      const updatedStory = await prisma.story.update({
        where: {
          id: id
        },
        data: {
          isFavourite: isFavourite
        }
      })
      
      res.json({
        message: "Story favourite status updated successfully",
        story: updatedStory
      })
    } catch (e) {
      res.status(500).json({
        message: "Unable to update story favourite status"
      })
    }
  })

app.get('/search',authenticateToken,async (req:AuthenticatedRequest,res)=>{
    const { query } = req.query
    const { id: userId}:any = req.user

    if(!query){
        res.status(401).json({
            message: "Query is Required"
        })
        return
    }
    
    try {
       const travelStories = await prisma.story.findMany({
        where:{
            authorId: userId,
            OR:[
                { title:{ contains:query as string, mode:"insensitive" }},
                { story:{ contains:query as string, mode:"insensitive"}},
                { visitedLocation: { has: query as string} }
            ]
        },
        orderBy:{
            isFavourite: "desc"
        }
       })

       if(travelStories.length === 0){
            res.status(200).json({
                message: "No Stories Found"
            })
            return
       }

        res.json({
            travelStories
        })
    }
    catch(e){
        res.status(401).json({
            message: "Unable to Search"
        })
    }
})

app.listen(PORT,()=>{
    console.log(`Server Listening on ${PORT}`);
})