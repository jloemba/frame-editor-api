import dotenv from "dotenv";
dotenv.config();

interface IConfig {
    port: string| number;
    googleServiceKey: string;
    templateDocId:string;
    driveFolderId:string;
    clientEmail:string;
    privateKey:string;
}
export const CONFIG:IConfig = {
  port: process.env.PORT || 3000,
  googleServiceKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY!,
  templateDocId: process.env.TEMPLATE_DOC_ID!,
  driveFolderId: process.env.DRIVE_FOLDER_ID!,
  clientEmail:process.env.CLIENT_EMAIL!,
  privateKey:process.env.PRIVATE_KEY!,
};
