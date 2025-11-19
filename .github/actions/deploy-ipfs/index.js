import { PinataSDK } from "pinata";
import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

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

    // Initialize Pinata SDK
    const pinata = new PinataSDK({
      pinataJwt: pinataJwt,
    });

    // Read all files from the source directory recursively
    const files = [];

    function readDirRecursive(dir, baseDir = dir) {
      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          readDirRecursive(fullPath, baseDir);
        } else {
          const fileContent = fs.readFileSync(fullPath);
          const relativePath = path.relative(baseDir, fullPath);
          const file = new File([fileContent], relativePath, {
            type: getMimeType(item.name)
          });
          files.push(file);
        }
      }
    }

    readDirRecursive(sourceDir);

    console.log(`📦 Found ${files.length} files to upload`);
    files.forEach(file => console.log(`   - ${file.name}`));

    // Upload the files array to Pinata using the correct method
    console.log("🚀 Uploading to Pinata...");

    // Use the base upload method with file array
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('file', file, file.name);
    });

    formData.append('pinataMetadata', JSON.stringify({
      name: 'kannadiga-site'
    }));

    formData.append('pinataOptions', JSON.stringify({
      wrapWithDirectory: true
    }));

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataJwt}`
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
    console.log(`🔗 IPFS URL: https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}`);

    // Set outputs for use in other workflow steps
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
        ["Pin Size", upload.PinSize.toString()],
        ["Files Uploaded", files.length.toString()],
        ["Timestamp", upload.Timestamp],
      ])
      .write();

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    core.setFailed(error.message);
  }
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".txt": "text/plain",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

// Run the upload
uploadDirectoryToPinata();