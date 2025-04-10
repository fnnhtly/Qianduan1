const express = require("express");
const app = express();

// 启用 JSON 解析中间件
app.use(express.json());

// 允许跨域请求
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

// 处理 POST 请求
app.post("/api", (req, res) => {
    const { contentList, question, image } = req.body;

    // 打印接收到的数据
    console.log("接收到的层级和模型数据:", JSON.stringify(contentList, null, 2));
    console.log("接收到的问题:", question);
    if (image) {
        console.log("接收到的图片 (Base64):", image.slice(0, 100) + "..."); // 仅打印前 100 个字符
    }

    // 模拟 AI 回答
    const answers = contentList.map(layer => {
        return layer.modelList.map(model => ({
            modelUrl: model.modelUrl,
            answer: `这是模型 ${model.modelName} 的回答`
        }));
    }).flat();

    console.log("生成的回答:", JSON.stringify(answers, null, 2));

    // 返回响应
    res.json({
        status: "success",
        data: {
            question,
            answers
        }
    });
});

// 启动服务器
app.listen(3000, () => console.log("后端运行在 http://localhost:3000"));