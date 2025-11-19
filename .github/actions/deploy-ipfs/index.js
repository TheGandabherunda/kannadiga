import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import FormData from "form-data";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function uploadDirectoryToPinata() {
  try {
    // Get inputs from workflow
    const pinataJwt = core.getInput("pinata_jwt");
    const sourceDir = core.getInput("source_dir");

    if (!pinataJwt) {
      throw new Error("PINATA_JWT is required");
    }

    console.log(`📁 Preparing to upload directory: ${sourceDir}`);

    // Get the base folder name
    const baseFolderName = path.basename(sourceDir);
    console.log(`📦 Base folder name: ${baseFolderName}`);

    // Create FormData
    const formData = new FormData();

    // Add all the files with their relative paths
    function addFilesToFormData(dir, baseDir = dir) {
      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          addFilesToFormData(fullPath, baseDir);
        } else {
          // Get relative path WITHOUT prepending the base folder name
          const relativePath = path.relative(baseDir, fullPath);
          console.log(`   - ${relativePath}`);
          const fileStream = fs.createReadStream(fullPath);

          // Append with the relative path to preserve directory structure
          formData.append('file', fileStream, {
            filepath: relativePath
          });
        }
      }
    }

    addFilesToFormData(sourceDir);

    // Add metadata
    formData.append('pinataMetadata', JSON.stringify({
      name: baseFolderName
    }));

    console.log("🚀 Uploading to Pinata using axios...");

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          'Authorization': `Bearer ${pinataJwt}`,
          ...formData.getHeaders()
        }
      }
    );

    const upload = response.data;

    console.log("✅ Upload successful!");
    console.log(`📌 CID: ${upload.IpfsHash}`);
    console.log(`🔗 IPFS Gateway: https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}`);
    console.log(`📄 Your site: https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}/index.html`);

    // Set outputs
    core.setOutput("cid", upload.IpfsHash);
    core.setOutput("ipfs_url", `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}`);
    core.setOutput("site_url", `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}/index.html`);
    core.setOutput("pin_size", upload.PinSize);
    core.setOutput("timestamp", upload.Timestamp);

    // Create a summary
    await core.summary
      .addHeading("🎉 Deployment Successful")
      .addTable([
        [{ data: "Property", header: true }, { data: "Value", header: true }],
        ["CID", upload.IpfsHash],
        ["IPFS URL", `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}`],
        ["Site URL", `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}/index.html`],
        ["Pin Size", `${upload.PinSize} bytes`],
        ["Timestamp", upload.Timestamp],
      ])
      .addLink("🌐 View Your Site", `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}/index.html`)
      .write();

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
    }
    console.error("Error details:", error.stack);
    core.setFailed(error.message);
  }
}

// Run the upload
uploadDirectoryToPinata();