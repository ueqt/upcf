import path from 'path';
import fs from 'fs';

/**
 * deal powerpage upload
 * @param {*} schemaRequest 微软crm api请求对象
 * @param {string} type 模块
 * @param {string} filetype 文件类型
 * @param {string} webfileid 上传目标mspp_webfile的id
 */
const deal = async (schemaRequest, type, filetype,webfileid) => {
  // 1. Find the target .js file in the dist directory
  const distDir = path.resolve('.', 'dist', type);
  console.log(`distDir: ${distDir}`);
  const FILE_PREFIX = `${type}.`;
  const files = fs.readdirSync(distDir);
  // Find the latest file by timestamp
  const targetFiles = files.filter(f => f.startsWith(FILE_PREFIX) && f.endsWith(`.${filetype}`));
  if (targetFiles.length === 0) {
    console.error(`File starting with "${FILE_PREFIX}" and ending with ".${filetype}" not found in ${distDir}`);
  }
  const sourceFileName = targetFiles[0];
  const filePath = path.join(distDir, sourceFileName);

  // 2. Read file content
  const fileContent = fs.readFileSync(filePath);

  // 3. Upload the file
  const uploadUrl = `powerpagecomponents(${webfileid})/filecontent?x-ms-file-name=${sourceFileName}`;

  console.log(`Uploading ${filePath} as ${sourceFileName} to Power Pages...`);

  try {
      await schemaRequest.request(uploadUrl, {
          method: 'PATCH',
          body: fileContent,
          otherHeaders: {
            'Content-Type': `application/octet-stream`
          },
          noNeedValue: true
      });
  } catch (error) {
      console.error('An error occurred during upload:', error);
      process.exit(1);
  }
}

export { deal };
