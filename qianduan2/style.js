// 封装存储模块
const StorageService = {
    save: (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('存储失败:', error);
            showNotification('数据保存失败', 'error');
        }
    },
    load: (key) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('读取失败:', error);
            showNotification('数据加载失败', 'error');
            return [];
        }
    }
};

// 独立搜索模块
const SearchService = {
    search: (query, notes) => {
        return notes.filter(note =>
            note.title.toLowerCase().includes(query) ||
            note.content.toLowerCase().includes(query)
        );
    }
};

// 多语言处理
const languageDict = {
    English: {
        inputTitle: 'Please enter the title',
        inputContent: 'Please enter the content',
        submit: 'Submit',
        allSelect: 'Select All',
        noteHead2: 'What you learn today, remember today! Write notes frequently!',
        expand: 'Expand',
        collapse: 'Collapse',
        manage: 'Manage',
        all: 'All',
        urgent: 'Urgent',
        cancelUrgent: 'Cancel Urgent',
        recycleBin: 'Recycle Bin',
        modify: 'Modify',
        modifyDone: 'Modify Done',
        deleteToRecycleBin: 'Delete to Recycle Bin',
        allDelete: 'All Delete',
        exportNotes: 'Export Notes',
        importNotes: 'Import Notes (json)',
        complete: 'Complete',
        cancelComplete: 'Cancel Complete',
        allComplete: 'All Complete'
    },
    zhongwen: {
        inputTitle: '请输入标题',
        inputContent: '请输入内容',
        submit: '提交',
        allSelect: '全选',
        noteHead2: '今朝所学今朝记，笔记勤书莫延迟！',
        expand: '展开',
        collapse: '收起',
        manage: '管理',
        all: '全部',
        urgent: '重点加急',
        cancelUrgent: '取消加急',
        recycleBin: '回收站',
        modify: '修改',
        modifyDone: '修改完成',
        deleteToRecycleBin: '删除至回收站',
        allDelete: '全部删除',
        exportNotes: '导出笔记',
        importNotes: '导入笔记(json)',
        complete: '完成',
        cancelComplete: '取消完成',
        allComplete: '全部完成'
    }
};

// 全局错误捕获
window.addEventListener('error', (e) => {
    console.error('应用错误:', e.error);
    showNotification('应用发生错误，请检查控制台', 'error');
});

// 增强转义函数
function escapeHtml(unsafe) {
    return unsafe.replace(/[&<"'>]/g, match => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[match]));
}

// 显示通知
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.prepend(notification);
    setTimeout(() => notification.remove(), 3000);
}

// 输入验证
function validateInput(title, content) {
    const errors = [];
    if (!title.trim()) errors.push('标题不能为空');
    if (!content.trim()) errors.push('内容不能为空');
    return errors;
}

// 防抖函数
function debounce(func, delay) {
    let timer;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(context, args), delay);
    };
}

// 笔记存储管理类
class NoteStore {
    constructor() {
        this.notes = StorageService.load('notes');
        this.recycleBin = StorageService.load('recycleBin');
    }

    // 添加新笔记
    addNote(note) {
        this.notes.unshift(note);
        this.saveNotes();
    }

    // 将笔记移动到回收站
    moveToRecycleBin(index) {
        const note = this.notes.splice(index, 1)[0];
        this.recycleBin.push(note);
        this.saveNotes();
        this.saveRecycleBin();
    }

    // 从回收站恢复笔记
    restoreFromRecycleBin(index) {
        const note = this.recycleBin.splice(index, 1)[0];
        this.notes.push(note);
        this.saveNotes();
        this.saveRecycleBin();
    }

    // 彻底从回收站删除笔记
    deleteFromRecycleBin(index) {
        this.recycleBin.splice(index, 1);
        this.saveRecycleBin();
    }

    // 修改笔记内容
    modifyNote(index, title, content) {
        this.notes[index].title = title;
        this.notes[index].content = content;
        this.saveNotes();
    }

    // 选择或取消选择笔记
    selectNote(index, isSelected) {
        this.notes[index].isSelected = isSelected;
        this.saveNotes();
    }

    // 全选笔记
    selectAll() {
        this.notes.forEach(note => {
            note.isSelected = true;
        });
        this.saveNotes();
    }

    // 取消全选笔记
    unselectAll() {
        this.notes.forEach(note => note.isSelected = false);
        this.saveNotes();
    }

    // 设置笔记为加急状态
    setUrgent(index, isUrgent) {
        this.notes[index].isUrgent = isUrgent;
        this.saveNotes();
    }

    // 设置笔记完成状态
    setCompleted(index, isCompleted) {
        this.notes[index].isCompleted = isCompleted;
        this.saveNotes();
    }

    setAllCompleted(isCompleted) {
        this.notes.forEach(note => {
            note.isCompleted = isCompleted;
        });
        this.saveNotes();
    }

    // 取消笔记完成状态
    unsetCompleted(index) {
        this.notes[index].isCompleted = false;
        this.saveNotes();
    }

    // 保存笔记数据到本地存储
    saveNotes() {
        StorageService.save('notes', this.notes);
    }

    // 保存回收站数据到本地存储
    saveRecycleBin() {
        StorageService.save('recycleBin', this.recycleBin);
    }

    clearRecycleBin() {
        this.recycleBin = [];
        this.saveRecycleBin();
    }
}


const noteStore = new NoteStore();

// 更新全选按钮状态
function updateSelectAllButton(showRecycleBin = false) {
    const notes = showRecycleBin ? noteStore.recycleBin : noteStore.notes;
    const allSelected = notes.every(note => note.isSelected);
    const quanxuan = document.querySelector('.quanxuan');
    quanxuan.value = allSelected ? '取消全选' : '全选';
}

// 处理提交
function handleSubmit() {
    const biaoti = document.querySelector('.biaoti');
    const neirong = document.querySelector('.neirong');

    if (biaoti && neirong) {
        const title = biaoti.value;
        const content = neirong.value;
        const errors = validateInput(title, content);
        if (errors.length) {
            showNotification(errors.join('\n'), 'error');
            return;
        }
        const clickTime = new Date().toLocaleString();
        const newNote = {
            title,
            content,
            time: clickTime,
            isSelected: false,
            isDeleted: false,
            isUrgent: false,
            isCompleted: false
        };
        noteStore.addNote(newNote);
        renderNotes();
        biaoti.value = '';
        neirong.value = '';
        showNotification('笔记已成功保存！');
    }
}

// 处理删除到回收站
function handleDelete() {
    document.querySelector('.flist4_shanchu').addEventListener('click', () => {
        const selectedNotes = noteStore.notes.filter(note => note.isSelected);
        selectedNotes.forEach(selectedNote => {
            const index = noteStore.notes.findIndex(note => note === selectedNote);
            noteStore.moveToRecycleBin(index);
        });
        noteStore.unselectAll();
        renderNotes();
    });
}

// 处理修改
function handleModify() {
    const modifyBtn = document.querySelector('.flist4_xiugai');
    const modifyDoneBtn = document.querySelector('.flist4_xiugaiwancheng');

    modifyBtn.addEventListener('click', function () {
        const selectedNotes = document.querySelectorAll('.note2.nSelected');
        if (selectedNotes.length !== 1) {
            alert('只能选择一个笔记进行修改！');
            return;
        }
        const li = selectedNotes[0];
        const index = li.dataset.index;
        const note = noteStore.notes[index];

        const titleSpan = li.querySelector('span');
        const contentSpan = li.querySelectorAll('span')[1];
        const title = titleSpan.textContent.split(': ')[1];
        const content = contentSpan.textContent.split(': ')[1];

        const titleInput = document.createElement('input');
        titleInput.value = title;
        titleInput.classList.add('modify-title-input');

        const contentInput = document.createElement('input');
        contentInput.value = content;
        contentInput.classList.add('modify-content-input');

        titleSpan.replaceWith(titleInput);
        contentSpan.replaceWith(contentInput);

        modifyBtn.style.display = 'none';
        modifyDoneBtn.style.display = 'inline-block';

        modifyDoneBtn.addEventListener('click', function () {
            const newTitle = titleInput.value;
            const newContent = contentInput.value;
            const errors = validateInput(newTitle, newContent);
            if (errors.length) {
                showNotification(errors.join('\n'), 'error');
                return;
            }
            noteStore.modifyNote(index, newTitle, newContent);
            renderNotes();
            modifyBtn.style.display = 'inline-block';
            modifyDoneBtn.style.display = 'none';
        });
    });
}

// 处理重点加急
function handleUrgent() {
    document.querySelectorAll('.flist3_jiaji').forEach(urgentBtn => {
        urgentBtn.addEventListener('click', function () {
            const selectedNotes = noteStore.notes.filter(note => note.isSelected);
            selectedNotes.forEach(selectedNote => {
                const index = noteStore.notes.findIndex(note => note === selectedNote);
                noteStore.setUrgent(index, true);
            });
            renderNotes();
        });
    });
}

// 处理取消加急
function handleCancelUrgent() {
    document.querySelectorAll('.flist3_qvxiaojiaji').forEach(cancelUrgentBtn => {
        cancelUrgentBtn.addEventListener('click', function () {
            const selectedNotes = noteStore.notes.filter(note => note.isSelected);
            const nonUrgentSelected = selectedNotes.some(note => !note.isUrgent);
            if (nonUrgentSelected) {
                alert('选中的笔记中存在非加急笔记，无法取消加急！');
                return;
            }
            selectedNotes.forEach(selectedNote => {
                const index = noteStore.notes.findIndex(note => note === selectedNote);
                noteStore.setUrgent(index, false);
            });
            renderNotes();
        });
    });
}

// 处理选择
function handleSelect() {
    document.querySelector('.note1').addEventListener('click', (e) => {
        const target = e.target.closest('.note1_3');
        if (target) {
            const li = target.closest('.note2');
            const index = li.dataset.index;
            noteStore.selectNote(index, !target.classList.contains('nCheck'));
            target.classList.toggle('nNull');
            target.classList.toggle('nCheck');
            updateSelectAllButton();
            renderNotes();
        }
    });
}

// 处理全选
function handleAllSelect() {
    const quanxuan = document.querySelector('.quanxuan');
    quanxuan.addEventListener('click', function () {
        const allSelected = noteStore.notes.every(note => note.isSelected);
        if (allSelected) {
            noteStore.unselectAll();
            quanxuan.value = '全选';
        } else {
            noteStore.selectAll();
            quanxuan.value = '取消全选';
        }
        renderNotes();
    });
}

// 处理搜索功能
function handleSearch() {
    const head1 = document.querySelector('.head');
    const searchInput = document.createElement('input');
    searchInput.placeholder = '请输入搜索内容（标题或内容）';
    const noteHead = document.querySelector('.noteHead');
    head1.appendChild(searchInput);
    searchInput.className = 'search';
    searchInput.addEventListener('input', debounce((e) => {
        const query = e.target.value.trim().toLowerCase();
        renderNotes(query);
    }, 300));
}

function time(type) {
    if (type === 1) {
        const now = new Date();
        const hour = now.getHours() % 12;
        const minute = now.getMinutes();
        const second = now.getSeconds();
        const years1 = now.getFullYear();
        const month1 = now.getMonth() + 1;
        const day1 = now.getDate();
        const hours1 = now.getHours();
        const minutes1 = now.getMinutes();
        const seconds1 = now.getSeconds();
        const hourAngle = (hour * 30 + minute * 0.5);
        const minuteAngle = (minute * 6 + second * 0.1);
        const secondAngle = second * 6;
        const hourHand = document.querySelector('.hour');
        const minuteHand = document.querySelector('.minute');
        const secondHand = document.querySelector('.second');
        hourHand.style.transform = `translate(-50%, -100%) rotate(${hourAngle}deg)`;
        minuteHand.style.transform = `translate(-50%, -100%) rotate(${minuteAngle}deg)`;
        secondHand.style.transform = `translate(-50%, -100%) rotate(${secondAngle}deg)`;
        const years = document.querySelector('.year');
        const month = document.querySelector('.month');
        const day = document.querySelector('.day');
        const hours = document.querySelector('.hours');
        const minutes = document.querySelector('.minutes');
        const seconds = document.querySelector('.seconds');
        years.textContent = years1;
        month.textContent = month1;
        day.textContent = day1;
        hours.textContent = hours1;
        minutes.textContent = minutes1;
        seconds.textContent = seconds1;
    }
}

// 时钟动画
let clockActive = true;
function updateClock() {
    if (clockActive) {
        time(1);
        requestAnimationFrame(updateClock);
    }
}

// 页面隐藏时暂停时钟动画
document.addEventListener('visibilitychange', () => {
    clockActive = !document.hidden;
});

// 设置随机背景
function setRandomBackground() {
    const background = document.querySelector('.background');
    if (background) {
        const background_tupian = ['tupian/1.jpg', 'tupian/2.jpg', 'tupian/3.jpg', 'tupian/4.jpg',
            'tupian/5.jpg', 'tupian/6.jpg', 'tupian/7.jpg', 'tupian/8.jpg', 'tupian/9.jpg'
        ];
        const i = Math.floor(Math.random() * 9);
        background.style.backgroundImage = `url(${background_tupian[i]})`;
    }
}

// 处理输入阴影
function handleInputShadow(inputElement) {
    if (inputElement) {
        let a = false;

        inputElement.addEventListener('focus', function () {
            this.style.boxShadow = 'none';
            this.style.webkitBoxShadow = 'none';
        });

        inputElement.addEventListener('blur', function () {
            if (!a) {
                this.style.boxShadow = '4px 4px 0px #33322E';
                this.style.webkitBoxShadow = '4px 4px 0px #33322E';
            }
        });

        inputElement.addEventListener('mouseover', function () {
            a = true;
            this.style.boxShadow = 'none';
            this.style.webkitBoxShadow = 'none';
        });

        inputElement.addEventListener('mouseout', function () {
            a = false;
            if (!this.matches(':focus')) {
                this.style.boxShadow = '4px 4px 0px #33322E';
                this.style.webkitBoxShadow = '4px 4px 0px #33322E';
            }
        });
    }
}

// 重置输入阴影
function resetInputShadow() {
    const biaoti = document.querySelector('.biaoti');
    const neirong = document.querySelector('.neirong');
    const shadow1 = document.querySelectorAll('.shadow');
    handleInputShadow(biaoti);
    handleInputShadow(neirong);
    shadow1.forEach(handleInputShadow);
}

// 多语言切换
function switchLanguage(lang) {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        el.textContent = languageDict[lang][el.dataset.i18n];
    });

    const btnTexts = {
        '.quanxuan': 'allSelect',
        '.noteHead2': 'noteHead2',
        '.flist1_2': 'expand',
        '.flist1_3': 'manage',
        '.flist3_quanbu': 'all',
        '.flist3_jiaji': 'urgent',
        '.flist3_qvxiaojiaji': 'cancelUrgent',
        '.flist3_huishouzhan': 'recycleBin',
        '.flist4_xiugai': 'modify',
        '.flist4_xiugaiwancheng': 'modifyDone',
        '.flist4_shanchu': 'deleteToRecycleBin',
        '.flist4_quanbushanchu': 'allDelete',
        '.flist5_daochu': 'exportNotes',
        '.flist5_daoru': 'importNotes',
        '.tijiao': 'submit',
        '.flist3_complete': 'complete',
        '.flist3_cancelComplete': 'cancelComplete',
        '.flist3_allComplete': 'allComplete'
    };

    Object.keys(btnTexts).forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (el.tagName === 'INPUT') {
                el.value = languageDict[lang][btnTexts[selector]];
            } else {
                el.textContent = languageDict[lang][btnTexts[selector]];
            }
        });
    });
}

// 更新功能按钮的可见性
function updateFunctionButtonsVisibility(showRecycleBin = false) {
    const notes = showRecycleBin ? noteStore.recycleBin : noteStore.notes;
    const hasNotes = notes.length > 0;
    const hasUrgentNotes = notes.some(note => note.isUrgent);
    const hasCompletedNotes = notes.some(note => note.isCompleted);
    const hasSelectedNotes = notes.some(note => note.isSelected);

    const buttons = [
        '.flist3_jiaji',
        '.flist3_qvxiaojiaji',
        '.flist4_xiugai',
        '.flist4_shanchu',
        '.flist4_quanbushanchu',
        '.flist5_daochu',
        '.flist3_huishouzhan',
        '.flist4_wancheng',
        '.flist4_qvxiaowancheng'
    ];

    buttons.forEach(button => {
        const element = document.querySelector(button);
        if (element) {
            switch (button) {
                case '.flist3_jiaji':
                    element.style.display = hasNotes && !showRecycleBin ? 'block' : 'none';
                    break;
                case '.flist3_qvxiaojiaji':
                    element.style.display = hasUrgentNotes && !showRecycleBin ? 'block' : 'none';
                    break;
                case '.flist4_xiugai':
                    element.style.display = hasSelectedNotes && hasNotes && !showRecycleBin ? 'block' : 'none';
                    break;
                case '.flist4_shanchu':
                    element.style.display = hasSelectedNotes && hasNotes && !showRecycleBin ? 'block' : 'none';
                    break;
                case '.flist4_quanbushanchu':
                    element.style.display = hasNotes && !showRecycleBin ? 'block' : 'none';
                    break;
                case '.flist5_daochu':
                    element.style.display = hasNotes && !showRecycleBin ? 'block' : 'none';
                    break;
                case '.flist4_wancheng':
                    element.style.display = hasSelectedNotes && hasNotes && !showRecycleBin ? 'block' : 'none';
                    break;
                case '.flist4_quxiaowancheng':
                    element.style.display = hasCompletedNotes && hasSelectedNotes && !showRecycleBin ? 'block' : 'none';
                    break;
            }
        }
    });
}

// 确保 localStorage 可用
if (!window.localStorage) {
    showNotification('浏览器不支持本地存储！', 'error');
}

// 确保 Element.closest 可用
if (!Element.prototype.closest) {
    Element.prototype.closest = function (selector) {
        let element = this;
        while (element) {
            if (element.matches(selector)) {
                return element;
            }
            element = element.parentElement;
        }
        return null;
    };
}

// 处理完成操作
function handleComplete() {
    document.querySelector('.flist4_wancheng').addEventListener('click', function () {
        const selectedNotes = noteStore.notes.filter(note => note.isSelected);
        selectedNotes.forEach(selectedNote => {
            const index = noteStore.notes.findIndex(note => note === selectedNote);
            noteStore.setCompleted(index, true);
        });
        renderNotes();
    });
}

// 处理取消完成操作
function handleCancelComplete() {
    document.querySelectorAll('.flist4_quxiaowancheng').forEach(cancelCompleteBtn => {
        cancelCompleteBtn.addEventListener('click', function () {
            const selectedNotes = noteStore.notes.filter(note => note.isSelected);
            const nonCompletedSelected = selectedNotes.some(note => !note.isCompleted);
            if (nonCompletedSelected) {
                alert('选中的笔记中存在未完成笔记，无法取消完成！');
                return;
            }
            selectedNotes.forEach(selectedNote => {
                const index = noteStore.notes.findIndex(note => note === selectedNote);
                noteStore.unsetCompleted(index);
            });
            renderNotes();
        });
    });
}

// 渲染笔记时，根据 isCompleted 显示不同样式
function renderNotes(query = '', showRecycleBin = false) {
    const noteList = document.querySelector('.note1');
    const noteStore = new NoteStore();
    let notes = showRecycleBin ? noteStore.recycleBin : noteStore.notes;
    if (query) {
        notes = SearchService.search(query, notes);
    }
    const fragment = document.createDocumentFragment();
    notes.forEach((note, index) => {
        const newLi = document.createElement('li');
        newLi.classList.add('note2');
        if (note.isSelected) {
            newLi.classList.add('nSelected');
        }
        if (note.isUrgent) {
            newLi.classList.add('nUrgent');
        }
        if (note.isCompleted) {
            newLi.classList.add('nCompleted');
        }
        newLi.dataset.index = index;
        // 右侧圆圈用于选择笔记
        const statusDiv = document.createElement('div');
        statusDiv.classList.add('note1_3', note.isSelected ? 'nCheck' : 'nNull');
        statusDiv.style.cursor = 'pointer';
        statusDiv.addEventListener('click', () => {
            if (!showRecycleBin) {
                noteStore.selectNote(index, !note.isSelected);
                renderNotes(query, showRecycleBin);
            }
        });
        const contentWrapper = document.createElement('div');
        contentWrapper.style.display = 'flex';
        contentWrapper.style.marginLeft = '10px';
        contentWrapper.style.flexDirection = 'column';
        contentWrapper.style.gap = '5px';
        const titleSpan = document.createElement('span');
        titleSpan.textContent = `标题: ${escapeHtml(note.title)}`;
        if (note.isCompleted) {
            titleSpan.style.textDecoration = 'line-through';
        }
        const contentSpan = document.createElement('span');
        contentSpan.textContent = `内容: ${escapeHtml(note.content)}`;
        if (note.isCompleted) {
            contentSpan.style.textDecoration = 'line-through';
        }
        const timeSpan = document.createElement('span');
        timeSpan.textContent = `时间: ${note.time}`;
        const urgentSpan = document.createElement('span');
        if (note.isUrgent) {
            urgentSpan.textContent = '加急';
            urgentSpan.style.color = 'red';
        }
        contentWrapper.appendChild(titleSpan);
        contentWrapper.appendChild(contentSpan);
        contentWrapper.appendChild(timeSpan);
        if (note.isUrgent) {
            contentWrapper.appendChild(urgentSpan);
        }
        if (note.isCompleted) {
            const completedSpan = document.createElement('span');
            completedSpan.textContent = '完成';
            contentWrapper.appendChild(completedSpan);
        }
        newLi.appendChild(statusDiv);
        newLi.appendChild(contentWrapper);
        if (showRecycleBin) {
            // 回收站中的恢复按钮
            const restoreDiv = document.createElement('div');
            restoreDiv.classList.add('nRestore');
            restoreDiv.textContent = '恢复';
            restoreDiv.style.cursor = 'pointer';
            restoreDiv.addEventListener('click', () => {
                noteStore.restoreFromRecycleBin(index);
                renderNotes(query, showRecycleBin);
            });
            newLi.appendChild(restoreDiv);
            // 回收站中的彻底删除按钮
            const deleteDiv = document.createElement('div');
            deleteDiv.classList.add('nDelete');
            deleteDiv.textContent = '彻底删除';
            deleteDiv.style.cursor = 'pointer';
            deleteDiv.addEventListener('click', () => {
                noteStore.deleteFromRecycleBin(index);
                renderNotes(query, showRecycleBin);
            });
            newLi.appendChild(deleteDiv);
        }
        fragment.appendChild(newLi);
    });
    noteList.innerHTML = '';
    noteList.appendChild(fragment);
    const quanxuan = document.querySelector('.quanxuan');
    if (notes.length > 0) {
        quanxuan.style.display = 'inline-block';
    } else {
        quanxuan.style.display = 'none';
    }
    updateFunctionButtonsVisibility(showRecycleBin);
    updateSelectAllButton(showRecycleBin);
}

// 处理右侧功能框按钮点击
function handleRightButtons() {
    const rightButtons = document.querySelectorAll('.flist3 button');
    rightButtons.forEach(button => {
        button.addEventListener('click', () => {
            renderNotes();
        });
    });
}

// 处理展开和收起
function handleExpandCollapse() {
    const expandButton = document.querySelector('.flist1_2');
    const functionBlock1 = document.querySelector('.flist3');
    const functionBlock2 = document.querySelector('.flist4');
    const functionBlock3 = document.querySelector('.flist5');
    const manageBlock = document.querySelector('.flist1_3');

    expandButton.addEventListener('click', () => {
        if (expandButton.textContent === languageDict.zhongwen.expand || expandButton.textContent === languageDict.English.expand) {
            expandButton.textContent = languageDict.zhongwen.collapse;
            if (languageDict.English) {
                expandButton.textContent = languageDict.English.collapse;
            }
            functionBlock1.style.display = 'none';
            functionBlock2.style.display = 'none';
            functionBlock3.style.display = 'none';
            manageBlock.style.display = 'block';
        } else {
            expandButton.textContent = languageDict.zhongwen.expand;
            if (languageDict.English) {
                expandButton.textContent = languageDict.English.expand;
            }
            functionBlock1.style.display = 'block';
            functionBlock2.style.display = 'block';
            functionBlock3.style.display = 'block';
            manageBlock.style.display = 'none';
        }
    });
}

// 导入笔记 JSON 文件
function importNotes(event) {
    const input = event.target;
    if (input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedNotes = JSON.parse(e.target.result);
            const noteStore = new NoteStore();
            noteStore.notes = importedNotes;
            noteStore.saveNotes();
            renderNotes();
            showNotification('笔记导入成功', 'success');
        } catch (error) {
            console.error('导入笔记时出错:', error);
            showNotification('笔记导入失败，请检查文件格式', 'error');
        }
    };
    reader.onerror = function () {
        showNotification('读取文件时出错', 'error');
    };
    reader.readAsText(file);
}

function initApp() {
    setRandomBackground();
    resetInputShadow();
    updateClock();
    const submitButton = document.querySelector('.tijiao');
    if (submitButton) {
        submitButton.addEventListener('click', handleSubmit);
    }
    renderNotes();
    handleDelete();
    handleModify();
    handleUrgent();
    handleCancelUrgent();
    handleSelect();
    handleAllSelect();
    document.querySelectorAll('.language a').forEach(link => {
        link.addEventListener('click', function () {
            const lang = this.classList.contains('English') ? 'English' : 'zhongwen';
            switchLanguage(lang);
        });
    });
    handleSearch();
    const exportButton = document.querySelector('.flist5_daochu');
    if (exportButton) {
        exportButton.addEventListener('click', exportNotes);
    }
    const importInput = document.querySelector('.flist5_daoru');
    if (importInput) {
        importInput.addEventListener('change', importNotes);
    }
    const recycleBinButton = document.querySelector('.flist3_huishouzhan');
    recycleBinButton.addEventListener('click', function () {
        const isRecycleBin1 = this.textContent === languageDict.zhongwen.recycleBin || this.textContent === languageDict.English.recycleBin;
        renderNotes('', isRecycleBin1);
        const isRecycleBin = this.value === '回收站';
        renderNotes('', isRecycleBin);
    });
    handleComplete();
    handleCancelComplete();
    handleRightButtons();
    handleExpandCollapse();
}

// 导出笔记为 JSON 文件
function exportNotes() {
    const noteStore = new NoteStore();
    const notes = noteStore.notes;
    const jsonData = JSON.stringify(notes, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'notes_export.json';
    link.click();
    URL.revokeObjectURL(url);
}

window.onload = function () {
    initApp();
    window.addEventListener('beforeunload', () => {
        noteStore.saveNotes();
    });
};

document.addEventListener('DOMContentLoaded', function () {
    const customButton = document.querySelector('.custom-import-button');
    const fileInput = document.querySelector('.flist5_daoru');
    customButton.addEventListener('click', function () {
        fileInput.click();
    });
});
