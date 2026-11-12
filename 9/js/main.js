/* 首页交互：Tab 切换 + 用 fetch 读取项目数据 */

const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('section');

tabButtons.forEach(function (button) {
    button.addEventListener('click', function () {
        tabButtons.forEach(function (item) {
            item.classList.remove('active');
        });
        tabContents.forEach(function (item) {
            item.classList.remove('show');
        });
        this.classList.add('active');
        document.getElementById(this.dataset.id).classList.add('show');
    });
});

const projectList = document.getElementById('project-list');

function renderProjects(projects) {
    if (!projectList) return;
    projectList.innerHTML = '';

    projects.forEach(function (project) {
        const item = document.createElement('li');

        const name = document.createElement('strong');
        name.textContent = project.name;

        const desc = document.createElement('span');
        desc.textContent = project.desc;

        const tech = document.createElement('em');
        tech.textContent = project.tech;

        item.appendChild(name);
        item.appendChild(desc);
        item.appendChild(tech);
        projectList.appendChild(item);
    });
}

function renderMessage(text, className) {
    if (!projectList) return;
    projectList.innerHTML = '';
    const item = document.createElement('li');
    item.className = className;
    item.textContent = text;
    projectList.appendChild(item);
}

/*
 * 真实网络请求：GET data/projects.json
 * 打开 F12 → Network → Fetch/XHR，可以看到这条请求。
 */
fetch('data/projects.json')
    .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
    })
    .then(function (projects) {
        renderProjects(projects);
    })
    .catch(function (error) {
        renderMessage(
            '项目数据加载失败：' + error.message + '（请通过 HTTP 打开页面，不要直接双击 HTML）',
            'error'
        );
    });
