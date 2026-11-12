/* 详情页：任务清单的增删改查 */

const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');

let taskArr = [];

function render() {
    taskList.innerHTML = '';

    taskArr.forEach(function (item, idx) {
        const row = document.createElement('div');
        row.className = 'task-item' + (item.done ? ' done' : '');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = item.done;
        checkbox.addEventListener('change', function () {
            toggle(idx);
        });

        const text = document.createElement('span');
        text.className = 'task-text';
        text.textContent = item.text;

        row.appendChild(checkbox);
        row.appendChild(text);
        taskList.appendChild(row);
    });
}

function addTask() {
    const val = taskInput.value.trim();
    if (!val) return;

    taskArr.push({ text: val, done: false });
    taskInput.value = '';
    taskInput.focus();
    render();
}

function toggle(i) {
    taskArr[i].done = !taskArr[i].done;
    render();
}

addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') addTask();
});

render();
