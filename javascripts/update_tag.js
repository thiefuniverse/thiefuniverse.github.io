const fs = require('fs');
const path = require('path');

// 主 Markdown 文件路径
const mainMdFile = 'articles/Archive.md';

// 存储标签和对应信息的对象
const tagsDict = {};

// 读取主 Markdown 文件
let content = fs.readFileSync(mainMdFile, 'utf8');
if (!content) {
    console.error(`Error reading ${mainMdFile}:`);
    return;
}

// 使用正则表达式提取每个链接
const links = [...content.matchAll(/\[(.*?)\]\((.*?)\)/g)];

// 遍历每个链接
links.forEach(([_, title, link]) => {
    const fullPath = path.resolve(path.dirname(mainMdFile), link); // 计算完整路径

    // 读取对应的 Markdown 文件
    let mdContent = fs.readFileSync(fullPath, 'utf8');

    // 提取 TAG 和 TIMESTAMP
    const tagMatch = mdContent.match(/\[TAG:(.*?)\]/);
    const timestampMatch = mdContent.match(/\[TIME:(.*?)\]/);

    const tags = tagMatch ? tagMatch[1].split(',').map(tag => tag.trim()) : [];
    const timestamp = timestampMatch ? timestampMatch[1] : null;

    // 将信息添加到 tagsDict
    tags.forEach(tag => {
        if (!tagsDict[tag]) {
            tagsDict[tag] = [];
        }
        tagsDict[tag].push({ title, path: fullPath, timestamp });
    });

    // 生成新的 Markdown 文件
});

generateMarkdownFile();
// 生成新的 Markdown 文件
function generateMarkdownFile() {
    const outputMdFile = 'articles/tags.md';
    let markdownContent = '# FlyThief\'s Blog Tag\n[TOC]\n';

    // 遍历标签并生成内容
    for (const tag in tagsDict) {
        // 按时间戳排序
        const entries = tagsDict[tag].sort((a, b) => {
            if (!a.timestamp) return -1; // 没有时间戳的放后面
            if (!b.timestamp) return 1;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        // 添加标签标题
        markdownContent += `## ${tag}\n`;

        entries.forEach(entry => {
            const { title, _, timestamp } = entry;
            const timestampStr = timestamp || '';
            const dirName = path.dirname(entry.path); // 获取目录路径
            const lastTwoLevels = path.join(path.basename(dirName), path.basename(entry.path));
            markdownContent += `- [${title}](${lastTwoLevels})(${timestampStr})\n`;
        });

        markdownContent += '\n'; // 每个标签后添加换行
    }

    // 写入到文件
    fs.writeFile(outputMdFile, markdownContent, (err) => {
        if (err) {
            console.error(`Error writing ${outputMdFile}:`, err);
        } else {
            console.log(`生成的标签总结已保存为 ${outputMdFile}`);
        }
    });
}