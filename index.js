import dotenv from "dotenv";
import connectToDatabase from "./src/database.js";
import connectToWhatsApp from "./src/socket.js";

dotenv.config();

(async () => {
  await connectToDatabase(); // Connect to database
  await connectToWhatsApp(); // Connect to whatsapp socket
})();
