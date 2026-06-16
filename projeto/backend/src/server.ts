import express from "express";
import cors from "cors"; 
import { router } from "./routes/routes.js";


const app = express();
app.use(cors()); 
app.use(express.json());
app.use(router)


app.listen(3000, "0.0.0.0", () => {
    console.log('Server is listening on port 3000')
})