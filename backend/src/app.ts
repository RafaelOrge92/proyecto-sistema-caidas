import express, {type Request, type Response} from 'express';

const app = express()

app.get('/', (req: Request, res: Response) => {
    res.send("Server is running")
})

app.get('/health', (req: Request, res: Response) => {
    res.send("ok: True")
})

app.listen(3000, () => {
    console.log("Server is running on port 3000")
})