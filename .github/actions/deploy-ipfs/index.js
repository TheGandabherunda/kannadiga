const core = require('@actions/core');
const fs = require('fs');
const path = require('path');
const PinataSDK = require('pinata-sdk');

async function run() {
  try {
    const pinataJwt = core.getInput('pinata-jwt');
    const sourceDir = core.getInput('source-dir');
    const pinName = core.getInput('pin-name');

    const pinata = new PinataSDK({ pinataJwt });
    await pinata.testAuthentication();
    console.log('✅ Pinata authentication successful');

    if (!fs.existsSync(sourceDir)) throw new Error(`Source directory ${sourceDir} does not exist`);

    const files = await getAllFiles(sourceDir);
    console.log(`📁 Found ${files.length} files to upload`);

    const result = await pinata.upload.public.fileArray(files)
      .name(pinName);

    console.log('✅ Upload successful!');
    console.log(`📍 IPFS Hash: ${result.cid}`);
    console.log(`🌍 Gateway URL: https://gateway.pinata.cloud/ipfs/${result.cid}`);

    core.setOutput('ipfs-hash', result.cid);
    core.setOutput('gateway-url', `https://gateway.pinata.cloud/ipfs/${result.cid}`);

  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

async function getAllFiles(dir, array = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      await getAllFiles(fullPath, array);
    } else {
      const content = fs.readFileSync(fullPath);
      const blob = new Blob([content]);
      const relative = path.relative(process.cwd(), fullPath);
      const fileObj = new File([blob], relative);
      array.push(fileObj);
    }
  }
  return array;
}

run();
