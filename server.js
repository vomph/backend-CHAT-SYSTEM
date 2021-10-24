import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors'


const app = express();
const port = process.env.PORT||9000;

const pusher = new Pusher({
    appId: "1159423",
    key: "d7c5d1ca39d7d66a58b7",
    secret: "ff161aca866f0de49f0b",
    cluster: "ap2",
    useTLS: true
  });

app.use(express.json());
app.use(cors())

/**app.use((req,res, next) => {
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers","*");
    next();
});*/

const connection_url ='mongodb+srv://AdminTask:mern_stack@admin-task-list.qmhsn.mongodb.net/chatdb?retryWrites=true&w=majority'

mongoose.connect(connection_url,{
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology:true
});

const db= mongoose.connection
db.once('open',()=>{
    console.log("DB connected");
    
    const msgCollection = db.collection('messagecontents')
    const changeStream =msgCollection.watch();

    changeStream.on('change',(change)=>{
        console.log("A change Occured",change);
        if (change.operationType==='insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages','inserted',
            {
                name:messageDetails.name,
                messages:messageDetails.message,
               timestamp:messageDetails.timestamp,
                received:messageDetails.received
            }
        );
    }else{
        console.log('Error Triggering Pusher')
    }

    });

});

app.get('/',(req ,res)=> res.status(200).send('hello world'));

app.get('/messages/sync',(req,res)=>{

    Messages.find((err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    });
});

app.post('/messages/new',(req,res)=>{
    const dbMessage = req.body

    Messages.create(dbMessage,(err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            res.status(201).send(data)
        }
    })
})

app.listen(port, ()  => console.log(`listing on localhost:${port}`));