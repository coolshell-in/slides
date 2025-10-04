// main.js - 主页面加载逻辑

/**
 * 加载指定子目录的 index.html 文件内容到主内容区域。
 * @param {string} subdir - 子目录名称 (例如, 'house')。
 */
function loadContent(subdir) {
    const contentDiv = document.getElementById('content');
    // 构造要获取的文件的 URL。因为链接是 <a href="house">，
    // 所以 subdir 就是 'house'。我们加载的是 house/index.html。
    const urlToFetch = `${subdir}/index.html`;

    // 可选：显示加载指示器
    contentDiv.innerHTML = '<p>Loading...</p>';

    fetch(urlToFetch)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                     throw new Error(`子系统 '${subdir}' 未找到。请检查文件是否存在。`);
                } else {
                    throw new Error(`HTTP 错误! 状态: ${response.status}`);
                }
            }
            return response.text();
        })
        .then(html => {
            // --- 关键修改点 ---
            // 1. 注入 HTML 内容
            contentDiv.innerHTML = html;

            // 2. 执行注入的 HTML 中的脚本
            // 子系统的 index.html 包含了它自己的 <script>。
            // 直接 innerHTML 不会执行这些脚本，需要手动处理。
            const scripts = contentDiv.querySelectorAll('script');
            const scriptPromises = []; // 用于等待所有脚本加载完成

            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                let scriptPromise = Promise.resolve(); // 默认Promise

                // 复制所有属性 (如 type, async, defer, src)
                [...oldScript.attributes].forEach(attr => newScript.setAttribute(attr.name, attr.value));

                if (oldScript.src) {
                    // 对于外部脚本，创建一个Promise来等待它加载
                    scriptPromise = new Promise((resolve, reject) => {
                        newScript.onload = resolve;
                        newScript.onerror = reject;
                    });
                } else {
                    // 对于内联脚本，直接复制文本内容
                    newScript.textContent = oldScript.textContent;
                }

                scriptPromises.push(scriptPromise);
                // 将新脚本添加到 contentDiv（或 document.body）以执行它
                contentDiv.appendChild(newScript);
                // 移除旧的、未执行的脚本标签
                oldScript.parentNode.removeChild(oldScript);
            });

            // 等待所有脚本（包括外部脚本）加载完成后再更新历史记录
            return Promise.all(scriptPromises);

        })
        .then(() => {
            // 3. 更新浏览器历史记录以反映新的子路径
            // 例如, 从 / 跳转到 /house
            window.history.pushState({subdir: subdir}, '', `${subdir}`);
        })
        .catch(error => {
            console.error("加载子系统时出错:", subdir, error);
            contentDiv.innerHTML = `<p>错误: ${error.message || '无法加载子系统。'}</p>`;
            // 可选：在出错时也更新历史记录
            window.history.pushState({error: true, subdir: subdir}, '', `${subdir}`);
        });
}

// --- 初始加载和导航处理 ---

/**
 * 根据浏览器当前的 location.pathname 确定初始子目录。
 * @returns {string|null} 子目录名称，如果在根路径则返回 null。
 */
function getCurrentSubdirFromPath() {
     // 获取完整的当前路径，例如 /house 或 /business
    const currentPath = window.location.pathname;

    // 移除可能存在的开头和结尾的斜杠，并按斜杠分割
    const pathParts = currentPath.split('/').filter(part => part !== '');

    // 如果路径部分存在，第一个非空部分就是子目录名
    // 例如, /house -> ['house'] -> 返回 'house'
    // 例如, / -> [] -> 返回 null
    return pathParts.length > 0 ? pathParts[0] : null;
}

/**
 * 处理页面初次加载。
 */
function handleInitialLoad() {
    const initialSubdir = getCurrentSubdirFromPath();
    if (initialSubdir) {
        // 如果 URL 是 http://localhost:8000/house, 则加载 house 子系统
        loadContent(initialSubdir);
    } else {
        // 在应用的根路径 (例如 http://localhost:8000/)
        // 使用相对路径 '.' 来替换状态，确保 URL 正确显示为 /
        window.history.replaceState({atRoot: true}, '', '.');
    }
}

// 处理浏览器的前进/后退按钮
window.addEventListener('popstate', (event) => {
    const pathSubdir = getCurrentSubdirFromPath();
    if (pathSubdir) {
        // 如果后退/前进到一个子系统路径，加载它
        loadContent(pathSubdir);
    } else {
        // 后退/前进到应用的根路径
        document.getElementById('content').innerHTML = '<p>Welcome to SLIDES by Atom.X</p>';
        // 使用相对路径 '.' 确保 URL 正确显示为 /
        window.history.replaceState({atRoot: true}, '', '.');
    }
});

// 在 DOM 加载完成后设置导航链接的点击处理程序
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            // 从相对 href 获取子目录名 (例如, 'house' from 'house')
            const subdir = event.target.getAttribute('href');
            loadContent(subdir);
        });
    });

    // 处理初始加载
    handleInitialLoad();
});



