import { ThirdwebSDK } from "@3rdweb/sdk";
import ethers from "ethers";

import dotenv from "dotenv";
dotenv.config();

const thirdsdk = new ThirdwebSDK(
  new ethers.Wallet(
    process.env.PRIVATE_KEY,
    ethers.getDefaultProvider(process.env.ALCHEMY_API_URL),
  ),
);

export default thirdsdk;