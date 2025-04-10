document.addEventListener('DOMContentLoaded', function () {
    let isEditMode = false; // 编辑模式标志

    // 阻止默认事件
    function preventDefault(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    // 提取 dragStart 函数，使其可全局访问
    function dragStart(e) {
        console.log('dragStart event triggered');
        draggedItem = e.target.closest('.modelDiv');
        if (!draggedItem) return;
        isFromRight = draggedItem.closest('.levelContent') !== null;
        const modelBtn = draggedItem.querySelector('.model');
        // 存储模型数据
        const data = {
            modelName: modelBtn.value,
            modelUrl: modelBtn.dataset.url,
            intro: modelBtn.dataset.intro
        };
        console.log('Drag data:', data);
        e.dataTransfer.setData('text/json', JSON.stringify(data));
        e.dataTransfer.effectAllowed = 'move';
    }

    // 初始化拖拽事件
    function initDragEvents() {
        const modelList = document.querySelector('.modelList');
        const levelContents = document.querySelectorAll('.levelContent');
        const modelDivs = document.querySelectorAll('.modelDiv');

        // 绑定拖拽事件
        modelDivs.forEach(div => {
            div.addEventListener('dragstart', dragStart);
        });

        // 左侧模型库事件
        modelList.addEventListener('dragover', preventDefault);
        modelList.addEventListener('dragenter', preventDefault);

        // 右侧层级事件
        levelContents.forEach(level => {
            bindLevelContentEvents(level);
        });
    }

    // 为层级内容绑定拖拽事件
    function bindLevelContentEvents(levelContent) {
        if (levelContent.hasAttribute('dragover-bound')) return; // 防止重复绑定

        levelContent.addEventListener('dragover', preventDefault);
        levelContent.addEventListener('dragenter', preventDefault);
        levelContent.addEventListener('drop', function (e) {
            console.log('drop event triggered on levelContent');
            dropOnRight(e, this);
        });

        // 添加标记，防止重复绑定
        levelContent.setAttribute('dragover-bound', 'true');
    }

    // 左侧放置处理
    function dropOnLeft(e) {
        e.preventDefault();
        const draggedItem = e.dataTransfer.getData('text/json');
        if (draggedItem) {
            const modelDiv = document.createElement('div');
            modelDiv.className = 'modelDiv';
            modelDiv.draggable = true;
            const data = JSON.parse(draggedItem);
            modelDiv.innerHTML = `
                <div class="right">
                    <input type="button" 
                           value="${data.modelName}" 
                           class="model"
                           data-url="${data.modelUrl}" 
                           data-intro="${data.intro}">
                </div>
            `;
            modelDiv.addEventListener('dragstart', dragStart);
            modelList.appendChild(modelDiv);
        }
    }

    // 右侧放置处理
    function dropOnRight(e, targetLevelContent) {
        console.log('dropOnRight called');
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData('text/json'));

        // 检查是否已经存在相同的模型
        const existingModels = targetLevelContent.querySelectorAll('.model');
        for (const model of existingModels) {
            if (model.value === data.modelName) {
                alert('该模型已被拖拽到此层级中');
                return;
            }
        }

        // 创建新的模型元素
        const newModelDiv = document.createElement('div');
        newModelDiv.className = 'modelDiv';
        newModelDiv.draggable = true;
        newModelDiv.innerHTML = `
            <div class="right">
                <input type="button" 
                       value="${data.modelName}" 
                       class="model"
                       data-url="${data.modelUrl}" 
                       data-intro="${data.intro}">
            </div>
        `;
        newModelDiv.addEventListener('dragstart', dragStart);
        targetLevelContent.appendChild(newModelDiv);
    }

    // 初始化应用
    function initApp() {
        initializeModelButtons();
        initDragEvents();
        setupUploadButton();
        setupMainSubmitButton();
        setupContentSubmitButton();
        setupModelInfoDisplay();
        setupDeleteMode(); // 初始化删除模式
    }

    // 初始化左侧模型按钮
    function initializeModelButtons() {
        const modelButtons = document.querySelectorAll('.bodyLeft .model');
        const modelListData = [
            {
                modelName: 'openai',
                modelUrl: 'https://chat.openai.com/',
                intro: '由OpenAI开发，以强大的自然语言处理能力著称，支持多任务处理，广泛应用于对话、创作和代码生成，代表作为GPT系列模型。'
            },
            {
                modelName: 'deepseek',
                modelUrl: 'https://chat.deepseek.com/',
                intro: '深度求索公司推出的开源大模型，专注高效推理与长文本处理，支持128K上下文，适合代码、数学及复杂逻辑任务。'
            },
            {
                modelName: '腾讯元宝',
                modelUrl: 'https://yuanbao.tencent.com/',
                intro: '腾讯推出的企业级大模型，强调安全与落地应用，支持多模态交互，适用于金融、医疗等行业场景优化。'
            }
        ];
        modelButtons.forEach((button, index) => {
            if (modelListData[index]) {
                button.value = modelListData[index].modelName;
                button.dataset.url = modelListData[index].modelUrl;
                button.dataset.intro = modelListData[index].intro;
            }
        });
    }

    // 处理上传按钮点击事件
    function setupUploadButton() {
        const uploadBtn = document.querySelector('.upload');
        const modal = document.getElementById('uploadModal');
        const submitUpload = document.getElementById('submitUpload');

        uploadBtn.addEventListener('click', () => {
            modal.style.display = 'block';
        });

        submitUpload.addEventListener('click', () => {
            const modelName = document.getElementById('modelNameInput').value;
            const modelUrl = document.getElementById('modelUrlInput').value;
            const intro = document.getElementById('introInput').value;

            if (!modelName || !modelUrl || !intro) {
                alert('所有字段均需填写');
                return;
            }

            // 创建新模型元素
            const newModelDiv = document.createElement('div');
            newModelDiv.className = 'modelDiv';
            newModelDiv.draggable = true;
            newModelDiv.innerHTML = `
                <div class="right">
                    <input type="button" 
                           value="${modelName}" 
                           class="model"
                           data-url="${modelUrl}" 
                           data-intro="${intro}">
                </div>
            `;

            // 添加到左侧模型库
            const modelList = document.querySelector('.modelList');
            modelList.appendChild(newModelDiv);

            // 初始化拖拽事件（确保新元素有拖拽功能）
            newModelDiv.addEventListener('dragstart', dragStart);

            // 如果处于编辑模式，绑定删除事件并添加高亮样式
            if (isEditMode) {
                newModelDiv.addEventListener('click', deleteLeftModelDiv);
                newModelDiv.classList.add('delete-highlight');
            }

            // 重新绑定信息框显示事件
            setupModelInfoDisplay();

            // 清空输入框
            document.getElementById('modelNameInput').value = '';
            document.getElementById('modelUrlInput').value = '';
            document.getElementById('introInput').value = '';

            // 关闭弹窗
            modal.style.display = 'none';
        });

        // 点击空白处关闭弹窗
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // 处理主提交按钮点击事件
    function setupMainSubmitButton() {
        const submitBtn = document.querySelector('.tijiao1');
        const submitModal = document.getElementById('submitModal');

        submitBtn.addEventListener('click', () => {
            submitModal.style.display = 'block';
        });

        // 点击空白处关闭模态框
        submitModal.addEventListener('click', (e) => {
            if (e.target === submitModal) {
                submitModal.style.display = 'none';
            }
        });
    }

    // 处理内容提交按钮点击事件
    async function setupContentSubmitButton() {
        const submitContentBtn = document.getElementById('submitContent');
        submitContentBtn.addEventListener('click', async () => {
            const text = document.getElementById('contentTextarea').value;
            const imageFiles = document.getElementById('imageUpload').files;
            let imageBase64 = null;

            // 如果用户上传了图片，将其转换为 Base64 格式
            if (imageFiles.length > 0) {
                try {
                    imageBase64 = await convertToBase64(imageFiles[0]);
                } catch (error) {
                    console.error('图片转换失败:', error);
                    alert('图片转换失败，请检查图片格式');
                    return;
                }
            }

            // 构造请求数据
            const modelData = {
                contentList: [], // 层级和模型数据
                question: text, // 用户输入的问题
                image: imageBase64 // 用户上传的图片（可选）
            };

            // 遍历右侧层级，收集模型数据
            const levels = document.querySelectorAll('.bodyRight .level');
            levels.forEach((level, levelIndex) => {
                const models = level.querySelectorAll('.modelDiv');
                const modelList = Array.from(models).map(model => ({
                    modelName: model.querySelector('.model').value,
                    modelUrl: model.querySelector('.model').dataset.url
                }));

                modelData.contentList.push({
                    layer: levelIndex + 1, // 层级编号
                    modelList: modelList // 当前层级的模型列表
                });
            });

            // 发送请求到后端
            try {
                const response = await fetch('http://localhost:3000/api', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(modelData)
                });

                if (!response.ok) {
                    throw new Error(`HTTP 错误! 状态码: ${response.status}`);
                }

                const data = await response.json();
                console.log('后端响应:', data);

                // 显示后端返回的回答
                displayAIResponse(data.data.answers || []);
            } catch (error) {
                console.error('提交失败:', error);
                alert('提交失败，请检查网络或服务器状态');
            }

            // 清空输入
            document.getElementById('contentTextarea').value = '';
            document.getElementById('imageUpload').value = '';
            document.getElementById('submitModal').style.display = 'none';
        });
    }

    function displayAIResponse(answers) {
        const responseContainer = document.getElementById('answerContainer');
        responseContainer.innerHTML = ''; // 清空之前的内容

        answers.forEach(answer => {
            const answerDiv = document.createElement('div');
            answerDiv.innerHTML = `
                <p><strong>模型 URL:</strong> ${answer.modelUrl}</p>
                <p><strong>回答:</strong> ${answer.answer}</p>
                <hr>
            `;
            responseContainer.appendChild(answerDiv);
        });

        // 自动滚动到最新答案
        responseContainer.scrollTop = responseContainer.scrollHeight;
    }

    // 将文件转换为 Base64 格式
    function convertToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    }

    // 初始化左侧模型按钮交互
    function setupModelInfoDisplay() {
        const leftModels = document.querySelectorAll('.bodyLeft .model');
        leftModels.forEach(modelBtn => {
            // 添加鼠标悬停事件显示信息框
            modelBtn.addEventListener('mouseenter', function () {
                // 检查是否已存在信息框
                const existingInfo = document.querySelector('.model-info');
                if (existingInfo) existingInfo.remove();

                const infoBox = document.createElement('div');
                infoBox.className = 'model-info';
                const url = this.dataset.url;
                const intro = this.dataset.intro;
                infoBox.innerHTML = `
                    <p>URL: ${url}</p>
                    <p>简介: ${intro}</p>
                `;

                // 定位显示框
                const rect = this.getBoundingClientRect();
                infoBox.style.left = rect.right + 10 + 'px';
                infoBox.style.top = rect.top + 'px';

                // 确保显示
                infoBox.style.display = 'block';
                document.body.appendChild(infoBox);

                // 优化隐藏逻辑
                const hideInfo = () => {
                    infoBox.remove();
                    this.removeEventListener('mouseleave', hideInfo);
                    infoBox.removeEventListener('mouseleave', hideInfo);
                };

                this.addEventListener('mouseleave', hideInfo);
                infoBox.addEventListener('mouseleave', hideInfo);
            });

            // 确保拖拽事件不会被覆盖
            modelBtn.addEventListener('dragstart', dragStart);
        });
    }

    // 层级管理
    let levelCount = document.querySelectorAll('.level').length + 1;
    document.querySelector('.addLevel').addEventListener('click', () => {
        const allLevelContents = document.querySelectorAll('.levelContent');
        if (Array.from(allLevelContents).some(level => level.children.length === 0)) {
            alert('存在一个层级为空，无法增加层级');
            return;
        }

        // 创建新层级
        const newLevel = document.createElement('div');
        newLevel.className = 'level';
        newLevel.innerHTML = `
            <div class="levelTitle">层级：${levelCount}</div>
            <div class="levelContent"></div>
        `;

        const levelContent = newLevel.querySelector('.levelContent');

        // 为新创建的 levelContent 绑定拖拽事件
        bindLevelContentEvents(levelContent);

        // 如果处于编辑模式，添加高亮样式并绑定删除事件
        if (isEditMode) {
            newLevel.classList.add('delete-highlight');
            newLevel.addEventListener('click', deleteLevel);
        }

        // 将新层级添加到右侧
        document.querySelector('.bodyRight').appendChild(newLevel);
        levelCount++;
    });

    // 全局拖放事件处理
    document.addEventListener('dragover', preventDefault);
    document.addEventListener('dragenter', preventDefault);

    // 全局变量
    let draggedItem = null;
    let isFromRight = false;

    // 启动应用
    initApp();

    // 进入编辑模式
    function setupDeleteMode() {
        const deleteButton = document.querySelector('.shanchu');
        deleteButton.addEventListener('click', () => {
            isEditMode = !isEditMode; // 切换编辑模式
            if (isEditMode) {
                alert('进入编辑模式：点击右侧层级或模型删除');
                enableDeleteMode();
            } else {
                alert('退出编辑模式');
                disableDeleteMode();
            }
        });
    }

    // 启用删除模式
    function enableDeleteMode() {
        const levels = document.querySelectorAll('.bodyRight .level');
        const modelDivs = document.querySelectorAll('.bodyRight .modelDiv');
        const leftModelDivs = document.querySelectorAll('.bodyLeft .modelDiv'); // 左侧模型

        // 为右侧层级绑定点击删除事件
        levels.forEach(level => {
            level.addEventListener('click', deleteLevel);
            level.classList.add('delete-highlight'); // 添加高亮样式
        });

        // 为右侧模型绑定点击删除事件
        modelDivs.forEach(modelDiv => {
            modelDiv.addEventListener('click', deleteModelDiv);
            modelDiv.classList.add('delete-highlight'); // 添加高亮样式
        });

        // 为左侧模型绑定点击删除事件
        leftModelDivs.forEach(modelDiv => {
            modelDiv.addEventListener('click', deleteLeftModelDiv);
            modelDiv.classList.add('delete-highlight'); // 添加高亮样式
        });
    }

    // 禁用删除模式
    function disableDeleteMode() {
        const levels = document.querySelectorAll('.bodyRight .level');
        const modelDivs = document.querySelectorAll('.bodyRight .modelDiv');
        const leftModelDivs = document.querySelectorAll('.bodyLeft .modelDiv'); // 左侧模型

        // 移除右侧层级的点击事件
        levels.forEach(level => {
            level.removeEventListener('click', deleteLevel);
            level.classList.remove('delete-highlight'); // 移除高亮样式
        });

        // 移除右侧模型的点击事件
        modelDivs.forEach(modelDiv => {
            modelDiv.removeEventListener('click', deleteModelDiv);
            modelDiv.classList.remove('delete-highlight'); // 移除高亮样式
        });

        // 移除左侧模型的点击事件
        leftModelDivs.forEach(modelDiv => {
            modelDiv.removeEventListener('click', deleteLeftModelDiv);
            modelDiv.classList.remove('delete-highlight'); // 移除高亮样式
        });
    }

    // 删除层级
    function deleteLevel(e) {
        if (isEditMode) {
            e.stopPropagation(); // 阻止事件冒泡
            const level = e.currentTarget;
            if (confirm('确定要删除该层级吗？')) {
                level.remove();
                updateLevelNumbers(); // 更新层级的级数
            }
        }
    }

    // 删除模型
    function deleteModelDiv(e) {
        if (isEditMode) {
            e.stopPropagation(); // 阻止事件冒泡
            const modelDiv = e.currentTarget;
            if (confirm('确定要删除该模型吗？')) {
                modelDiv.remove();
            }
        }
    }

    // 删除左侧模型
    function deleteLeftModelDiv(e) {
        if (isEditMode) {
            e.stopPropagation(); // 阻止事件冒泡
            const modelDiv = e.currentTarget;
            const modelName = modelDiv.querySelector('.model').value; // 获取模型名称

            if (confirm(`确定要删除左侧模型 "${modelName}" 吗？`)) {
                // 删除左侧模型
                modelDiv.remove();

                // 遍历右侧层级，删除相同的模型
                const levels = document.querySelectorAll('.bodyRight .levelContent');
                levels.forEach(levelContent => {
                    const models = levelContent.querySelectorAll('.modelDiv');
                    models.forEach(model => {
                        const rightModelName = model.querySelector('.model').value;
                        if (rightModelName === modelName) {
                            model.remove(); // 删除右侧模型
                        }
                    });
                });

                console.log(`模型 "${modelName}" 已从左侧和右侧删除`);
            }
        }
    }

    // 更新层级的级数
    function updateLevelNumbers() {
        const levels = document.querySelectorAll('.bodyRight .level');
        levels.forEach((level, index) => {
            const levelTitle = level.querySelector('.levelTitle');
            levelTitle.textContent = `层级：${index + 1}`;
        });

        // 更新全局层级计数
        levelCount = levels.length + 1;
    }

    const answerWrapper = document.querySelector('.answer-container-wrapper');
    const toggleButton = document.getElementById('toggleAnswers');
    const clearButton = document.getElementById('clearAnswers');
    const answerContainer = document.getElementById('answerContainer');

    // 切换显示/隐藏
    toggleButton.addEventListener('click', () => {
        if (answerWrapper.classList.contains('hidden')) {
            // 如果容器是隐藏状态，显示容器并切换按钮文字为“关闭”
            answerWrapper.classList.remove('hidden');
            toggleButton.textContent = '关闭';
        } else {
            // 如果容器是显示状态，隐藏容器并切换按钮文字为“打开”
            answerWrapper.classList.add('hidden');
            toggleButton.textContent = '打开';
        }
    });

    // 清空内容
    clearButton.addEventListener('click', () => {
        answerContainer.innerHTML = '';
    });
});