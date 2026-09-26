// ==UserScript==
// @name        Automatic Download Assistant
// @name:zh-CN   自动下载助手
// @namespace    https://github.com/WuLinLee/auto-download-assistant
// @version      3.3.6
// @description skfmskdenoagvsio
// @description: nvweovnwioevwioevnwione
// @author      ai人类服务
// @license      MIT
// @homepage     https://github.com/WuLinLee/auto-download-assistant
// @homepageURL  https://github.com/WuLinLee/auto-download-assistant
// @supportURL   https://github.com/WuLinLee/auto-download-assistant/issues
// @updateURL    https://raw.githubusercontent.com/WuLinLee/auto-download-assistant/main/auto-download-assistant.user.js
// @downloadURL  https://raw.githubusercontent.com/WuLinLee/auto-download-assistant/main/auto-download-assistant.user.js
// @match        https://fitgirl-repacks.site/*

// @match        https://fuckingfast.co/*

// @grant        GM_openInTab
// @grant        window.close
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function() {
    'use strict';

    const translations = {
        'en': {
            'autoDownloader': 'Automatic Download Assistant',
            'selectAll': 'Select All',
            'deselectAll': 'Deselect All',
            'downloadSelected': 'Download Selected',
            'opening': 'Opening sequentially...',
            'selectFirst': 'Please select files to download first!',
            'part': 'Part'
        },
        'zh': {
            'autoDownloader': '自动下载助手',
            'selectAll': '全选',
            'deselectAll': '取消全选',
            'downloadSelected': '下载选中项',
            'opening': '正在依次打开...',
            'selectFirst': '请先选择要下载的文件！',
            'part': '部分'
        }
    };

    function detectLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0];
        return translations[langCode] || translations['en'];
    }

    const t = detectLanguage();

    if (window.location.hostname.includes('fitgirl-repacks.site')) {
        const currentPath = window.location.pathname;
        const isMainPage = currentPath === '/' || currentPath === '' ||
                          currentPath === '/index.html' ||
                          currentPath.match(/^\/page\/\d+\/?$/);

        if (isMainPage) {
            return;
        }

        const checkInterval = setInterval(() => {
            const links = document.querySelectorAll('a[href*="fuckingfast.co/"]');
            const entryContent = document.querySelector('.entry-content');

            if (links.length > 0 && entryContent) {
                clearInterval(checkInterval);

                if (document.getElementById('auto-downloader-container')) {
                    return;
                }

                const linkContainer = document.createElement('div');
                linkContainer.id = 'auto-downloader-container';
                linkContainer.style.marginTop = '20px';
                linkContainer.style.marginBottom = '20px';
                linkContainer.style.border = '2px solid #4CAF50';
                linkContainer.style.borderRadius = '5px';
                linkContainer.style.padding = '15px';
                linkContainer.style.backgroundColor = '#f0fff0';

                const title = document.createElement('h3');
                title.innerText = t.autoDownloader;
                title.style.marginTop = '0';
                linkContainer.appendChild(title);

                const listContainer = document.createElement('div');
                listContainer.style.display = 'flex';
                listContainer.style.flexDirection = 'column';
                listContainer.style.gap = '10px';

                links.forEach((link, index) => {
                    const originalUrl = link.href;
                    const fileName = originalUrl.split('#')[1] || `${t.part} ${index + 1}`;
                    const fileLabel = fileName.replace(/_/g, ' ');

                    const listItem = document.createElement('div');
                    listItem.style.display = 'flex';
                    listItem.style.alignItems = 'center';
                    listItem.style.gap = '8px';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = `download-item-${index}`;
                    checkbox.value = originalUrl;
                    checkbox.style.cursor = 'pointer';

                    const label = document.createElement('label');
                    label.htmlFor = `download-item-${index}`;
                    label.innerText = fileLabel;
                    label.style.cursor = 'pointer';

                    listItem.appendChild(checkbox);
                    listItem.appendChild(label);
                    listContainer.appendChild(listItem);
                });

                linkContainer.appendChild(listContainer);

                const selectAllButton = document.createElement('button');
                selectAllButton.innerText = t.selectAll;
                selectAllButton.style.marginTop = '10px';
                selectAllButton.style.padding = '8px 16px';
                selectAllButton.style.cursor = 'pointer';
                selectAllButton.style.border = '1px solid #2196F3';
                selectAllButton.style.borderRadius = '5px';
                selectAllButton.style.backgroundColor = '#2196F3';
                selectAllButton.style.color = 'white';
                selectAllButton.style.marginRight = '10px';

                let allSelected = false;
                selectAllButton.onclick = () => {
                    const checkboxes = document.querySelectorAll('#auto-downloader-container input[type="checkbox"]');
                    allSelected = !allSelected;
                    checkboxes.forEach(checkbox => {
                        checkbox.checked = allSelected;
                    });
                    selectAllButton.innerText = allSelected ? t.deselectAll : t.selectAll;
                };

                linkContainer.appendChild(selectAllButton);

                const downloadAllButton = document.createElement('button');
                downloadAllButton.innerText = t.downloadSelected;
                downloadAllButton.style.marginTop = '15px';
                downloadAllButton.style.padding = '10px 20px';
                downloadAllButton.style.cursor = 'pointer';
                downloadAllButton.style.border = '1px solid #4CAF50';
                downloadAllButton.style.borderRadius = '5px';
                downloadAllButton.style.backgroundColor = '#4CAF50';
                downloadAllButton.style.color = 'white';

                downloadAllButton.onclick = async () => {
                    const checkedItems = document.querySelectorAll('input[type="checkbox"]:checked');
                    if (checkedItems.length === 0) {
                        alert(t.selectFirst);
                        return;
                    }

                    downloadAllButton.disabled = true;
                    downloadAllButton.innerText = t.opening;

                    const urls = Array.from(checkedItems).map(item => item.value);

                    // 一个一个来：打开为“当前标签页”(active: true) → 等它自己关掉 → 再开下一个
                    for (let i = 0; i < urls.length; i++) {
                        downloadAllButton.innerText = `${t.opening} (${i + 1}/${urls.length})`;

                        await new Promise(resolve => {
                            const tab = GM_openInTab(urls[i], {
                                active: true,
                                insert: true,
                                setParent: true
                            });

                            if (tab && typeof tab.onclose !== 'undefined') {
                                tab.onclose = () => resolve();
                            } else {
                                // 兜底：老版本管理器拿不到 onclose，30 秒后开下一个
                                setTimeout(resolve, 30000);
                            }
                        });
                    }

                    downloadAllButton.disabled = false;
                    downloadAllButton.innerText = t.downloadSelected;
                };

                linkContainer.appendChild(downloadAllButton);
                entryContent.prepend(linkContainer);
            }
        }, 1000);
    }

    if (window.location.hostname.includes('fuckingfast.co')) {
        const interval = setInterval(() => {
            const downloadButton = document.querySelector('a.link-button.text-5xl.gay-button');
            if (downloadButton) {
                clearInterval(interval);
                downloadButton.click();
                setTimeout(() => {
                    window.close();
                }, 5000);
            }
        }, 1000);
    }
})();
