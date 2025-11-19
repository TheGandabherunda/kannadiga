import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import FormData from "form-data";

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

    // Get the base folder name - THIS IS CRITICAL!
    const baseFolderName = path.basename(sourceDir);
    console.log(`📦 Base folder name: ${baseFolderName}`);

    // Create FormData
    const formData = new FormData();

    function addFilesToFormData(dir, baseDir = dir) {
      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          addFilesToFormData(fullPath, baseDir);
        } else {
          // Get relative path from the parent of baseDir to include folder name
          const relativePath = path.join(baseFolderName, path.relative(baseDir, fullPath));
          console.log(`   - ${relativePath}`);
          const fileStream = fs.createReadStream(fullPath);
          formData.append('file', fileStream, {
            filepath: relativePath
          });
        }
      }
    }

    addFilesToFormData(sourceDir);

    // CRITICAL: The metadata name MUST match the base folder name!
    formData.append('pinataMetadata', JSON.stringify({
      name: baseFolderName
    }));

    console.log("🚀 Uploading to Pinata...");

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataJwt}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const upload = await response.json();

    console.log("✅ Upload successful!");
    console.log(`📌 CID: ${upload.IpfsHash}`);
    console.log(`🔗 IPFS Gateway: https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}`);
    console.log(`📄 Your files are at: https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}/`);

    // Set outputs
    core.setOutput("cid", upload.IpfsHash);
    core.setOutput("ipfs_url", `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}`);
    core.setOutput("pin_size", upload.PinSize);
    core.setOutput("timestamp", upload.Timestamp);

    // Create a summary
    await core.summary
      .addHeading("🎉 Deployment Successful")
      .addTable([
        [{ data: "Property", header: true }, { data: "Value", header: true }],
        ["CID", upload.IpfsHash],
        ["IPFS URL", `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}`],
        ["Pin Size", `${upload.PinSize} bytes`],
        ["Timestamp", upload.Timestamp],
      ])
      .addLink("🌐 View Your Files", `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}/`)
      .write();

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    console.error("Error details:", error.stack);
    core.setFailed(error.message);
  }
}

// Run the upload
uploadDirectoryToPinata();