import express from "express";
import { PrismaClient } from '@prisma/client/edge'
import { ContactService } from "./service";

const app = express();
app.use(express.json());

const prisma = new PrismaClient();
const cservice = new ContactService();

app.get("/", (req: express.Request, res: express.Response) => {
  res.send("Hello World!");
});



app.post("/identify", async (req: express.Request, res: express.Response) => {
  try {
    const { email, phoneNumber } = req.body;
    console.log(email, phoneNumber);

    if(email.length == 0 && phoneNumber.length == 0){
      res.status(400).send("Email or phone number is missing");
      return;
    }

    const ret = await cservice.identify({ email, phoneNumber });
    console.log(ret);

    if(!ret){
      res.status(400).send("No contact found");
      return;
    }

    res.status(200).send(ret);

  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});