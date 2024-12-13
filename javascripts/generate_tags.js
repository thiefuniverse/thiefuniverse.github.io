const fs = require('fs');
const path = require('path');

const directoryPath = '../articles/'; // 替换为您的目录路径
const tagPattern = /\[TAG:([^\]]+)\]/; // 正则表达式匹配 TAG:tes1,test2
const outputFilePath = 'static/tags.json'; 

let tagMap = {};

// 递归遍历目录
function traverseDirectory(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            traverseDirectory(fullPath); // 如果是目录，递归调用
        } else if (path.extname(file) === '.md') {
            extractTags(fullPath); // 处理 Markdown 文件
        }
    });
}

// 从文件中提取标签
function extractTags(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(tagPattern);
    
    if (match && match[1]) {
        const tags = match[1].split(',').map(tag => tag.trim());

        tags.forEach(tag => {
            if (!tagMap[tag]) {
                tagMap[tag] = [];
            }
            tagMap[tag].push(filePath); // 将文件路径添加到相应的标签数组中
        });
    }
}

// 开始遍历目录
traverseDirectory(directoryPath);
fs.writeFileSync(outputFilePath, JSON.stringify(tagMap, null, 2), 'utf-8');
console.log(`标签数据已写入 ${outputFilePath}`);