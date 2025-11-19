import path from 'path';
import fs from 'fs';

/**
 * deal powerpage upload
 * @param {*} schemaRequest 微软crm api请求对象
 * @param {string} type 模块
 * @param {string} webfileid 上传目标mspp_webfile的id
 */
const deal = async (schemaRequest, type, webfileid) => {
  // 1. Find the target .js file in the dist directory
  const distDir = path.resolve(__dirname, `dist/${type}`);
  console.log(`distDir: ${distDir}`);
  const FILE_PREFIX = `${type}.`;
  const files = fs.readdirSync(distDir);
  // Find the latest file by timestamp
  const jsFiles = files.filter(f => f.startsWith(FILE_PREFIX) && f.endsWith('.js'));
  if (jsFiles.length === 0) {
    console.error(`File starting with "${FILE_PREFIX}" and ending with ".js" not found in ${distDir}`);
  }
  const sourceFileName = jsFiles[0];
  const filePath = path.join(distDir, sourceFileName);

  // 2. Read file content
  const fileContent = fs.readFileSync(filePath);

  // 3. Upload the file
  const uploadUrl = `powerpagecomponents(${webfileid})/filecontent?x-ms-file-name=${sourceFileName}`;

  console.log(`Uploading ${filePath} as ${sourceFileName} to Power Pages...`);

  try {
      const response = await schemaRequest.request(uploadUrl, {
          method: 'PATCH',
          headers: {
              'Content-Type': 'application/octet-stream',
          },
          body: fileContent,
      });

      if (response.ok) {
          console.log(`Upload successful! Status: ${response.status}`);
      } else {
          const errorText = await response.text();
          console.error(`Upload failed with status: ${response.status} ${response.statusText}`);
          try {
              const errorJson = JSON.parse(errorText);
              console.error('Error details:', JSON.stringify(errorJson, null, 2));
          } catch (e) {
              console.error('Error details (not JSON):', errorText);
          }
          process.exit(1);
      }
  } catch (error) {
      console.error('An error occurred during upload:', error);
      process.exit(1);
  }
}

export { deal };
