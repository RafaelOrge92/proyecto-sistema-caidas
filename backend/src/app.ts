import express, {type Request, type Response} from 'express';

const app = express()

app.get('/', (req: Request, res: Response) => {
    res.send("Server is running")
})

app.get('/health', (req: Request, res: Response) => {
    res.send("ok: True")
})


export default app