import { Inngest } from "inngest";


export const inngest= new Inngest({id: "elevatetech", name:"elevatetech", credentials:{
    gemini:{
        apikey: process.env.GEMINI_API_KEY,
    },
}});