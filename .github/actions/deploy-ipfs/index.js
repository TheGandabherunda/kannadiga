import { PinataSDK } from "pinata";
import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";

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

    // Upload the directory to Pinata
    console.log("🚀 Uploading to Pinata...");
    const upload = await pinata.upload.fileArray(files, {
      groupId: undefined, // You can set a group ID if needed
    });

    console.log("✅ Upload successful!");
    console.log(`📌 CID: ${upload.cid}`);
    console.log(`🔗 IPFS URL: https://gateway.pinata.cloud/ipfs/${upload.cid}`);
    console.log(`📊 Upload ID: ${upload.id}`);

    // Set outputs for use in other workflow steps
    core.setOutput("cid", upload.cid);
    core.setOutput("ipfs_url", `https://gateway.pinata.cloud/ipfs/${upload.cid}`);
    core.setOutput("upload_id", upload.id);

    // Create a summary
    await core.summary
      .addHeading("🎉 Deployment Successful")
      .addTable([
        [{ data: "Property", header: true }, { data: "Value", header: true }],
        ["CID", upload.cid],
        ["IPFS URL", `https://gateway.pinata.cloud/ipfs/${upload.cid}`],
        ["Upload ID", upload.id],
        ["Files Uploaded", files.length.toString()],
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